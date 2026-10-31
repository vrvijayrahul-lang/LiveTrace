import { describe, it, expect } from 'vitest';
import { generateSecureToken, hashToken } from '@/lib/crypto';

describe('Cryptographic Security Engine', () => {
  it('generates random tokens with at least 64 hex characters (32 bytes entropy)', () => {
    const token1 = generateSecureToken();
    const token2 = generateSecureToken();

    expect(token1).toHaveLength(64);
    expect(token2).toHaveLength(64);
    expect(token1).not.toBe(token2);
    // Ensure hex characters
    expect(/^[0-9a-f]{64}$/.test(token1)).toBe(true);
  });

  it('computes deterministic SHA-256 hash', async () => {
    const rawToken = 'test-token-value-12345';
    const hash1 = await hashToken(rawToken);
    const hash2 = await hashToken(rawToken);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
    expect(/^[0-9a-f]{64}$/.test(hash1)).toBe(true);
  });

  it('rejects invalid or empty tokens', async () => {
    await expect(hashToken('')).rejects.toThrow();
    // @ts-ignore
    await expect(hashToken(null)).rejects.toThrow();
  });
});
