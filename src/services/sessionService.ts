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
   * Stores in Firestore when configured, and mirrors to local store.
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

    const effectiveOwnerUid = auth?.currentUser?.uid || ownerUid;

    const session: TrackingSession = {
      id: sessionId,
      ownerUid: effectiveOwnerUid,
      ownerDisplayName: ownerDisplayName || auth?.currentUser?.displayName || 'LocateFlow User',
      title: input.title.trim(),
      description: input.description?.trim() || '',
      status: 'pending',
      createdAt: now,
      expiresAt,
      consentStatus: 'none',
      tokenHash,
      lastUpdatedAt: null,
    };

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`rawToken_${sessionId}`, rawToken);
      } catch {
        // ignore
      }
    }

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'trackingSessions', sessionId), session);
      } catch (err) {
        console.warn('Firestore setDoc failed, saving to local store:', err);
      }
    }

    demoStore.saveSession(session);

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://locateflow.app';
    const shareUrl = `${origin}/share/${rawToken}`;

    return {
      session,
      rawToken,
      shareUrl,
    };
  },

  /**
   * Get all sessions owned by the user
   */
  async getUserSessions(ownerUid: string): Promise<TrackingSession[]> {
    const effectiveUid = auth?.currentUser?.uid || ownerUid;

    if (isFirebaseConfigured && db) {
      try {
        const q = query(
          collection(db, 'trackingSessions'),
          where('ownerUid', '==', effectiveUid),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        const now = Date.now();
        const firestoreSessions = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as TrackingSession;
          if (data.status !== 'revoked' && data.status !== 'stopped' && now > data.expiresAt) {
            data.status = 'expired';
          }
          return data;
        });

        if (firestoreSessions.length > 0) {
          return firestoreSessions;
        }
      } catch (err) {
        console.warn('Firestore getUserSessions error, falling back to local store:', err);
      }
    }

    return demoStore.getSessions(effectiveUid);
  },

  /**
   * Subscribe to real-time updates for a single session
   */
  subscribeToSession(sessionId: string, callback: (session: TrackingSession | null) => void): () => void {
    if (isFirebaseConfigured && db) {
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
   * Validate a token or identifier and return public, non-sensitive session details.
   * Tolerates rawToken, tokenHash, or sessionId in the share URL.
   */
  async getPublicSessionByToken(tokenOrId: string): Promise<PublicSessionInfo | null> {
    if (isFirebaseConfigured && db) {
      try {
        // 1. Check if tokenOrId is a rawToken whose hash matches tokenHash in Firestore
        const computedHash = await hashToken(tokenOrId);
        let q = query(collection(db, 'trackingSessions'), where('tokenHash', '==', computedHash));
        let snapshot = await getDocs(q);

        // 2. If not found, check if tokenOrId is already the tokenHash
        if (snapshot.empty) {
          q = query(collection(db, 'trackingSessions'), where('tokenHash', '==', tokenOrId));
          snapshot = await getDocs(q);
        }

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
        }

        // 3. Direct document lookup by doc ID (when sessionId is in URL)
        const directDoc = await getDoc(doc(db, 'trackingSessions', tokenOrId));
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
      } catch (err) {
        console.warn('Firestore token query error, checking local store:', err);
      }
    }

    return demoStore.getSessionByToken(tokenOrId);
  },

  /**
   * Recipient grants or declines consent
   */
  async recordConsent(tokenOrId: string, consent: 'granted' | 'declined'): Promise<boolean> {
    let success = false;

    if (isFirebaseConfigured && db) {
      try {
        const computedHash = await hashToken(tokenOrId);
        let q = query(collection(db, 'trackingSessions'), where('tokenHash', '==', computedHash));
        let snapshot = await getDocs(q);

        if (snapshot.empty) {
          q = query(collection(db, 'trackingSessions'), where('tokenHash', '==', tokenOrId));
          snapshot = await getDocs(q);
        }

        let targetDocRef = !snapshot.empty ? snapshot.docs[0].ref : null;
        let sessionData = !snapshot.empty ? (snapshot.docs[0].data() as TrackingSession) : null;

        if (!targetDocRef) {
          const directRef = doc(db, 'trackingSessions', tokenOrId);
          const directSnap = await getDoc(directRef);
          if (directSnap.exists()) {
            targetDocRef = directRef;
            sessionData = directSnap.data() as TrackingSession;
          }
        }

        if (targetDocRef && sessionData) {
          if (Date.now() <= sessionData.expiresAt && sessionData.status !== 'revoked') {
            await updateDoc(targetDocRef, {
              consentStatus: consent,
              status: consent === 'granted' ? 'active' : 'stopped',
              sharingStartedAt: consent === 'granted' ? Date.now() : null,
              sharingStoppedAt: consent === 'declined' ? Date.now() : null,
              lastUpdatedAt: Date.now(),
            });
            success = true;
          }
        }
      } catch (err) {
        console.warn('Firestore consent update error:', err);
      }
    }

    const demoSuccess = await demoStore.recordConsent(tokenOrId, consent);
    return success || demoSuccess;
  },

  /**
   * Recipient explicitly stops live sharing
   */
  async stopSharingByRecipient(tokenOrId: string): Promise<boolean> {
    let success = false;

    if (isFirebaseConfigured && db) {
      try {
        const computedHash = await hashToken(tokenOrId);
        let q = query(collection(db, 'trackingSessions'), where('tokenHash', '==', computedHash));
        let snapshot = await getDocs(q);

        if (snapshot.empty) {
          q = query(collection(db, 'trackingSessions'), where('tokenHash', '==', tokenOrId));
          snapshot = await getDocs(q);
        }

        let targetDocRef = !snapshot.empty ? snapshot.docs[0].ref : null;

        if (!targetDocRef) {
          const directRef = doc(db, 'trackingSessions', tokenOrId);
          const directSnap = await getDoc(directRef);
          if (directSnap.exists()) {
            targetDocRef = directRef;
          }
        }

        if (targetDocRef) {
          await updateDoc(targetDocRef, {
            status: 'stopped',
            sharingStoppedAt: Date.now(),
            lastUpdatedAt: Date.now(),
          });
          success = true;
        }
      } catch (err) {
        console.warn('Firestore stop error:', err);
      }
    }

    const demoSuccess = await demoStore.stopSharingByRecipient(tokenOrId);
    return success || demoSuccess;
  },

  /**
   * Owner revokes the tracking session immediately
   */
  async revokeSession(sessionId: string, ownerUid: string): Promise<boolean> {
    let success = false;

    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, 'trackingSessions', sessionId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          await updateDoc(docRef, {
            status: 'revoked',
            revokedAt: Date.now(),
            sharingStoppedAt: Date.now(),
          });
          success = true;
        }
      } catch (err) {
        console.warn('Firestore revoke error:', err);
      }
    }

    const demoSuccess = demoStore.revokeSession(sessionId, ownerUid);
    return success || demoSuccess;
  },

  /**
   * Delete session record permanently
   */
  async deleteSession(sessionId: string, ownerUid: string): Promise<boolean> {
    let success = false;

    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, 'trackingSessions', sessionId);
        await deleteDoc(docRef);
        success = true;
      } catch (err) {
        console.warn('Firestore delete error:', err);
      }
    }

    const demoSuccess = demoStore.deleteSession(sessionId, ownerUid);
    return success || demoSuccess;
  },
};
