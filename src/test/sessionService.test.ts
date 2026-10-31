import { describe, it, expect, beforeEach } from 'vitest';
import { sessionService } from '@/services/sessionService';

describe('Session Lifecycle and State Management', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('creates a session with a 24-hour expiration preset and raw token return', async () => {
    const ownerUid = 'test-owner-001';

    const result = await sessionService.createSession(ownerUid, 'Test User', {
      title: 'Bike Ride to Golden Gate',
      description: 'Meet at north vista point',
    });

    expect(result.session.id).toBeDefined();
    expect(result.rawToken).toHaveLength(64);
    expect(result.shareUrl).toContain(`/share/${result.rawToken}`);
    expect(result.session.status).toBe('pending');
    expect(result.session.consentStatus).toBe('none');

    // Verify 24-hour lifetime (approx 86400000 ms)
    const duration = result.session.expiresAt - result.session.createdAt;
    expect(duration).toBe(24 * 60 * 60 * 1000);

    // Verify rawToken is NOT the tokenHash
    expect(result.session.tokenHash).not.toBe(result.rawToken);
  });

  it('allows recipient to query public session by raw token without exposing owner private data', async () => {
    const ownerUid = 'private-owner-xyz';
    const created = await sessionService.createSession(ownerUid, 'Private Owner', {
      title: 'Family Roadtrip',
    });

    const publicInfo = await sessionService.getPublicSessionByToken(created.rawToken);
    expect(publicInfo).not.toBeNull();
    expect(publicInfo?.title).toBe('Family Roadtrip');
    expect(publicInfo?.ownerDisplayName).toBe('Private Owner');
    // Ensure ownerUid is not leaked
    // @ts-ignore
    expect(publicInfo?.ownerUid).toBeUndefined();
  });

  it('records recipient consent transition from pending to active', async () => {
    const created = await sessionService.createSession('owner-1', 'Owner', {
      title: 'Hike Meetup',
    });

    const success = await sessionService.recordConsent(created.rawToken, 'granted');
    expect(success).toBe(true);

    const updated = await sessionService.getPublicSessionByToken(created.rawToken);
    expect(updated?.status).toBe('active');
    expect(updated?.consentStatus).toBe('granted');
  });

  it('allows recipient to stop sharing and transitions status to stopped', async () => {
    const created = await sessionService.createSession('owner-1', 'Owner', {
      title: 'Delivery',
    });

    await sessionService.recordConsent(created.rawToken, 'granted');
    const stopped = await sessionService.stopSharingByRecipient(created.rawToken);
    expect(stopped).toBe(true);

    const updated = await sessionService.getPublicSessionByToken(created.rawToken);
    expect(updated?.status).toBe('stopped');
  });

  it('allows owner to revoke session immediately', async () => {
    const ownerUid = 'owner-revoke-test';
    const created = await sessionService.createSession(ownerUid, 'Owner', {
      title: 'Temporary Session',
    });

    const revoked = await sessionService.revokeSession(created.session.id, ownerUid);
    expect(revoked).toBe(true);

    const updated = await sessionService.getPublicSessionByToken(created.rawToken);
    expect(updated?.status).toBe('revoked');
  });
});
