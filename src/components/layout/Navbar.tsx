import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, ArrowRight, ShieldCheck, Sparkles, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';

export const Navbar: React.FC = () => {
  const { user, logout, isFirebaseConfigured, enterDemoMode } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-0 inset-x-0 z-40 px-4 sm:px-6 pointer-events-none">
      {/* Detached Fluid Island Pill Container */}
      <div className="max-w-5xl mx-auto mt-4 sm:mt-6 pointer-events-auto">
        <nav className="relative flex items-center justify-between px-4 sm:px-6 py-2.5 rounded-full bg-dark-900/85 backdrop-blur-2xl border border-white/[0.09] shadow-bezel-outer">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-brand-500/15 border border-brand-500/30 group-hover:scale-105 transition-transform duration-300">
              <Radio className="w-4 h-4 text-brand-400 animate-pulse" strokeWidth={2} />
              <div className="absolute inset-0 rounded-full bg-brand-500/20 blur-sm group-hover:blur-md transition-all" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-white text-base">Locate</span>
              <span className="font-bold tracking-tight text-brand-400 text-base">Flow</span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-300">
            <Link
              to="/#how-it-works"
              className="hover:text-white transition-colors duration-200"
            >
              How It Works
            </Link>
            <Link
              to="/#features"
              className="hover:text-white transition-colors duration-200"
            >
              Features
            </Link>
            <Link
              to="/privacy"
              className="hover:text-white transition-colors duration-200 flex items-center gap-1"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
              Privacy Model
            </Link>
          </div>

          {/* Right Action / Auth CTA */}
          <div className="hidden md:flex items-center gap-3">
            {!isFirebaseConfigured && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
                <Sparkles className="w-3 h-3" />
                Simulator Mode
              </span>
            )}

            {user ? (
              <div className="flex items-center gap-2">
                <Link to="/dashboard">
                  <Button size="sm" variant="secondary" icon={<LayoutDashboard className="w-3.5 h-3.5" />}>
                    Dashboard
                  </Button>
                </Link>
                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/auth/login">
                  <Button size="sm" variant="ghost">
                    Sign In
                  </Button>
                </Link>
                <Link to="/dashboard">
                  <Button
                    size="sm"
                    variant="primary"
                    icon={<ArrowRight className="w-3.5 h-3.5" />}
                    onClick={(e) => {
                      if (!user && !isFirebaseConfigured) {
                        e.preventDefault();
                        enterDemoMode().then(() => navigate('/dashboard'));
                      }
                    }}
                  >
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Morph Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="md:hidden relative w-9 h-9 rounded-full flex flex-col items-center justify-center gap-1.5 p-2 bg-white/5 border border-white/10"
          >
            <motion.span
              animate={mobileMenuOpen ? { rotate: 45, y: 7.5 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
              className="w-5 h-0.5 bg-slate-200 rounded-full block origin-center"
            />
            <motion.span
              animate={mobileMenuOpen ? { opacity: 0 } : { opacity: 1 }}
              transition={{ duration: 0.15 }}
              className="w-5 h-0.5 bg-slate-200 rounded-full block"
            />
            <motion.span
              animate={mobileMenuOpen ? { rotate: -45, y: -7.5 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
              className="w-5 h-0.5 bg-slate-200 rounded-full block origin-center"
            />
          </button>
        </nav>
      </div>

      {/* Mobile Staggered Mask Reveal Modal */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            className="fixed inset-x-4 top-20 z-50 p-6 rounded-3xl bg-dark-900/95 backdrop-blur-3xl border border-white/10 shadow-bezel-outer pointer-events-auto md:hidden"
          >
            <div className="flex flex-col gap-4 text-base font-medium text-slate-200">
              <Link
                to="/#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 rounded-xl hover:bg-white/5 transition-colors"
              >
                How It Works
              </Link>
              <Link
                to="/#features"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 rounded-xl hover:bg-white/5 transition-colors"
              >
                Features
              </Link>
              <Link
                to="/privacy"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 rounded-xl hover:bg-white/5 transition-colors flex items-center justify-between"
              >
                <span>Privacy & Consent</span>
                <ShieldCheck className="w-4 h-4 text-brand-400" />
              </Link>

              <hr className="border-white/10 my-1" />

              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full"
                  >
                    <Button variant="primary" className="w-full" icon={<LayoutDashboard className="w-4 h-4" />}>
                      Go to Dashboard
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="w-full text-rose-400 hover:text-rose-300"
                    icon={<LogOut className="w-4 h-4" />}
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                <div className="flex flex-col gap-2.5">
                  <Link
                    to="/auth/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full"
                  >
                    <Button variant="secondary" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Button
                    variant="primary"
                    className="w-full"
                    icon={<ArrowRight className="w-4 h-4" />}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (!isFirebaseConfigured) {
                        enterDemoMode().then(() => navigate('/dashboard'));
                      } else {
                        navigate('/auth/signup');
                      }
                    }}
                  >
                    Get Started Free
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
