import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Copy,
  Check,
  Trash2,
  Ban,
  Radio,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import { sessionService } from '@/services/sessionService';
import { locationService } from '@/services/locationService';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LiveTrackingMap } from '@/components/map/LiveTrackingMap';
import { formatDateTime, formatTimeRemaining, formatCoordinates, formatRelativeTime } from '@/lib/utils';
import type { TrackingSession } from '@/types/session';
import type { LocationCoordinate } from '@/types/location';

export const SessionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error, info } = useToast();

  const [session, setSession] = useState<TrackingSession | null>(null);
  const [location, setLocation] = useState<LocationCoordinate | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Subscribe to real-time session updates
  useEffect(() => {
    if (!id) return;

    const unsubscribeSession = sessionService.subscribeToSession(id, (updatedSession) => {
      setSession(updatedSession);
      setLoading(false);
    });

    const unsubscribeLocation = locationService.subscribeToLocation(id, (coord) => {
      setLocation(coord);
    });

    return () => {
      unsubscribeSession();
      unsubscribeLocation();
    };
  }, [id]);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://locateflow.app';
  const savedRawToken = typeof window !== 'undefined' && id ? localStorage.getItem(`rawToken_${id}`) : null;
  const shareToken = savedRawToken || session?.tokenHash || id;
  const shareUrl = `${origin}/share/${shareToken}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    success('Copied link', 'Share link is copied to clipboard.');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    if (!session) return;
    const text = encodeURIComponent(
      `Please share your live location for "${session.title}" on LocateFlow: ${shareUrl}\n\n(Session auto-expires in 24 hours. GPS is only shared after your explicit consent).`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleRevoke = async () => {
    if (!session || !user) return;
    if (!window.confirm('Are you sure you want to revoke this session? Live location updates will be terminated immediately.')) {
      return;
    }

    setRevoking(true);
    try {
      await sessionService.revokeSession(session.id, user.uid);
      info('Session Revoked', 'Live tracking access has been permanently revoked.');
    } catch (err: any) {
      error('Revoke Failed', err.message);
    } finally {
      setRevoking(false);
    }
  };

  const handleDelete = async () => {
    if (!session || !user) return;
    if (!window.confirm('Delete this session and all its stored coordinates permanently?')) {
      return;
    }

    setDeleting(true);
    try {
      await sessionService.deleteSession(session.id, user.uid);
      success('Session Deleted', 'Session removed from your dashboard.');
      navigate('/dashboard/sessions');
    } catch (err: any) {
      error('Delete Failed', err.message);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center">
        <Radio className="w-8 h-8 text-brand-400 animate-spin-slow mb-3" />
        <p className="text-sm text-slate-400">Loading session telemetry...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-xl font-bold text-slate-100">Session Not Found</h2>
        <p className="text-sm text-slate-400">
          This session may have been deleted or you do not have permission to view it.
        </p>
        <Link to="/dashboard">
          <Button variant="secondary" icon={<ArrowLeft className="w-4 h-4" />}>
            Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const isSharingActive = session.status === 'active';

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard/sessions')}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
                {session.title}
              </h1>
              <Badge status={session.status} />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Created {formatDateTime(session.createdAt)} •{' '}
              <span className="text-brand-300 font-medium">
                {formatTimeRemaining(session.expiresAt).text}
              </span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {session.status !== 'revoked' && session.status !== 'expired' && (
            <Button
              variant="outline"
              size="sm"
              loading={revoking}
              icon={<Ban className="w-3.5 h-3.5 text-amber-400" />}
              onClick={handleRevoke}
              className="text-amber-300 hover:text-amber-200 border-amber-500/30"
            >
              Revoke Access
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            loading={deleting}
            icon={<Trash2 className="w-3.5 h-3.5 text-rose-400" />}
            onClick={handleDelete}
            className="text-slate-400 hover:text-rose-400"
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Main Interactive Map */}
      <div className="space-y-4">
        <LiveTrackingMap
          location={location}
          sessionStatus={session.status}
          sessionTitle={session.title}
          isSharingActive={isSharingActive}
        />
      </div>

      {/* Bento Grid: Telemetry & Share Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Share Link Card */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Recipient Share Link
            </h3>
            <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              24h Expiry
            </span>
          </div>

          <div className="flex items-center gap-2 p-1.5 rounded-xl bg-dark-800 border border-white/10">
            <input
              readOnly
              value={shareUrl}
              className="w-full bg-transparent px-3 py-1 text-xs font-mono text-brand-300 truncate focus:outline-none"
            />
            <button
              onClick={handleCopyLink}
              title="Copy Link"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors shrink-0"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleWhatsAppShare}
              className="w-full justify-center text-xs"
              icon={<MessageSquare className="w-3.5 h-3.5 text-emerald-400" />}
            >
              WhatsApp
            </Button>
            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full"
            >
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-center text-xs text-brand-400"
                icon={<ExternalLink className="w-3.5 h-3.5" />}
              >
                Open View
              </Button>
            </a>
          </div>
        </Card>

        {/* Live GPS Telemetry Card */}
        <Card className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Live Coordinates & Accuracy
          </h3>
          {location ? (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Coordinates</span>
                <span className="font-mono text-slate-100">
                  {formatCoordinates(location.latitude, location.longitude)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">GPS Accuracy</span>
                <span className="text-emerald-400 font-medium">±{Math.round(location.accuracy)} meters</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Last Received</span>
                <span className="text-slate-200">
                  {location.receivedAt ? formatRelativeTime(location.receivedAt) : 'Just now'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Speed / Heading</span>
                <span className="text-slate-300">
                  {location.speed ? `${(location.speed * 3.6).toFixed(1)} km/h` : 'Stationary'}
                  {location.heading ? ` • ${Math.round(location.heading)}°` : ''}
                </span>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center space-y-1">
              <p className="text-xs text-slate-400">No coordinates recorded yet.</p>
              <p className="text-[11px] text-slate-500">
                Data appears as soon as the recipient opens the link and clicks "Share My Live Location".
              </p>
            </div>
          )}
        </Card>

        {/* Privacy & Session Specs Card */}
        <Card className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Session Security Specs
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-slate-400">Consent State</span>
              <span className="capitalize text-slate-200">{session.consentStatus}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-slate-400">Expires At</span>
              <span className="text-slate-200">{formatDateTime(session.expiresAt)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-slate-400">Token Storage</span>
              <span className="text-emerald-400 font-mono text-[11px]">SHA-256 Hash Only</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Auto-Purge</span>
              <span className="text-slate-300">Strict 24h Policy</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
