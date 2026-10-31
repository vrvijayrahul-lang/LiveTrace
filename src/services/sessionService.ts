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
import { db, isFirebaseConfigured } from '@/lib/firebase';
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

    if (isFirebaseConfigured && db) {
      await setDoc(doc(db, 'trackingSessions', sessionId), session);
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
    if (isFirebaseConfigured && db) {
      const q = query(
        collection(db, 'trackingSessions'),
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
    }

    return demoStore.getSessions(ownerUid);
  },

  /**
   * Subscribe to real-time updates for a single session
   */
  subscribeToSession(sessionId: string, callback: (session: TrackingSession | null) => void): () => void {
    if (isFirebaseConfigured && db) {
      const docRef = doc(db, 'trackingSessions', sessionId);
      return onSnapshot(docRef, (docSnap) => {
        if (!docSnap.exists()) {
          callback(null);
          return;
        }
        const data = docSnap.data() as TrackingSession;
        if (data.status !== 'revoked' && data.status !== 'stopped' && Date.now() > data.expiresAt) {
          data.status = 'expired';
        }
        callback(data);
      });
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
      const tokenHash = await hashToken(rawToken);
      const q = query(collection(db, 'trackingSessions'), where('tokenHash', '==', tokenHash));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;

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

    return demoStore.getSessionByToken(rawToken);
  },

  /**
   * Recipient grants or declines consent
   */
  async recordConsent(rawToken: string, consent: 'granted' | 'declined'): Promise<boolean> {
    if (isFirebaseConfigured && db) {
      const tokenHash = await hashToken(rawToken);
      const q = query(collection(db, 'trackingSessions'), where('tokenHash', '==', tokenHash));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return false;

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

    return demoStore.recordConsent(rawToken, consent);
  },

  /**
   * Recipient explicitly stops live sharing
   */
  async stopSharingByRecipient(rawToken: string): Promise<boolean> {
    if (isFirebaseConfigured && db) {
      const tokenHash = await hashToken(rawToken);
      const q = query(collection(db, 'trackingSessions'), where('tokenHash', '==', tokenHash));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return false;

      const docSnap = snapshot.docs[0];
      await updateDoc(docSnap.ref, {
        status: 'stopped',
        sharingStoppedAt: Date.now(),
      });
      return true;
    }

    return demoStore.stopSharingByRecipient(rawToken);
  },

  /**
   * Owner revokes the tracking session immediately
   */
  async revokeSession(sessionId: string, ownerUid: string): Promise<boolean> {
    if (isFirebaseConfigured && db) {
      const docRef = doc(db, 'trackingSessions', sessionId);
      const snap = await getDoc(docRef);
      if (!snap.exists() || snap.data()?.ownerUid !== ownerUid) return false;

      await updateDoc(docRef, {
        status: 'revoked',
        revokedAt: Date.now(),
        sharingStoppedAt: Date.now(),
      });
      return true;
    }

    return demoStore.revokeSession(sessionId, ownerUid);
  },

  /**
   * Owner permanently deletes session
   */
  async deleteSession(sessionId: string, ownerUid: string): Promise<boolean> {
    if (isFirebaseConfigured && db) {
      const docRef = doc(db, 'trackingSessions', sessionId);
      const snap = await getDoc(docRef);
      if (!snap.exists() || snap.data()?.ownerUid !== ownerUid) return false;

      // Delete location subcollection doc
      try {
        await deleteDoc(doc(db, 'trackingSessions', sessionId, 'location', 'current'));
      } catch (e) {
        console.warn('Failed to delete location document:', e);
      }

      await deleteDoc(docRef);
      return true;
    }

    return demoStore.deleteSession(sessionId, ownerUid);
  },
};
