import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Plus,
  Search,
  Copy,
  Check,
  Trash2,
  Ban,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { sessionService } from '@/services/sessionService';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CreateSessionModal } from '@/pages/dashboard/CreateSessionModal';
import { formatDateTime, formatTimeRemaining } from '@/lib/utils';
import type { TrackingSession, SessionStatus } from '@/types/session';

export const SessionsListPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { success, error, info } = useToast();

  const [sessions, setSessions] = useState<TrackingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | SessionStatus>('all');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 15000);
    return () => clearInterval(timer);
  }, []);

  const fetchSessions = useCallback(() => {
    if (!user) return;
    sessionService
      .getUserSessions(user.uid)
      .then((data) => setSessions(data))
      .catch((err: any) => error('Failed to load sessions', err.message))
      .finally(() => setLoading(false));
  }, [user, error]);

  useEffect(() => {
    if (!user) return;
    let ignore = false;
    sessionService
      .getUserSessions(user.uid)
      .then((data) => {
        if (!ignore) setSessions(data);
      })
      .catch((err: any) => {
        if (!ignore) error('Failed to load sessions', err.message);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [user, error]);

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const matchesSearch =
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'expired'
          ? s.status === 'expired' || currentTime > s.expiresAt
          : s.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [sessions, searchQuery, statusFilter, currentTime]);

  const handleCopy = (session: TrackingSession) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://locateflow.app';
    const savedRawToken = typeof window !== 'undefined' ? localStorage.getItem(`rawToken_${session.id}`) : null;
    const shareToken = savedRawToken || session.tokenHash || session.id;
    const url = `${origin}/share/${shareToken}`;
    navigator.clipboard.writeText(url);
    setCopiedId(session.id);
    success('Link Copied', 'Share URL is copied to clipboard.');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRevoke = async (session: TrackingSession) => {
    if (!user) return;
    if (!window.confirm(`Revoke live tracking for "${session.title}"?`)) return;

    try {
      await sessionService.revokeSession(session.id, user.uid);
      info('Session Revoked', 'Live location broadcast terminated.');
      fetchSessions();
    } catch (err: any) {
      error('Revoke Failed', err.message);
    }
  };

  const handleDelete = async (session: TrackingSession) => {
    if (!user) return;
    if (!window.confirm(`Permanently delete "${session.title}"?`)) return;

    try {
      await sessionService.deleteSession(session.id, user.uid);
      success('Session Deleted', 'Session removed.');
      setSessions((prev) => prev.filter((x) => x.id !== session.id));
    } catch (err: any) {
      error('Delete Failed', err.message);
    }
  };

  const filterTabs: Array<{ label: string; value: 'all' | SessionStatus }> = [
    { label: 'All Sessions', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Pending', value: 'pending' },
    { label: 'Stopped', value: 'stopped' },
    { label: 'Expired', value: 'expired' },
    { label: 'Revoked', value: 'revoked' },
  ];

  return (
    <div className="space-y-6">
      <CreateSessionModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={(res) => {
          setCreateModalOpen(false);
          navigate(`/dashboard/sessions/${res.session.id}`);
        }}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
            Tracking Sessions
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your location links, review live broadcasts, and revoke expired connections.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setCreateModalOpen(true)}
        >
          New Session
        </Button>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-dark-900 border border-white/10 overflow-x-auto">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                statusFilter === tab.value
                  ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30 shadow-bezel-inner'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title..."
            className="w-full bg-dark-900 text-slate-100 text-sm rounded-xl pl-9 pr-4 py-2 border border-white/10 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          />
        </div>
      </div>

      {/* Sessions Grid / Table */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">
          Loading sessions...
        </div>
      ) : filteredSessions.length > 0 ? (
        <div className="space-y-3">
          {filteredSessions.map((s) => (
            <Card
              key={s.id}
              className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-white/20 transition-all duration-200"
            >
              {/* Left Info */}
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <Link
                    to={`/dashboard/sessions/${s.id}`}
                    className="font-semibold text-base text-slate-100 hover:text-brand-300 transition-colors"
                  >
                    {s.title}
                  </Link>
                  <Badge status={s.status} />
                </div>
                {s.description && (
                  <p className="text-xs text-slate-400 line-clamp-1">{s.description}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-slate-500 pt-0.5">
                  <span>Created {formatDateTime(s.createdAt)}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-brand-400" />
                    {formatTimeRemaining(s.expiresAt).text}
                  </span>
                </div>
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                <button
                  onClick={() => handleCopy(s)}
                  title="Copy Share Link"
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 transition-colors"
                >
                  {copiedId === s.id ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>

                {s.status !== 'revoked' && s.status !== 'expired' && (
                  <button
                    onClick={() => handleRevoke(s)}
                    title="Revoke Tracking Access"
                    className="p-2 rounded-xl bg-white/5 hover:bg-amber-500/10 text-slate-400 hover:text-amber-400 border border-white/5 transition-colors"
                  >
                    <Ban className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => handleDelete(s)}
                  title="Delete Session"
                  className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-white/5 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <Link to={`/dashboard/sessions/${s.id}`}>
                  <Button size="sm" variant="secondary" icon={<ArrowRight className="w-3.5 h-3.5" />}>
                    Open Map
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="py-14 text-center space-y-3">
          <MapPin className="w-8 h-8 text-slate-500 mx-auto" />
          <h4 className="text-base font-semibold text-slate-200">No Matching Sessions</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your search query or status filter.'
              : 'Create a new tracking link to get started.'}
          </p>
          {(searchQuery || statusFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
            >
              Reset Filters
            </Button>
          )}
        </Card>
      )}
    </div>
  );
};
