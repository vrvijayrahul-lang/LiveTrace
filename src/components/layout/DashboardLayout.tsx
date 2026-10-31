import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Radio,
  LayoutDashboard,
  MapPin,
  Plus,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { CreateSessionModal } from '@/pages/dashboard/CreateSessionModal';

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, isFirebaseConfigured } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const navItems = [
    {
      name: 'Overview',
      path: '/dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
      exact: true,
    },
    {
      name: 'All Sessions',
      path: '/dashboard/sessions',
      icon: <MapPin className="w-4 h-4" />,
      exact: false,
    },
    {
      name: 'Privacy Policy',
      path: '/privacy',
      icon: <ShieldCheck className="w-4 h-4" />,
      exact: false,
      external: true,
    },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col md:flex-row text-slate-100">
      {/* Create Session Global Modal */}
      <CreateSessionModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={(res) => {
          setCreateModalOpen(false);
          navigate(`/dashboard/sessions/${res.session.id}`);
        }}
      />

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-white/[0.08] bg-dark-900/60 p-5 justify-between">
        <div className="space-y-6">
          {/* Brand header */}
          <Link to="/" className="flex items-center gap-2.5 px-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-500/15 border border-brand-500/30">
              <Radio className="w-4 h-4 text-brand-400 animate-pulse" />
            </div>
            <div className="flex items-center gap-1 font-bold text-lg tracking-tight">
              <span className="text-white">Locate</span>
              <span className="text-brand-400">Flow</span>
            </div>
          </Link>

          {/* Quick Create Action */}
          <Button
            variant="primary"
            size="md"
            className="w-full justify-center shadow-glow-brand"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setCreateModalOpen(true)}
          >
            Create Share Link
          </Button>

          {/* Nav Items */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = item.exact
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);

              if (item.external) {
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span>{item.name}</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 opacity-50" />
                  </Link>
                );
              }

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                    active
                      ? 'bg-brand-500/15 text-brand-300 border border-brand-500/25 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  <span className={active ? 'text-brand-400' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer User Card */}
        <div className="pt-6 border-t border-white/[0.08] space-y-3">
          {!isFirebaseConfigured && (
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
              <Sparkles className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <span className="font-semibold block">Simulator Mode</span>
                <span className="text-[11px] text-amber-300/80 leading-tight">
                  Running local real-time simulator. Ready for Firebase connect.
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between px-2 py-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-xs font-bold text-brand-300 shrink-0">
                {user?.displayName ? user.displayName.slice(0, 2).toUpperCase() : 'LF'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate">
                  {user?.displayName || 'LocateFlow User'}
                </p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email || 'Authenticated'}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Sign out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/5 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/[0.08] bg-dark-900/90 backdrop-blur-lg sticky top-0 z-30">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-brand-500/15 border border-brand-500/30 flex items-center justify-center">
            <Radio className="w-3.5 h-3.5 text-brand-400" />
          </div>
          <span className="font-bold text-white text-base">LocateFlow</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="primary"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setCreateModalOpen(true)}
          >
            Create
          </Button>

          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white"
          >
            {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileSidebarOpen && (
        <div className="md:hidden fixed inset-x-0 top-14 bottom-0 z-40 bg-dark-950/95 backdrop-blur-2xl p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <nav className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileSidebarOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-slate-200 hover:bg-white/5"
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>
          </div>

          <div className="space-y-3 pt-6 border-t border-white/10">
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full text-rose-400 justify-start"
              icon={<LogOut className="w-4 h-4" />}
            >
              Sign Out
            </Button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
};
