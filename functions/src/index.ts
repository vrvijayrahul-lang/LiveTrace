import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';
import { z } from 'zod';

admin.initializeApp();
const db = admin.firestore();

// Helper to hash token using SHA-256
function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken.trim()).digest('hex');
}

// Coordinate validation schema
const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().min(0).max(100000),
  altitude: z.number().nullable().optional(),
  speed: z.number().nullable().optional(),
  heading: z.number().nullable().optional(),
  capturedAt: z.number().int().positive(),
});

/**
 * 1. Validate Share Token
 * Returns safe public metadata for the recipient consent page without exposing ownerUid or coordinates.
 */
export const validateShareToken = functions.https.onCall(async (data: any) => {
  const { token } = data || {};
  if (!token || typeof token !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'Missing or invalid token.');
  }

  const tokenHash = hashToken(token);
  const snapshot = await db
    .collection('trackingSessions')
    .where('tokenHash', '==', tokenHash)
    .limit(1)
    .get();

  if (snapshot.empty) {
    throw new functions.https.HttpsError('not-found', 'Session link not found or expired.');
  }

  const sessionDoc = snapshot.docs[0];
  const session = sessionDoc.data();
  const now = Date.now();
  const isExpired = now > session.expiresAt;

  return {
    id: sessionDoc.id,
    title: session.title,
    description: session.description || '',
    ownerDisplayName: session.ownerDisplayName || 'LocateFlow User',
    status: isExpired && session.status !== 'revoked' ? 'expired' : session.status,
    expiresAt: session.expiresAt,
    consentStatus: session.consentStatus,
    isExpired,
  };
});

/**
 * 2. Record Recipient Consent
 * Explicitly transition consent status to granted or declined.
 */
export const recordRecipientConsent = functions.https.onCall(async (data: any) => {
  const { token, consent } = data || {};
  if (!token || (consent !== 'granted' && consent !== 'declined')) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid token or consent choice.');
  }

  const tokenHash = hashToken(token);
  const snapshot = await db
    .collection('trackingSessions')
    .where('tokenHash', '==', tokenHash)
    .limit(1)
    .get();

  if (snapshot.empty) {
    throw new functions.https.HttpsError('not-found', 'Session link not found.');
  }

  const sessionDoc = snapshot.docs[0];
  const session = sessionDoc.data();
  const now = Date.now();

  if (now > session.expiresAt || session.status === 'revoked') {
    throw new functions.https.HttpsError('failed-precondition', 'Session is expired or revoked.');
  }

  await sessionDoc.ref.update({
    consentStatus: consent,
    status: consent === 'granted' ? 'active' : 'stopped',
    sharingStartedAt: consent === 'granted' ? now : null,
    sharingStoppedAt: consent === 'declined' ? now : null,
    lastUpdatedAt: now,
  });

  return { success: true, status: consent === 'granted' ? 'active' : 'stopped' };
});

/**
 * 3. Authorized Location Update
 * Verifies token hash, validates coordinate bounding boxes, and writes current location.
 */
export const updateAuthorizedLocation = functions.https.onCall(async (data: any) => {
  const { token, coords } = data || {};
  if (!token || !coords) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing token or coordinates.');
  }

  const validation = locationSchema.safeParse(coords);
  if (!validation.success) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Coordinates failed bounding validation: ' + JSON.stringify(validation.error.flatten())
    );
  }

  const tokenHash = hashToken(token);
  const snapshot = await db
    .collection('trackingSessions')
    .where('tokenHash', '==', tokenHash)
    .limit(1)
    .get();

  if (snapshot.empty) {
    throw new functions.https.HttpsError('not-found', 'Session not found.');
  }

  const sessionDoc = snapshot.docs[0];
  const session = sessionDoc.data();
  const now = Date.now();

  // Enforce session state & 24h hard expiry
  if (session.status !== 'active' || now > session.expiresAt || session.status === 'revoked') {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Session is not active or has expired. Updates rejected.'
    );
  }

  const locationData = {
    ...validation.data,
    receivedAt: now,
    serverTimestamp: admin.firestore.FieldValue.serverTimestamp(),
  };

  await sessionDoc.ref.collection('location').doc('current').set(locationData);
  await sessionDoc.ref.update({ lastUpdatedAt: now });

  return { success: true };
});

/**
 * 4. Stop Sharing by Recipient
 */
export const stopSharingRecipient = functions.https.onCall(async (data: any) => {
  const { token } = data || {};
  if (!token) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing token.');
  }

  const tokenHash = hashToken(token);
  const snapshot = await db
    .collection('trackingSessions')
    .where('tokenHash', '==', tokenHash)
    .limit(1)
    .get();

  if (snapshot.empty) {
    throw new functions.https.HttpsError('not-found', 'Session not found.');
  }

  const sessionDoc = snapshot.docs[0];
  const now = Date.now();

  await sessionDoc.ref.update({
    status: 'stopped',
    sharingStoppedAt: now,
    lastUpdatedAt: now,
  });

  return { success: true };
});

/**
 * 5. Revoke Session by Owner
 */
export const revokeSession = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
  }

  const { sessionId } = data || {};
  if (!sessionId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing sessionId.');
  }

  const sessionRef = db.collection('trackingSessions').doc(sessionId);
  const doc = await sessionRef.get();

  if (!doc.exists) {
    throw new functions.https.HttpsError('not-found', 'Session not found.');
  }

  if (doc.data()?.ownerUid !== context.auth.uid) {
    throw new functions.https.HttpsError('permission-denied', 'Unauthorized.');
  }

  const now = Date.now();
  await sessionRef.update({
    status: 'revoked',
    revokedAt: now,
    sharingStoppedAt: now,
  });

  return { success: true };
});
