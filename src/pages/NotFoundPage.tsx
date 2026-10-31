import React from 'react';
import { Link } from 'react-router-dom';
import { Radio, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center p-6 text-center text-slate-100">
      <div className="w-16 h-16 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 mb-6">
        <Radio className="w-8 h-8" />
      </div>
      <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-2">404</h1>
      <h2 className="text-xl font-semibold text-slate-300 mb-4">Coordinates Not Found</h2>
      <p className="text-sm text-slate-400 max-w-sm mb-8 leading-relaxed">
        The requested URL does not exist or the location route has been relocated.
      </p>
      <Link to="/">
        <Button variant="primary" icon={<ArrowLeft className="w-4 h-4" />}>
          Return to Home
        </Button>
      </Link>
    </div>
  );
};
