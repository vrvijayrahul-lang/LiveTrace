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
  const callbackRef = useRef<((coord: LocationCoordinate) => void) | undefined>(undefined);
  const fallbackAttemptedRef = useRef(false);

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

  const handlePositionSuccess = useCallback((position: GeolocationPosition) => {
    const coord: LocationCoordinate = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude,
      speed: position.coords.speed,
      heading: position.coords.heading,
      capturedAt: Date.now(),
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

    if (callbackRef.current) {
      callbackRef.current(coord);
    }
  }, []);

  /**
   * Start watching position ONLY after explicit user consent
   */
  const startWatching = useCallback(
    (onLocationUpdate?: (coord: LocationCoordinate) => void) => {
      callbackRef.current = onLocationUpdate;
      fallbackAttemptedRef.current = false;

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

      const positionError = (err: GeolocationPositionError) => {
        // If high accuracy times out or is unavailable, automatically fallback to standard accuracy
        if ((err.code === 2 || err.code === 3) && !fallbackAttemptedRef.current) {
          fallbackAttemptedRef.current = true;
          console.warn('High-accuracy GPS fix unavailable, falling back to network triangulation...');
          try {
            navigator.geolocation.getCurrentPosition(
              handlePositionSuccess,
              () => {
                // Secondary fallback
              },
              { enableHighAccuracy: false, timeout: 10000, maximumAge: 30000 }
            );

            // Also switch watcher to standard accuracy
            if (watchIdRef.current !== null) {
              navigator.geolocation.clearWatch(watchIdRef.current);
            }
            watchIdRef.current = navigator.geolocation.watchPosition(
              handlePositionSuccess,
              (finalErr) => {
                setState((prev) => ({
                  ...prev,
                  error: 'Location unavailable. Please verify GPS or network signal.',
                  errorCode: finalErr.code,
                }));
              },
              { enableHighAccuracy: false, timeout: 20000, maximumAge: 10000 }
            );
            return;
          } catch {
            // ignore
          }
        }

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

      const highAccuracyOptions: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 2000,
        ...options,
      };

      // 1. Immediately request fast one-shot position fix so UI responds instantly
      try {
        navigator.geolocation.getCurrentPosition(
          handlePositionSuccess,
          (err) => {
            // If high accuracy fast fix fails, try low accuracy immediately
            if (err.code === 2 || err.code === 3) {
              navigator.geolocation.getCurrentPosition(
                handlePositionSuccess,
                () => {},
                { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
              );
            }
          },
          highAccuracyOptions
        );
      } catch {
        // ignore
      }

      // 2. Start continuous high-accuracy watching
      try {
        const id = navigator.geolocation.watchPosition(
          handlePositionSuccess,
          positionError,
          highAccuracyOptions
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
    [handlePositionSuccess, options]
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
