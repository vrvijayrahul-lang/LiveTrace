import { describe, it, expect } from 'vitest';
import {
  formatTimeRemaining,
  formatCoordinates,
  isLocationStale,
  formatRelativeTime,
} from '@/lib/utils';

describe('Utility Functions', () => {
  it('correctly calculates remaining time before 24-hour expiration', () => {
    const now = Date.now();
    const expiresFuture = now + 3600000 * 5; // 5 hours in future
    const resFuture = formatTimeRemaining(expiresFuture);

    expect(resFuture.isExpired).toBe(false);
    expect(resFuture.hours).toBe(5);

    const expiresPast = now - 1000;
    const resPast = formatTimeRemaining(expiresPast);
    expect(resPast.isExpired).toBe(true);
    expect(resPast.text).toBe('Expired');
  });

  it('formats GPS coordinates cleanly with cardinal directions', () => {
    const formatted = formatCoordinates(37.77492, -122.41941);
    expect(formatted).toBe('37.77492° N, 122.41941° W');

    const southWest = formatCoordinates(-33.8688, 151.2093);
    expect(southWest).toBe('33.86880° S, 151.20930° E');
  });

  it('accurately identifies stale coordinates older than 45 seconds', () => {
    const fresh = Date.now() - 5000; // 5 seconds old
    expect(isLocationStale(fresh)).toBe(false);

    const stale = Date.now() - 50000; // 50 seconds old
    expect(isLocationStale(stale)).toBe(true);

    expect(isLocationStale(null)).toBe(true);
  });

  it('formats relative timestamps cleanly', () => {
    const now = Date.now();
    expect(formatRelativeTime(now - 2000)).toBe('Just now');
    expect(formatRelativeTime(now - 30000)).toBe('30s ago');
    expect(formatRelativeTime(now - 120000)).toBe('2m ago');
  });
});
