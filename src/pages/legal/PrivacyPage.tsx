import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card } from '@/components/ui/Card';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-950 text-slate-100">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-36 pb-24 space-y-10">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>

        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Ethical Location Architecture</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            LocateFlow Privacy Policy
          </h1>
          <p className="text-sm text-slate-400">
            Last Updated: October 2026 • Strict Consent & Transparency Standard
          </p>
        </div>

        <Card className="space-y-8 text-left text-sm leading-relaxed text-slate-300">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-400" />
              1. Our Absolute Privacy Directives
            </h2>
            <p>
              LocateFlow was engineered from inception to combat covert tracking, unauthorized surveillance, and deceptive geolocation practices. We uphold the following non-negotiable architectural guarantees:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs">
                  <strong>Never collect GPS on page load:</strong> Opening a link never accesses the device GPS hardware.
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs">
                  <strong>Zero IP Geolocation fallback:</strong> When browser GPS is declined, we never approximate or deduce location via IP address.
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs">
                  <strong>Explicit recipient consent:</strong> The user must clearly press "Share My Live Location" to initialize browser prompts.
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs">
                  <strong>24-Hour hard expiration:</strong> Every tracking session automatically terminates 24 hours after creation.
                </span>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-400" />
              2. What Information is Collected
            </h2>
            <p>
              Only upon explicit recipient approval through the HTML5 Geolocation API, LocateFlow collects:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-300">
              <li><strong>Latitude and Longitude:</strong> High-precision coordinates provided by device GPS/WiFi positioning.</li>
              <li><strong>Accuracy Radius (meters):</strong> Margin of horizontal error reported by the operating system.</li>
              <li><strong>Device Timestamp:</strong> The exact time when the coordinate was logged by the device hardware.</li>
              <li><strong>Speed and Heading (optional):</strong> When traveling in a moving vehicle.</li>
            </ul>
            <p className="text-xs text-slate-400">
              We do NOT collect phone contacts, camera data, microphone data, SMS history, or device file storage.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-400" />
              3. Who Can View the Coordinates
            </h2>
            <p>
              Only the authenticated session owner who generated the tracking link can access the live map. Coordinates are strictly governed by Firestore Security Rules ensuring owners cannot query or inspect coordinates belonging to other sessions.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-400" />
              4. Cryptographic Token Protection
            </h2>
            <p>
              Share links contain an unpredictable 32-byte cryptographic token. To prevent database scraping or enumeration attacks, the raw token is never written to public Firestore documents. The server only stores the SHA-256 digest of the token.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-400" />
              5. Stopping and Revoking Access
            </h2>
            <p>
              The recipient has complete sovereignty over their location broadcast. Pressing the "Stop Sharing" button or closing the browser tab immediately ceases coordinate updates. The owner also holds the ability to revoke any active session immediately from their dashboard.
            </p>
          </section>
        </Card>
      </main>

      <Footer />
    </div>
  );
};
