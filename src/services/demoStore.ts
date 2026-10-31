import type { TrackingSession, PublicSessionInfo } from '@/types/session';
import type { LocationCoordinate } from '@/types/location';
import type { AppUser } from '@/types/user';
import { hashToken } from '@/lib/crypto';

// BroadcastChannel for cross-tab communication in demo mode
const channelName = 'locateflow_demo_bus';
let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel(channelName);
  } catch (e) {
    console.warn('BroadcastChannel unavailable:', e);
  }
}

const STORAGE_KEY_SESSIONS = 'locateflow_demo_sessions';
const STORAGE_KEY_LOCATIONS = 'locateflow_demo_locations';
const STORAGE_KEY_USER = 'locateflow_demo_user';

export const DEMO_USER: AppUser = {
  uid: 'demo-user-101',
  email: 'alex.rivera@example.com',
  displayName: 'Alex Rivera',
  isDemoUser: true,
  createdAt: Date.now() - 86400000 * 3,
};

class DemoStore {
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  constructor() {
    if (broadcastChannel) {
      broadcastChannel.onmessage = (event) => {
        const { type, payload } = event.data || {};
        if (type && this.listeners.has(type)) {
          this.listeners.get(type)?.forEach((cb) => cb(payload));
        }
      };
    }
    this.seedInitialDemoData();
  }

  private seedInitialDemoData() {
    if (typeof window === 'undefined') return;
    const existing = sessionStorage.getItem(STORAGE_KEY_SESSIONS);
    if (!existing) {
      const now = Date.now();
      const sampleSessions: TrackingSession[] = [
        {
          id: 'demo-session-recent-1',
          ownerUid: DEMO_USER.uid,
          ownerDisplayName: DEMO_USER.displayName || 'Alex Rivera',
          title: 'Courier Delivery - Austin Hub',
          description: 'Package drop-off route monitoring',
          status: 'stopped',
          createdAt: now - 3600000 * 4,
          expiresAt: now + 3600000 * 20,
          sharingStartedAt: now - 3600000 * 3.8,
          sharingStoppedAt: now - 3600000 * 3.2,
          consentStatus: 'granted',
          tokenHash: 'sample-hash-1',
          lastUpdatedAt: now - 3600000 * 3.2,
        },
        {
          id: 'demo-session-expired-2',
          ownerUid: DEMO_USER.uid,
          ownerDisplayName: DEMO_USER.displayName || 'Alex Rivera',
          title: 'Airport Meetup Terminal 2',
          description: 'Arrival coordination',
          status: 'expired',
          createdAt: now - 86400000 * 1.5,
          expiresAt: now - 86400000 * 0.5,
          consentStatus: 'granted',
          tokenHash: 'sample-hash-2',
          lastUpdatedAt: now - 86400000 * 0.5,
        },
      ];
      sessionStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sampleSessions));
    }
  }

  private emit(type: string, payload: any) {
    if (this.listeners.has(type)) {
      this.listeners.get(type)?.forEach((cb) => cb(payload));
    }
    if (broadcastChannel) {
      try {
        broadcastChannel.postMessage({ type, payload });
      } catch (e) {
        console.warn('Failed to broadcast event', e);
      }
    }
  }

  public subscribe(eventType: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);
    return () => {
      this.listeners.get(eventType)?.delete(callback);
    };
  }

  // --- Session Management ---

  public getSessions(ownerUid: string): TrackingSession[] {
    if (typeof window === 'undefined') return [];
    const raw = sessionStorage.getItem(STORAGE_KEY_SESSIONS);
    const sessions: TrackingSession[] = raw ? JSON.parse(raw) : [];
    const now = Date.now();

    return sessions
      .filter((s) => s.ownerUid === ownerUid)
      .map((s) => {
        if (s.status !== 'revoked' && s.status !== 'stopped' && now > s.expiresAt) {
          s.status = 'expired';
        }
        return s;
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  public getSessionById(sessionId: string): TrackingSession | null {
    if (typeof window === 'undefined') return null;
    const raw = sessionStorage.getItem(STORAGE_KEY_SESSIONS);
    const sessions: TrackingSession[] = raw ? JSON.parse(raw) : [];
    const s = sessions.find((x) => x.id === sessionId);
    if (!s) return null;

    if (s.status !== 'revoked' && s.status !== 'stopped' && Date.now() > s.expiresAt) {
      s.status = 'expired';
    }
    return s;
  }

  public saveSession(session: TrackingSession) {
    const raw = sessionStorage.getItem(STORAGE_KEY_SESSIONS);
    const sessions: TrackingSession[] = raw ? JSON.parse(raw) : [];
    const index = sessions.findIndex((s) => s.id === session.id);
    if (index >= 0) {
      sessions[index] = session;
    } else {
      sessions.unshift(session);
    }
    sessionStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
    this.emit(`session:${session.id}`, session);
    this.emit('sessions:changed', sessions);
  }

  public async findSessionByTokenOrId(tokenOrId: string): Promise<TrackingSession | null> {
    if (typeof window === 'undefined') return null;
    const raw = sessionStorage.getItem(STORAGE_KEY_SESSIONS);
    const sessions: TrackingSession[] = raw ? JSON.parse(raw) : [];

    // Direct match by ID or tokenHash
    let found = sessions.find((s) => s.id === tokenOrId || s.tokenHash === tokenOrId);
    if (found) return found;

    // Match by computed hash
    try {
      const hash = await hashToken(tokenOrId);
      found = sessions.find((s) => s.tokenHash === hash);
      if (found) return found;
    } catch {
      // ignore
    }

    return null;
  }

  public async getSessionByToken(tokenOrId: string): Promise<PublicSessionInfo | null> {
    const session = await this.findSessionByTokenOrId(tokenOrId);
    if (!session) return null;

    const isExpired = Date.now() > session.expiresAt;
    const effectiveStatus = isExpired && session.status !== 'revoked' ? 'expired' : session.status;

    return {
      id: session.id,
      title: session.title,
      description: session.description,
      ownerDisplayName: session.ownerDisplayName,
      status: effectiveStatus,
      expiresAt: session.expiresAt,
      consentStatus: session.consentStatus,
      isExpired,
    };
  }

  public async recordConsent(tokenOrId: string, consent: 'granted' | 'declined'): Promise<boolean> {
    const session = await this.findSessionByTokenOrId(tokenOrId);
    if (!session) return false;

    session.consentStatus = consent;
    if (consent === 'granted') {
      session.status = 'active';
      session.sharingStartedAt = Date.now();
    } else {
      session.status = 'stopped';
      session.sharingStoppedAt = Date.now();
    }
    this.saveSession(session);
    return true;
  }

  public async stopSharingByRecipient(tokenOrId: string): Promise<boolean> {
    const session = await this.findSessionByTokenOrId(tokenOrId);
    if (!session) return false;

    session.status = 'stopped';
    session.sharingStoppedAt = Date.now();
    this.saveSession(session);
    return true;
  }

  public revokeSession(sessionId: string, ownerUid: string): boolean {
    const session = this.getSessionById(sessionId);
    if (!session || session.ownerUid !== ownerUid) return false;

    session.status = 'revoked';
    session.revokedAt = Date.now();
    session.sharingStoppedAt = Date.now();
    this.saveSession(session);
    return true;
  }

  public deleteSession(sessionId: string, ownerUid: string): boolean {
    const raw = sessionStorage.getItem(STORAGE_KEY_SESSIONS);
    const sessions: TrackingSession[] = raw ? JSON.parse(raw) : [];
    const filtered = sessions.filter((s) => !(s.id === sessionId && s.ownerUid === ownerUid));
    sessionStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(filtered));
    this.emit('sessions:changed', filtered);
    return true;
  }

  // --- Location Updates ---

  public async updateLocation(
    tokenOrId: string,
    coords: { latitude: number; longitude: number; accuracy: number; capturedAt: number }
  ): Promise<boolean> {
    const session = await this.findSessionByTokenOrId(tokenOrId);

    if (!session) return false;
    if (session.status !== 'active' || Date.now() > session.expiresAt) {
      return false;
    }

    const location: LocationCoordinate = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy,
      capturedAt: coords.capturedAt,
      receivedAt: Date.now(),
    };

    // Store current location
    const locationsRaw = sessionStorage.getItem(STORAGE_KEY_LOCATIONS);
    const locationsMap: Record<string, LocationCoordinate> = locationsRaw
      ? JSON.parse(locationsRaw)
      : {};
    locationsMap[session.id] = location;
    sessionStorage.setItem(STORAGE_KEY_LOCATIONS, JSON.stringify(locationsMap));

    // Update lastUpdatedAt on session
    session.lastUpdatedAt = Date.now();
    this.saveSession(session);

    // Emit live location update
    this.emit(`location:${session.id}`, location);
    return true;
  }

  public getCurrentLocation(sessionId: string): LocationCoordinate | null {
    if (typeof window === 'undefined') return null;
    const locationsRaw = sessionStorage.getItem(STORAGE_KEY_LOCATIONS);
    const locationsMap: Record<string, LocationCoordinate> = locationsRaw
      ? JSON.parse(locationsRaw)
      : {};
    return locationsMap[sessionId] || null;
  }

  // User auth demo
  public getDemoUser(): AppUser | null {
    if (typeof window === 'undefined') return DEMO_USER;
    const raw = sessionStorage.getItem(STORAGE_KEY_USER);
    return raw ? JSON.parse(raw) : DEMO_USER;
  }

  public setDemoUser(user: AppUser | null) {
    if (user) {
      sessionStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    } else {
      sessionStorage.removeItem(STORAGE_KEY_USER);
    }
    this.emit('user:changed', user);
  }
}

export const demoStore = new DemoStore();
