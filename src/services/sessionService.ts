import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db, auth, isFirebaseConfigured } from '@/lib/firebase';
import { demoStore } from '@/services/demoStore';
import { generateSecureToken, hashToken } from '@/lib/crypto';
import type {
  TrackingSession,
  PublicSessionInfo,
  CreateSessionInput,
  CreatedSessionResult,
} from '@/types/session';

export const sessionService = {
  /**
   * Create a new 24-hour tracking session with cryptographically secure token.
   * Only the token hash is stored in Firestore.
   */
  async createSession(
    ownerUid: string,
    ownerDisplayName: string | undefined,
    input: CreateSessionInput
  ): Promise<CreatedSessionResult> {
    const rawToken = generateSecureToken();
    const tokenHash = await hashToken(rawToken);
    const now = Date.now();
    const expiresAt = now + 24 * 60 * 60 * 1000; // Fixed 24 hours
    const sessionId = 'trk_' + generateSecureToken().slice(0, 16);

    const session: TrackingSession = {
      id: sessionId,
      ownerUid,
      ownerDisplayName: ownerDisplayName || 'LocateFlow User',
      title: input.title.trim(),
      description: input.description?.trim() || '',
      status: 'pending',
      createdAt: now,
      expiresAt,
      consentStatus: 'none',
      tokenHash,
      lastUpdatedAt: null,
    };

    const isRealFirebaseUser = Boolean(
      isFirebaseConfigured && db && auth?.currentUser && !ownerUid.startsWith('demo-')
    );

    if (isRealFirebaseUser) {
      try {
        await setDoc(doc(db!, 'trackingSessions', sessionId), session);
      } catch (err) {
        console.warn('Firestore setDoc failed, saving to local store:', err);
        demoStore.saveSession(session);
      }
    } else {
      demoStore.saveSession(session);
    }

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://locateflow.app';
    const shareUrl = `${origin}/share/${rawToken}`;

    return {
      session,
      rawToken,
      shareUrl,
    };
  },

  /**
   * Get all sessions owned by the authenticated user
   */
  async getUserSessions(ownerUid: string): Promise<TrackingSession[]> {
    const isRealFirebaseUser = Boolean(
      isFirebaseConfigured && db && auth?.currentUser && !ownerUid.startsWith('demo-')
    );

    if (isRealFirebaseUser) {
      try {
        const q = query(
          collection(db!, 'trackingSessions'),
          where('ownerUid', '==', ownerUid),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        const now = Date.now();
        return snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as TrackingSession;
          if (data.status !== 'revoked' && data.status !== 'stopped' && now > data.expiresAt) {
            data.status = 'expired';
          }
          return data;
        });
      } catch (err) {
        console.warn('Firestore getUserSessions error, falling back to local store:', err);
      }
    }

    return demoStore.getSessions(ownerUid);
  },

  /**
   * Subscribe to real-time updates for a single session
   */
  subscribeToSession(sessionId: string, callback: (session: TrackingSession | null) => void): () => void {
    if (isFirebaseConfigured && db && !sessionId.startsWith('trk_demo')) {
      const docRef = doc(db, 'trackingSessions', sessionId);
      return onSnapshot(
        docRef,
        (docSnap) => {
          if (!docSnap.exists()) {
            callback(demoStore.getSessionById(sessionId));
            return;
          }
          const data = docSnap.data() as TrackingSession;
          if (data.status !== 'revoked' && data.status !== 'stopped' && Date.now() > data.expiresAt) {
            data.status = 'expired';
          }
          callback(data);
        },
        () => {
          callback(demoStore.getSessionById(sessionId));
        }
      );
    }

    // Demo store subscription
    const current = demoStore.getSessionById(sessionId);
    callback(current);
    return demoStore.subscribe(`session:${sessionId}`, (session) => callback(session));
  },

  /**
   * Validate a raw token and return public, non-sensitive session details.
   * Does NOT reveal the owner's UID or private fields to the recipient.
   */
  async getPublicSessionByToken(rawToken: string): Promise<PublicSessionInfo | null> {
    if (isFirebaseConfigured && db) {
      try {
        const tokenHash = await hashToken(rawToken);
        const q = query(collection(db, 'trackingSessions'), where('tokenHash', '==', tokenHash));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const docSnap = snapshot.docs[0];
          const data = docSnap.data() as TrackingSession;
          const isExpired = Date.now() > data.expiresAt;
          const effectiveStatus = isExpired && data.status !== 'revoked' ? 'expired' : data.status;

          return {
            id: data.id,
            title: data.title,
            description: data.description,
            ownerDisplayName: data.ownerDisplayName,
            status: effectiveStatus,
            expiresAt: data.expiresAt,
            consentStatus: data.consentStatus,
            isExpired,
          };
        } else {
          // Direct fallback if token is actually sessionId
          const directDoc = await getDoc(doc(db, 'trackingSessions', rawToken));
          if (directDoc.exists()) {
            const data = directDoc.data() as TrackingSession;
            const isExpired = Date.now() > data.expiresAt;
            const effectiveStatus = isExpired && data.status !== 'revoked' ? 'expired' : data.status;

            return {
              id: data.id,
              title: data.title,
              description: data.description,
              ownerDisplayName: data.ownerDisplayName,
              status: effectiveStatus,
              expiresAt: data.expiresAt,
              consentStatus: data.consentStatus,
              isExpired,
            };
          }
        }
      } catch (err) {
        console.warn('Firestore token query error, checking local store:', err);
      }
    }

    return demoStore.getSessionByToken(rawToken);
  },

  /**
   * Recipient grants or declines consent
   */
  async recordConsent(rawToken: string, consent: 'granted' | 'declined'): Promise<boolean> {
    if (isFirebaseConfigured && db) {
      try {
        const tokenHash = await hashToken(rawToken);
        const q = query(collection(db, 'trackingSessions'), where('tokenHash', '==', tokenHash));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const docSnap = snapshot.docs[0];
          const session = docSnap.data() as TrackingSession;

          // Validate expiration
          if (Date.now() > session.expiresAt || session.status === 'revoked') {
            return false;
          }

          await updateDoc(docSnap.ref, {
            consentStatus: consent,
            status: consent === 'granted' ? 'active' : 'stopped',
            sharingStartedAt: consent === 'granted' ? Date.now() : null,
            sharingStoppedAt: consent === 'declined' ? Date.now() : null,
          });
          return true;
        }
      } catch (err) {
        console.warn('Firestore consent update error, checking local store:', err);
      }
    }

    return demoStore.recordConsent(rawToken, consent);
  },

  /**
   * Recipient explicitly stops live sharing
   */
  async stopSharingByRecipient(rawToken: string): Promise<boolean> {
    if (isFirebaseConfigured && db) {
      try {
        const tokenHash = await hashToken(rawToken);
        const q = query(collection(db, 'trackingSessions'), where('tokenHash', '==', tokenHash));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const docSnap = snapshot.docs[0];
          await updateDoc(docSnap.ref, {
            status: 'stopped',
            sharingStoppedAt: Date.now(),
          });
          return true;
        }
      } catch (err) {
        console.warn('Firestore stop error, falling back to local store:', err);
      }
    }

    return demoStore.stopSharingByRecipient(rawToken);
  },

  /**
   * Owner revokes the tracking session immediately
   */
  async revokeSession(sessionId: string, ownerUid: string): Promise<boolean> {
    const isRealFirebaseUser = Boolean(
      isFirebaseConfigured && db && auth?.currentUser && !ownerUid.startsWith('demo-')
    );

    if (isRealFirebaseUser) {
      try {
        const docRef = doc(db!, 'trackingSessions', sessionId);
        const snap = await getDoc(docRef);
        if (snap.exists() && snap.data()?.ownerUid === ownerUid) {
          await updateDoc(docRef, {
            status: 'revoked',
            revokedAt: Date.now(),
            sharingStoppedAt: Date.now(),
          });
          return true;
        }
      } catch (err) {
        console.warn('Firestore revoke error, falling back to local store:', err);
      }
    }

    return demoStore.revokeSession(sessionId, ownerUid);
  },

  /**
   * Delete session record permanently
   */
  async deleteSession(sessionId: string, ownerUid: string): Promise<boolean> {
    const isRealFirebaseUser = Boolean(
      isFirebaseConfigured && db && auth?.currentUser && !ownerUid.startsWith('demo-')
    );

    if (isRealFirebaseUser) {
      try {
        const docRef = doc(db!, 'trackingSessions', sessionId);
        await deleteDoc(docRef);
        return true;
      } catch (err) {
        console.warn('Firestore delete error, falling back to local store:', err);
      }
    }

    return demoStore.deleteSession(sessionId, ownerUid);
  },
};
