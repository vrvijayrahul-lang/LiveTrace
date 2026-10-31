import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Clock,
  ArrowRight,
  Lock,
  CheckCircle2,
  Radio,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { CreateSessionModal } from '@/pages/dashboard/CreateSessionModal';

export const LandingPage: React.FC = () => {
  const { user, enterDemoMode, isFirebaseConfigured } = useAuth();
  const navigate = useNavigate();
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const handleStartCTA = () => {
    if (user) {
      navigate('/dashboard');
    } else if (!isFirebaseConfigured) {
      enterDemoMode().then(() => navigate('/dashboard'));
    } else {
      navigate('/auth/signup');
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100 selection:bg-brand-500/30 selection:text-white">
      <Navbar />

      <CreateSessionModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={(res) => {
          setCreateModalOpen(false);
          navigate(`/dashboard/sessions/${res.session.id}`);
        }}
      />

      {/* HERO SECTION */}
      <section className="relative pt-36 pb-24 md:pt-48 md:pb-36 overflow-hidden">
        {/* Background Radial Glow Orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-brand-600/15 via-violet-600/10 to-transparent rounded-full blur-[140px] pointer-events-none -z-10" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-8">
          {/* Eyebrow Micro-Badge */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 shadow-glow-brand"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
            <span className="text-[11px] font-semibold text-brand-300 uppercase tracking-[0.2em]">
              Consent-First GPS Architecture
            </span>
          </motion.div>

          {/* Massive Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.32, 0.72, 0, 1] }}
            className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.08]"
          >
            Share your location.{' '}
            <span className="bg-gradient-to-r from-brand-400 via-indigo-300 to-accent-cyan bg-clip-text text-transparent">
              Stay connected.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.32, 0.72, 0, 1] }}
            className="text-base sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed"
          >
            Create private, cryptographically secured tracking links. No covert surveillance, no hidden background tracking, and automatic 24-hour expiration.
          </motion.p>

          {/* Action Button Island */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <Button
              size="lg"
              variant="primary"
              className="w-full sm:w-auto shadow-glow-brand font-semibold"
              icon={<ArrowRight className="w-4 h-4" />}
              onClick={handleStartCTA}
            >
              Get Started Free
            </Button>

            <a href="#how-it-works" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="secondary"
                className="w-full justify-center"
              >
                How It Works
              </Button>
            </a>
          </motion.div>

          {/* Trust Guarantees Row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="pt-10 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-slate-400"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Zero tracking without recipient approval</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-400" />
              <span>Automatic 24-Hour Purge</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-accent-cyan" />
              <span>SHA-256 Hashed Tokens</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* HERO PREVIEW MOCKUP (DOUBLE-BEZEL DISPLAY) */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 -mt-8 mb-24">
        <div className="relative p-2 rounded-[2.5rem] bg-gradient-to-b from-white/[0.12] to-white/[0.02] border border-white/10 shadow-bezel-outer">
          <div className="relative rounded-[calc(2.5rem-0.5rem)] bg-dark-900 overflow-hidden border border-white/5 shadow-bezel-inner">
            {/* Mockup Header Bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-dark-950/80">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="text-xs font-mono text-slate-400 ml-2">locateflow.app/share/e9a2f1...</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-emerald-400 font-medium">Live Radar Active</span>
              </div>
            </div>

            {/* Mockup Body Content */}
            <div className="p-6 sm:p-10 grid grid-cols-1 md:grid-cols-3 gap-6 bg-gradient-to-b from-dark-900 to-dark-950">
              <div className="md:col-span-2 relative h-72 rounded-2xl bg-dark-850 border border-white/10 overflow-hidden flex items-center justify-center">
                {/* Simulated radar map */}
                <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:16px_16px]" />
                <div className="relative flex flex-col items-center gap-3">
                  <div className="relative flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-brand-500/20 animate-ping absolute" />
                    <div className="w-14 h-14 rounded-full bg-brand-500/40 animate-pulse" />
                    <div className="w-4 h-4 rounded-full bg-white border-2 border-brand-500 shadow-[0_0_15px_#6366F1] relative z-10" />
                  </div>
                  <div className="px-3 py-1 rounded-full bg-dark-900/90 border border-white/10 text-xs font-mono text-slate-200">
                    37.77492° N, 122.41941° W (±12m)
                  </div>
                </div>
              </div>

              <div className="space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <Badge status="active" />
                  <h3 className="font-bold text-slate-100 text-lg">Courier Drop-off Route</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Live GPS coordinates transmitted continuously with explicit recipient consent.
                  </p>
                </div>

                <div className="space-y-2 text-xs text-slate-400 bg-white/5 p-3.5 rounded-xl border border-white/5">
                  <div className="flex justify-between">
                    <span>Recipient Consent</span>
                    <span className="text-emerald-400 font-medium">Granted</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Auto Expiration</span>
                    <span className="text-slate-200">23h 48m left</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Security</span>
                    <span className="text-slate-200">SHA-256 Hashed</span>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="primary"
                  className="w-full justify-center"
                  icon={<ArrowRight className="w-3.5 h-3.5" />}
                  onClick={handleStartCTA}
                >
                  Try LocateFlow Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS (3-STEP SEQUENCE) */}
      <section id="how-it-works" className="py-24 border-t border-white/[0.08] bg-dark-900/40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center space-y-4 mb-16">
            <span className="text-xs uppercase tracking-[0.2em] font-semibold text-brand-400">
              Frictionless & Sovereign
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              How Live Sharing Works
            </h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
              Three clear steps designed with recipient privacy as the non-negotiable foundation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <Card className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 font-bold text-lg">
                01
              </div>
              <h3 className="text-lg font-bold text-slate-100">Create Private Link</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Define the session title and instructions. LocateFlow generates a cryptographically strong 32-byte token and stores only its SHA-256 hash.
              </p>
              <div className="pt-2 text-xs text-brand-400 flex items-center gap-1">
                <span>Fixed 24-hour lifetime</span>
              </div>
            </Card>

            {/* Step 2 */}
            <Card className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 font-bold text-lg">
                02
              </div>
              <h3 className="text-lg font-bold text-slate-100">Recipient Grants Consent</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                The recipient receives the link via WhatsApp, SMS, or Slack. They review what data is collected and must explicitly tap "Share My Live Location".
              </p>
              <div className="pt-2 text-xs text-emerald-400 flex items-center gap-1">
                <span>Zero location data before consent</span>
              </div>
            </Card>

            {/* Step 3 */}
            <Card className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center text-accent-cyan font-bold text-lg">
                03
              </div>
              <h3 className="text-lg font-bold text-slate-100">Live Map & Stop Control</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                The owner tracks coordinates on an interactive Leaflet map with accuracy radius and stale warnings. The recipient can tap "Stop Sharing" at any time.
              </p>
              <div className="pt-2 text-xs text-brand-300 flex items-center gap-1">
                <span>Real-time GPS updates</span>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ASYMMETRICAL BENTO GRID FEATURES */}
      <section id="features" className="py-24 border-t border-white/[0.08]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-16">
          <div className="text-center space-y-4">
            <span className="text-xs uppercase tracking-[0.2em] font-semibold text-brand-400">
              Enterprise Architecture
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
              Built for Absolute Trust
            </h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">
              Every detail engineered to prevent abuse, enforce consent, and protect location privacy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bento Card 1: Large Span */}
            <Card className="md:col-span-2 space-y-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-2xl font-bold text-slate-100 tracking-tight">
                  Consent-First Sovereignty
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed max-w-xl">
                  Unlike traditional trackers that silently attempt to guess coordinates via IP geolocation or hidden scripts, LocateFlow enforces strict browser permission prompts. Coordinates are only requested after the recipient explicitly authorizes the transmission.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-white/5 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>No IP geolocation fallbacks</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Prominent Stop Sharing button</span>
                </div>
              </div>
            </Card>

            {/* Bento Card 2 */}
            <Card className="space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-brand-500/10 border border-brand-500/25 flex items-center justify-center text-brand-400">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-slate-100">24-Hour Expiration</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every session is hard-capped at 24 hours. Client and server validation prevent any further coordinates from being written once expired.
              </p>
              <div className="p-3 rounded-xl bg-white/5 text-xs font-mono text-brand-300 border border-white/5">
                autoExpire: Date.now() + 86400000
              </div>
            </Card>

            {/* Bento Card 3 */}
            <Card className="space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-violet-500/10 border border-violet-500/25 flex items-center justify-center text-violet-400">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-slate-100">Cryptographic Hashing</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Raw tokens are never stored in Firestore documents. Only SHA-256 hashes are preserved, ensuring tokens cannot be scraped or enumerated.
              </p>
            </Card>

            {/* Bento Card 4: 2 Col Span */}
            <Card className="md:col-span-2 space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-accent-cyan/10 border border-accent-cyan/25 flex items-center justify-center text-accent-cyan">
                <Radio className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-slate-100">
                Leaflet & OpenStreetMap Live Stream
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Interactive real-time map with pulsing radar beacon, accuracy ring, follow-camera mode, and stale signal detection if the device enters a tunnel or loses network connectivity.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="py-24 border-t border-white/[0.08] relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-8">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Ready for transparent, consent-first tracking?
          </h2>
          <p className="text-base text-slate-400 max-w-xl mx-auto">
            Start creating secure 24-hour location links in seconds. Free forever for personal use.
          </p>

          <Button
            size="lg"
            variant="primary"
            className="shadow-glow-brand font-semibold"
            icon={<ArrowRight className="w-4 h-4" />}
            onClick={handleStartCTA}
          >
            Create Your First Link
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};
