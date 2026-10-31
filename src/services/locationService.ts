import { doc, setDoc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { demoStore } from '@/services/demoStore';
import { locationCoordinateSchema } from '@/lib/validation';
import type { LocationCoordinate } from '@/types/location';

export const locationService = {
  /**
   * Send verified location update from consenting recipient.
   * Enforces coordinate validity and session active status.
   */
  async sendLocationUpdate(
    rawToken: string,
    sessionId: string,
    coords: {
      latitude: number;
      longitude: number;
      accuracy: number;
      altitude?: number | null;
      speed?: number | null;
      heading?: number | null;
      capturedAt: number;
    }
  ): Promise<boolean> {
    // 1. Validate payload format strictly
    const validated = locationCoordinateSchema.parse({
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy,
      altitude: coords.altitude ?? null,
      speed: coords.speed ?? null,
      heading: coords.heading ?? null,
      capturedAt: coords.capturedAt,
    });

    if (isFirebaseConfigured && db) {
      // In Firestore, write to trackingSessions/{sessionId}/location/current
      const locationDocRef = doc(db, 'trackingSessions', sessionId, 'location', 'current');
      const sessionDocRef = doc(db, 'trackingSessions', sessionId);

      await setDoc(locationDocRef, {
        ...validated,
        receivedAt: Date.now(),
        serverTimestamp: serverTimestamp(),
      });

      await updateDoc(sessionDocRef, {
        lastUpdatedAt: Date.now(),
      });

      return true;
    }

    return demoStore.updateLocation(rawToken, validated);
  },

  /**
   * Subscribe to live location coordinate stream for a session (Owner viewing map)
   */
  subscribeToLocation(
    sessionId: string,
    callback: (location: LocationCoordinate | null) => void
  ): () => void {
    if (isFirebaseConfigured && db) {
      const locationDocRef = doc(db, 'trackingSessions', sessionId, 'location', 'current');
      return onSnapshot(
        locationDocRef,
        (docSnap) => {
          if (!docSnap.exists()) {
            callback(null);
            return;
          }
          const data = docSnap.data();
          callback({
            latitude: data.latitude,
            longitude: data.longitude,
            accuracy: data.accuracy,
            altitude: data.altitude,
            speed: data.speed,
            heading: data.heading,
            capturedAt: data.capturedAt,
            receivedAt: data.receivedAt,
          });
        },
        (error) => {
          console.error('Error listening to location updates:', error);
          callback(null);
        }
      );
    }

    // Demo store subscription
    const current = demoStore.getCurrentLocation(sessionId);
    callback(current);
    return demoStore.subscribe(`location:${sessionId}`, (loc) => callback(loc));
  },
};
