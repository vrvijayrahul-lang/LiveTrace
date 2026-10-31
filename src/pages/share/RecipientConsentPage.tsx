import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Radio,
  ShieldCheck,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  StopCircle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { sessionService } from '@/services/sessionService';
import { locationService } from '@/services/locationService';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { MiniLocationMap } from '@/components/map/MiniLocationMap';
import { formatTimeRemaining, formatCoordinates, formatRelativeTime } from '@/lib/utils';
import type { PublicSessionInfo } from '@/types/session';

export const RecipientConsentPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { success, error, info } = useToast();

  const [loading, setLoading] = useState(() => Boolean(token));
  const [session, setSession] = useState<PublicSessionInfo | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(() =>
    !token ? 'No share token provided in the URL.' : null
  );
  const [consentGranted, setConsentGranted] = useState(false);
  const [isStopped, setIsStopped] = useState(false);
  const [sendingUpdate, setSendingUpdate] = useState(false);
  const [lastSentTime, setLastSentTime] = useState<number | null>(null);

  // Geolocation hook with high accuracy
  const {
    isWatching,
    location,
    error: geoError,
    startWatching,
    stopWatching,
  } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 3000,
  });

  const lastSentCoordRef = useRef<{ lat: number; lng: number; accuracy: number; time: number } | null>(null);

  // Periodic heartbeat every 6 seconds while sharing is active to keep feed fresh
  useEffect(() => {
    if (!consentGranted || isStopped || !session || !token) return;

    const interval = setInterval(() => {
      const last = lastSentCoordRef.current;
      if (last && Date.now() - last.time >= 6000) {
        const now = Date.now();
        locationService
          .sendLocationUpdate(token, session.id, {
            latitude: last.lat,
            longitude: last.lng,
            accuracy: last.accuracy,
            capturedAt: now,
          })
          .then(() => {
            last.time = now;
            setLastSentTime(now);
          })
          .catch(() => {});
      }
    }, 6000);

    return () => clearInterval(interval);
  }, [consentGranted, isStopped, session, token]);

  // Keep alive when mobile phone wakes from background
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && consentGranted && !isStopped && session && token) {
        const last = lastSentCoordRef.current;
        if (last) {
          const now = Date.now();
          locationService
            .sendLocationUpdate(token, session.id, {
              latitude: last.lat,
              longitude: last.lng,
              accuracy: last.accuracy,
              capturedAt: now,
            })
            .then(() => {
              last.time = now;
              setLastSentTime(now);
            })
            .catch(() => {});
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [consentGranted, isStopped, session, token]);

  // Initial Load: Validate token and fetch public non-sensitive session details
  useEffect(() => {
    if (!token) return;
    let ignore = false;

    sessionService
      .getPublicSessionByToken(token)
      .then((publicInfo) => {
        if (ignore) return;
        if (!publicInfo) {
          setSessionError('This location link is invalid or has expired.');
          setSession(null);
        } else {
          setSession(publicInfo);
          if (publicInfo.status === 'stopped') {
            setIsStopped(true);
          }
        }
      })
      .catch((err: any) => {
        if (!ignore) {
          setSessionError(err.message || 'Unable to verify location request link.');
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [token]);

  // Periodic expiration / status recheck
  useEffect(() => {
    if (!session || isStopped) return;
    const interval = setInterval(() => {
      if (Date.now() > session.expiresAt) {
        setSession((prev) => (prev ? { ...prev, isExpired: true, status: 'expired' } : null));
        stopWatching();
        info('Session Expired', 'The 24-hour location sharing session has concluded.');
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [session, isStopped, stopWatching, info]);

  // Recipient clicks "Share My Live Location"
  const handleGrantConsent = async () => {
    if (!token || !session) return;

    if (session.isExpired || session.status === 'revoked' || session.status === 'expired') {
      error('Session Inactive', 'This session is no longer active and cannot accept location data.');
      return;
    }

    try {
      await sessionService.recordConsent(token, 'granted');
      setConsentGranted(true);
      setIsStopped(false);
      success('Consent Granted', 'Requesting browser location permission...');

      startWatching(async (coord) => {
        const now = Date.now();
        if (lastSentCoordRef.current) {
          const timeDiff = now - lastSentCoordRef.current.time;
          const latDiff = Math.abs(coord.latitude - lastSentCoordRef.current.lat);
          const lngDiff = Math.abs(coord.longitude - lastSentCoordRef.current.lng);
          if (timeDiff < 2000 && latDiff < 0.00001 && lngDiff < 0.00001) {
            return;
          }
        }

        setSendingUpdate(true);
        try {
          await locationService.sendLocationUpdate(token, session.id, coord);
          lastSentCoordRef.current = {
            lat: coord.latitude,
            lng: coord.longitude,
            accuracy: coord.accuracy,
            time: now,
          };
          setLastSentTime(now);
        } catch (err) {
          console.error('Failed to send live coordinate:', err);
        } finally {
          setSendingUpdate(false);
        }
      });
    } catch (err: any) {
      error('Consent Error', err.message || 'Failed to record consent.');
    }
  };

  // Recipient clicks "Decline"
  const handleDeclineConsent = async () => {
    if (!token) return;
    try {
      await sessionService.recordConsent(token, 'declined');
      setIsStopped(true);
      setConsentGranted(false);
      stopWatching();
      info('Sharing Declined', 'You declined to share your location. No data was sent.');
    } catch {
      // Ignored
    }
  };

  // Recipient clicks "Stop Sharing"
  const handleStopSharing = async () => {
    if (!token) return;
    try {
      stopWatching();
      await sessionService.stopSharingByRecipient(token);
      setIsStopped(true);
      setConsentGranted(false);
      success('Sharing Stopped', 'Live location broadcast has been terminated.');
    } catch (err: any) {
      error('Failed to stop sharing', err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-4">
          <Radio className="w-6 h-6 text-brand-400 animate-spin-slow" />
        </div>
        <p className="text-sm font-medium text-slate-300">Verifying secure location link...</p>
      </div>
    );
  }

  if (sessionError || !session) {
    return (
      <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center p-4 sm:p-6 text-center">
        <Card className="max-w-md w-full space-y-5">
          <div className="w-12 h-12 mx-auto rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <XCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-slate-100">Invalid or Expired Link</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              {sessionError || 'This tracking link could not be verified. It may have expired or been revoked by the owner.'}
            </p>
          </div>
          <Link to="/">
            <Button variant="secondary" className="w-full">
              Go to LocateFlow
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const isSessionTerminated =
    session.isExpired ||
    session.status === 'revoked' ||
    session.status === 'expired' ||
    (isStopped && !consentGranted);

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center p-4 sm:p-6 text-slate-100 relative">
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-brand-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="mb-6 flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-brand-500/15 border border-brand-500/30 flex items-center justify-center">
          <Radio className="w-3.5 h-3.5 text-brand-400 animate-pulse" />
        </div>
        <span className="font-bold text-white tracking-tight">LocateFlow</span>
      </div>

      <Card className="max-w-lg w-full space-y-6">
        <div className="flex items-center justify-between gap-2 border-b border-white/[0.08] pb-4">
          <Badge status={session.status} />
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5 text-brand-400" />
            <span>{formatTimeRemaining(session.expiresAt).text}</span>
          </div>
        </div>

        <div className="space-y-2 text-left">
          <div className="text-xs uppercase tracking-wider text-brand-400 font-semibold flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            <span>Live Location Request</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
            {session.title}
          </h1>
          {session.description && (
            <p className="text-sm text-slate-300 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5">
              "{session.description}"
            </p>
          )}
          <p className="text-xs text-slate-400">
            Requested by <span className="text-slate-200 font-medium">{session.ownerDisplayName || 'LocateFlow User'}</span>
          </p>
        </div>

        {/* ACTIVE SHARING VIEW */}
        {consentGranted && isWatching && !isSessionTerminated && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center w-4 h-4">
                  <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping absolute" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 relative" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-emerald-300 block">
                    Location Sharing Active
                  </span>
                  <span className="text-xs text-emerald-400/80">
                    {sendingUpdate ? 'Transmitting coordinates...' : lastSentTime ? `Last updated ${formatRelativeTime(lastSentTime)}` : 'Connecting to GPS...'}
                  </span>
                </div>
              </div>
            </div>

            {location && (
              <div className="space-y-2">
                <MiniLocationMap location={location} />
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono px-1">
                  <span>{formatCoordinates(location.latitude, location.longitude)}</span>
                  <span>Accuracy: ±{Math.round(location.accuracy)}m</span>
                </div>
              </div>
            )}

            <Button
              variant="danger"
              size="lg"
              className="w-full justify-center shadow-glow-rose font-semibold"
              icon={<StopCircle className="w-5 h-5" />}
              onClick={handleStopSharing}
            >
              Stop Sharing Location
            </Button>

            <p className="text-xs text-slate-500 text-center">
              Stopping or closing this page immediately terminates location broadcast.
            </p>
          </motion.div>
        )}

        {/* PERMISSION ERROR */}
        {geoError && !isSessionTerminated && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 space-y-3 text-left">
            <div className="flex items-start gap-2.5 text-xs text-rose-300">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Browser Permission Notice</span>
                <p className="mt-1 leading-relaxed text-rose-200/90">{geoError}</p>
              </div>
            </div>
            <div className="p-3 bg-dark-900/60 rounded-xl text-[11px] text-slate-300 space-y-1">
              <span className="font-semibold text-slate-200 block">How to enable permission:</span>
              <p>1. Tap the lock/tune icon in your browser address bar.</p>
              <p>2. Set "Location" permission to "Allow".</p>
              <p>3. Refresh or tap "Retry Location" below.</p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              className="w-full justify-center"
              icon={<RefreshCw className="w-3.5 h-3.5" />}
              onClick={handleGrantConsent}
            >
              Retry Location
            </Button>
          </div>
        )}

        {/* SESSION TERMINATED VIEW */}
        {isSessionTerminated && (
          <div className="p-5 rounded-2xl bg-dark-800/80 border border-white/10 text-center space-y-3">
            <div className="w-10 h-10 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
              <StopCircle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-200">
              {session.isExpired || session.status === 'expired'
                ? 'Session Expired'
                : session.status === 'revoked'
                ? 'Session Revoked'
                : 'Location Sharing Stopped'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              No coordinates are being tracked or stored. You have full control over your privacy.
            </p>
          </div>
        )}

        {/* PRE-CONSENT EXPLANATION & ACTION BUTTONS */}
        {!consentGranted && !isSessionTerminated && (
          <div className="space-y-6 text-left">
            <div className="space-y-3 p-4 rounded-2xl bg-dark-800/70 border border-white/10 text-xs">
              <div className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Privacy & Consent Guarantee</span>
              </div>
              <div className="flex items-start gap-2 text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Only shares GPS coordinates after you press "Share My Live Location".</span>
              </div>
              <div className="flex items-start gap-2 text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Only <strong className="text-white">{session.ownerDisplayName || 'the requester'}</strong> can view your location.</span>
              </div>
              <div className="flex items-start gap-2 text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Automatically expires 24 hours after creation.</span>
              </div>
              <div className="flex items-start gap-2 text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>You can tap "Stop Sharing" at any moment to cancel.</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Button
                variant="primary"
                size="lg"
                className="w-full justify-center shadow-glow-brand"
                icon={<MapPin className="w-4 h-4" />}
                onClick={handleGrantConsent}
              >
                Share My Live Location
              </Button>

              <Button
                variant="ghost"
                size="lg"
                className="w-full sm:w-auto justify-center text-slate-400 hover:text-rose-400"
                onClick={handleDeclineConsent}
              >
                Decline
              </Button>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-500">
          <span>Powered by LocateFlow</span>
          <Link to="/privacy" className="hover:text-slate-300 flex items-center gap-1">
            <span>Read Privacy Model</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </Card>
    </div>
  );
};
