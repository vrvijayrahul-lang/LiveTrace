export interface LocationCoordinate {
  latitude: number;
  longitude: number;
  accuracy: number; // in meters
  altitude?: number | null;
  speed?: number | null;
  heading?: number | null;
  capturedAt: number; // Device timestamp ms
  receivedAt?: number; // Server timestamp ms
}

export interface LocationUpdatePayload {
  token: string; // Recipient presents their raw token for authentication
  sessionId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  capturedAt: number;
}

export type GeolocationPermissionState = 'prompt' | 'granted' | 'denied' | 'unsupported';
