import React from 'react';
import { Link } from 'react-router-dom';
import { Radio, ShieldCheck, Heart } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export const Footer: React.FC = () => {
  return (
    <footer className="relative border-t border-white/[0.08] bg-dark-950 pt-16 pb-12 overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-brand-500/5 blur-3xl pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-brand-500/15 border border-brand-500/30">
                <Radio className="w-3.5 h-3.5 text-brand-400" />
              </div>
              <div className="flex items-center gap-1 font-bold text-lg tracking-tight">
                <span className="text-white">Locate</span>
                <span className="text-brand-400">Flow</span>
              </div>
            </Link>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Ethical, consent-driven live location sharing. Zero silent tracking, automatic 24-hour expiration, and complete recipient sovereignty over their GPS coordinates.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400/90 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full w-max">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Recipients control whether and when they share location</span>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Product
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link to="/#how-it-works" className="hover:text-white transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/#features" className="hover:text-white transition-colors">
                  Bento Features
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-white transition-colors">
                  Owner Dashboard
                </Link>
              </li>
              <li>
                <Link to="/auth/login" className="hover:text-white transition-colors">
                  Sign In
                </Link>
              </li>
            </ul>
          </div>

          {/* Security & Legal */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Privacy & Trust
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link to="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <span className="text-slate-500 cursor-not-allowed">
                  24-Hour Auto-Purge
                </span>
              </li>
              <li>
                <span className="text-slate-500 cursor-not-allowed">
                  Cryptographic Hashing
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/[0.06] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {CURRENT_YEAR} LocateFlow Inc. All rights reserved.
          </div>
          <div className="flex items-center gap-1.5">
            <span>Built with precision & privacy in mind</span>
            <Heart className="w-3 h-3 text-brand-400 fill-brand-400/30" />
          </div>
        </div>
      </div>
    </footer>
  );
};
