import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a unix timestamp into readable date & time
 */
export function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/**
 * Returns formatted time remaining before expiration
 */
export function formatTimeRemaining(expiresAt: number): {
  text: string;
  isExpired: boolean;
  hours: number;
  minutes: number;
} {
  const now = Date.now();
  const diff = expiresAt - now;

  if (diff <= 0) {
    return { text: 'Expired', isExpired: true, hours: 0, minutes: 0 };
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return {
      text: `${hours}h ${minutes}m left`,
      isExpired: false,
      hours,
      minutes,
    };
  }

  return {
    text: `${minutes}m left`,
    isExpired: false,
    hours,
    minutes,
  };
}

/**
 * Returns a human-friendly relative time string (e.g. "5s ago", "2m ago")
 */
export function formatRelativeTime(timestamp: number): string {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 5) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

/**
 * Formats GPS coordinates to clean 5 decimal places with hemisphere indicators
 */
export function formatCoordinates(lat: number, lng: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(5)}° ${latDir}, ${Math.abs(lng).toFixed(5)}° ${lngDir}`;
}

/**
 * Checks if a location coordinate update is considered stale (> 45 seconds old)
 */
export function isLocationStale(capturedAt?: number | null): boolean {
  if (!capturedAt) return true;
  return Date.now() - capturedAt > 45000;
}

/**
 * Converts raw Firebase Auth error codes into friendly human readable explanations
 */
export function formatAuthError(error: any): string {
  const code = error?.code || (typeof error?.message === 'string' ? error.message : '');
  if (code.includes('auth/email-already-in-use')) {
    return 'An account with this email already exists. Please sign in instead.';
  }
  if (
    code.includes('auth/invalid-credential') ||
    code.includes('auth/wrong-password') ||
    code.includes('auth/user-not-found')
  ) {
    return 'Invalid email or password. Please verify your credentials and try again.';
  }
  if (code.includes('auth/weak-password')) {
    return 'Password is too weak. Please use at least 8 characters.';
  }
  if (code.includes('auth/too-many-requests')) {
    return 'Too many failed attempts. Please try again later or reset your password.';
  }
  if (code.includes('auth/network-request-failed')) {
    return 'Network connection error. Please check your internet connection.';
  }
  return error?.message
    ? String(error.message).replace(/^Firebase:\s*(Error\s*)?(\([^)]+\)\.?)?/i, '').trim() || 'Authentication error'
    : 'An error occurred during authentication.';
}
