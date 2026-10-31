import { useState, useEffect, useRef, useCallback } from 'react';
import type { LocationCoordinate } from '@/types/location';

export interface GeolocationState {
  isSupported: boolean;
  isWatching: boolean;
  permissionState: 'prompt' | 'granted' | 'denied' | 'unsupported';
  location: LocationCoordinate | null;
  error: string | null;
  errorCode: number | null;
  lastUpdated: number | null;
}

export function useGeolocation(options?: PositionOptions) {
  const [state, setState] = useState<GeolocationState>({
    isSupported: typeof navigator !== 'undefined' && 'geolocation' in navigator,
    isWatching: false,
    permissionState:
      typeof navigator !== 'undefined' && 'geolocation' in navigator ? 'prompt' : 'unsupported',
    location: null,
    error: null,
    errorCode: null,
    lastUpdated: null,
  });

  const watchIdRef = useRef<number | null>(null);

  // Check query permission if supported by the browser
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'permissions' in navigator && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'geolocation' as PermissionName })
        .then((result) => {
          setState((prev) => ({
            ...prev,
            permissionState: result.state as any,
          }));

          result.onchange = () => {
            setState((prev) => ({
              ...prev,
              permissionState: result.state as any,
            }));
          };
        })
        .catch(() => {
          // Permissions API query not supported in all browsers
        });
    }
  }, []);

  /**
   * Stop geolocation watching and clear native watcher immediately
   */
  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null && typeof navigator !== 'undefined') {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setState((prev) => ({
      ...prev,
      isWatching: false,
    }));
  }, []);

  /**
   * Start watching position ONLY after explicit user consent
   */
  const startWatching = useCallback(
    (onLocationUpdate?: (coord: LocationCoordinate) => void) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        setState((prev) => ({
          ...prev,
          isSupported: false,
          permissionState: 'unsupported',
          error: 'Geolocation is not supported by your browser or environment.',
        }));
        return;
      }

      // Clear any prior active watcher first
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }

      setState((prev) => ({
        ...prev,
        isWatching: true,
        error: null,
        errorCode: null,
      }));

      const positionSuccess = (position: GeolocationPosition) => {
        const coord: LocationCoordinate = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          speed: position.coords.speed,
          heading: position.coords.heading,
          capturedAt: position.timestamp || Date.now(),
        };

        setState((prev) => ({
          ...prev,
          location: coord,
          isWatching: true,
          permissionState: 'granted',
          error: null,
          errorCode: null,
          lastUpdated: Date.now(),
        }));

        if (onLocationUpdate) {
          onLocationUpdate(coord);
        }
      };

      const positionError = (err: GeolocationPositionError) => {
        let errorMessage = 'An unknown error occurred while accessing location.';
        switch (err.code) {
          case 1: // PERMISSION_DENIED
            errorMessage =
              'Location permission was denied. Please allow location access in your browser address bar settings to share your live location.';
            break;
          case 2: // POSITION_UNAVAILABLE
            errorMessage =
              'Location information is temporarily unavailable. Check your device GPS signal or network connection.';
            break;
          case 3: // TIMEOUT
            errorMessage = 'Location request timed out. Retrying in background...';
            break;
        }

        setState((prev) => ({
          ...prev,
          error: errorMessage,
          errorCode: err.code,
          permissionState: err.code === 1 ? 'denied' : prev.permissionState,
        }));
      };

      const defaultOptions: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 3000,
        ...options,
      };

      try {
        const id = navigator.geolocation.watchPosition(
          positionSuccess,
          positionError,
          defaultOptions
        );
        watchIdRef.current = id;
      } catch (err: any) {
        setState((prev) => ({
          ...prev,
          isWatching: false,
          error: err.message || 'Failed to start location updates.',
        }));
      }
    },
    [options]
  );

  // CRITICAL CLEANUP: always clear watcher on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && typeof navigator !== 'undefined') {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  return {
    ...state,
    startWatching,
    stopWatching,
  };
}
