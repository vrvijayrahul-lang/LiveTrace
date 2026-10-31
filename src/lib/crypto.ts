/**
 * Cryptographic security utilities for LocateFlow.
 * Adheres strictly to the requirement:
 * "Generate tokens using cryptographically secure randomness, not timestamps, sequential IDs, or Math.random()."
 * "Store only a cryptographic hash of the token where practical."
 */

/**
 * Generates an unpredictable, cryptographically strong random token (32 bytes entropy).
 * Formatted as a URL-safe string.
 */
export function generateSecureToken(): string {
  const buffer = new Uint8Array(32);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(buffer);
  } else if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    globalThis.crypto.getRandomValues(buffer);
  } else {
    throw new Error('Cryptographically secure random number generator is unavailable.');
  }

  // Convert to URL-safe base64 string
  return Array.from(buffer)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Computes a SHA-256 hash of a raw token.
 * This ensures raw tokens are NEVER stored in Firestore or logs.
 */
export async function hashToken(rawToken: string): Promise<string> {
  if (!rawToken || typeof rawToken !== 'string') {
    throw new Error('Invalid token provided for hashing.');
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(rawToken.trim());

  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Fallback for non-subtle environments (e.g. basic Node script if required)
  throw new Error('Web Crypto API subtle.digest is unavailable in this environment.');
}
