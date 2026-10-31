import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Radio,
  Plus,
  MapPin,
  Clock,
  ShieldCheck,
  ArrowRight,
  Activity,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { sessionService } from '@/services/sessionService';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CreateSessionModal } from '@/pages/dashboard/CreateSessionModal';
import { formatDateTime, formatTimeRemaining } from '@/lib/utils';
import type { TrackingSession } from '@/types/session';

export const DashboardOverviewPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<TrackingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 15000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user) return;
    sessionService
      .getUserSessions(user.uid)
      .then((data) => {
        setSessions(data);
      })
      .catch((err) => {
        console.error('Failed to load user sessions', err);
      })
      .finally(() => setLoading(false));
  }, [user]);

  // Derive real statistics with memoized evaluation
  const { activeSessions, pendingSessions, expiredSessions } = useMemo(() => {
    return {
      activeSessions: sessions.filter((s) => s.status === 'active' && currentTime <= s.expiresAt),
      pendingSessions: sessions.filter((s) => s.status === 'pending' && currentTime <= s.expiresAt),
      expiredSessions: sessions.filter((s) => s.status === 'expired' || currentTime > s.expiresAt),
    };
  }, [sessions, currentTime]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center">
        <Radio className="w-8 h-8 text-brand-400 animate-spin-slow mb-3" />
        <p className="text-sm text-slate-400">Loading overview...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Create Modal */}
      <CreateSessionModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={(res) => {
          setCreateModalOpen(false);
          navigate(`/dashboard/sessions/${res.session.id}`);
        }}
      />

      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
            Welcome back, {user?.displayName?.split(' ')[0] || 'Explorer'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Monitor active location sessions and generate consent-verified tracking links.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setCreateModalOpen(true)}
        >
          Create Tracking Link
        </Button>
      </div>

      {/* Stat Tiles (Asymmetrical Bento) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Active Transmissions
            </p>
            <h3 className="text-2xl font-bold text-white mt-1">
              {activeSessions.length}
            </h3>
            <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live GPS feeds
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Radio className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Pending Consent
            </p>
            <h3 className="text-2xl font-bold text-white mt-1">
              {pendingSessions.length}
            </h3>
            <span className="text-[11px] text-amber-300/90 mt-0.5">Awaiting recipient</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Created
            </p>
            <h3 className="text-2xl font-bold text-white mt-1">{sessions.length}</h3>
            <span className="text-[11px] text-slate-400 mt-0.5">All-time sessions</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
            <MapPin className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Expired / Concluded
            </p>
            <h3 className="text-2xl font-bold text-white mt-1">
              {expiredSessions.length}
            </h3>
            <span className="text-[11px] text-slate-400 mt-0.5">24h auto-purged</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Active Sessions Live Spotlight */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-lg font-bold text-slate-100">Live Active Feeds</h2>
          </div>
          <Link
            to="/dashboard/sessions"
            className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1"
          >
            <span>View all sessions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {activeSessions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeSessions.map((session) => (
              <Card
                key={session.id}
                className="hover:border-brand-500/40 transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-slate-100 text-base">{session.title}</h4>
                      {session.description && (
                        <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                          {session.description}
                        </p>
                      )}
                    </div>
                    <Badge status="active" />
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-brand-400" />
                      {formatTimeRemaining(session.expiresAt).text}
                    </span>
                    <span className="flex items-center gap-1 text-emerald-400">
                      <Activity className="w-3.5 h-3.5" />
                      Broadcasting Live
                    </span>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-end">
                  <Link to={`/dashboard/sessions/${session.id}`}>
                    <Button
                      size="sm"
                      variant="primary"
                      icon={<ArrowRight className="w-3.5 h-3.5" />}
                    >
                      Open Live Map
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="py-10 text-center space-y-3">
            <div className="w-10 h-10 mx-auto rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
              <Radio className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-slate-200">No Active Transmissions</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              When a recipient accepts a tracking link and shares their GPS coordinates, their live interactive map will stream here.
            </p>
            <Button
              variant="outline"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setCreateModalOpen(true)}
            >
              Generate New Link
            </Button>
          </Card>
        )}
      </div>

      {/* Recent Sessions List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-100">Recent Sessions</h2>

        {sessions.length > 0 ? (
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-dark-900/60 shadow-bezel-inner">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-white/[0.03] text-xs uppercase text-slate-400 tracking-wider border-b border-white/10">
                <tr>
                  <th className="px-5 py-3.5">Session Title</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Created</th>
                  <th className="px-5 py-3.5">Expires</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sessions.slice(0, 5).map((s) => (
                  <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4 font-medium text-slate-100">
                      <Link
                        to={`/dashboard/sessions/${s.id}`}
                        className="hover:text-brand-300 transition-colors"
                      >
                        {s.title}
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <Badge status={s.status} />
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-400">
                      {formatDateTime(s.createdAt)}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-400">
                      {formatTimeRemaining(s.expiresAt).text}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link to={`/dashboard/sessions/${s.id}`}>
                        <Button size="sm" variant="ghost">
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Card className="py-12 text-center space-y-3">
            <MapPin className="w-8 h-8 text-slate-500 mx-auto" />
            <h4 className="text-base font-semibold text-slate-200">No Sessions Yet</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You haven't created any location requests. Click below to generate your first 24-hour private link.
            </p>
            <Button
              variant="primary"
              size="md"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setCreateModalOpen(true)}
            >
              Create First Session
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};
