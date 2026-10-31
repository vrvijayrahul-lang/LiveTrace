export type SessionStatus = 'pending' | 'active' | 'stopped' | 'revoked' | 'expired';

export type ConsentStatus = 'none' | 'granted' | 'declined';

export interface TrackingSession {
  id: string;
  ownerUid: string;
  ownerDisplayName?: string;
  title: string;
  description?: string;
  status: SessionStatus;
  createdAt: number; // Unix timestamp in ms
  expiresAt: number; // Unix timestamp in ms (24 hours after creation)
  revokedAt?: number | null;
  sharingStartedAt?: number | null;
  sharingStoppedAt?: number | null;
  consentStatus: ConsentStatus;
  tokenHash: string; // SHA-256 hash of the unique share token (raw token is never stored in DB)
  lastUpdatedAt?: number | null;
}

export interface PublicSessionInfo {
  id: string;
  title: string;
  description?: string;
  ownerDisplayName?: string;
  status: SessionStatus;
  expiresAt: number;
  consentStatus: ConsentStatus;
  isExpired: boolean;
}

export interface CreateSessionInput {
  title: string;
  description?: string;
}

export interface CreatedSessionResult {
  session: TrackingSession;
  rawToken: string;
  shareUrl: string;
}
