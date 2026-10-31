import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card } from '@/components/ui/Card';

export const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-950 text-slate-100">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-36 pb-24 space-y-10">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>

        <div className="space-y-3">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Terms of Service
          </h1>
          <p className="text-sm text-slate-400">
            Acceptable Use & Ethical Conduct Guidelines
          </p>
        </div>

        <Card className="space-y-6 text-left text-sm leading-relaxed text-slate-300">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">1. Authorized and Consensual Use Only</h2>
            <p>
              LocateFlow may only be used for legitimate, consensual location coordination between consenting parties (such as logistics coordination, delivery tracking, meeting friends, or family ETA updates).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">2. Prohibited Malicious Activities</h2>
            <p className="text-rose-300">
              You agree NOT to use LocateFlow for covert stalking, unconsented surveillance, harassment, deceptive social engineering, or any unlawful activity. Any session found violating these terms is subject to immediate termination.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">3. Automatic 24-Hour Expiration</h2>
            <p>
              All sessions are temporary and hard-capped at 24 hours. LocateFlow does not provide permanent tracking or historical surveillance records.
            </p>
          </section>
        </Card>
      </main>

      <Footer />
    </div>
  );
};
