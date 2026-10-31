import React from 'react';
import { cn } from '@/lib/utils';
import type { SessionStatus } from '@/types/session';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'brand' | 'success' | 'warning' | 'danger' | 'neutral' | 'status';
  status?: SessionStatus;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'neutral',
  status,
  dot = false,
  children,
  ...props
}) => {
  // If status is provided, map to semantic variant
  let activeVariant = variant;
  let label = children;

  if (status) {
    switch (status) {
      case 'active':
        activeVariant = 'success';
        label = label || 'Sharing Active';
        break;
      case 'pending':
        activeVariant = 'warning';
        label = label || 'Pending Consent';
        break;
      case 'stopped':
        activeVariant = 'neutral';
        label = label || 'Sharing Stopped';
        break;
      case 'revoked':
        activeVariant = 'danger';
        label = label || 'Revoked';
        break;
      case 'expired':
        activeVariant = 'neutral';
        label = label || 'Expired';
        break;
    }
  }

  const variantStyles = {
    brand:
      'bg-brand-500/10 text-brand-300 border-brand-500/20 shadow-[0_0_15px_-3px_rgba(99,102,241,0.25)]',
    success:
      'bg-emerald-500/10 text-emerald-300 border-emerald-500/25 shadow-[0_0_15px_-3px_rgba(16,185,129,0.25)]',
    warning:
      'bg-amber-500/10 text-amber-300 border-amber-500/25 shadow-[0_0_15px_-3px_rgba(245,158,11,0.25)]',
    danger:
      'bg-rose-500/10 text-rose-300 border-rose-500/25 shadow-[0_0_15px_-3px_rgba(244,63,94,0.25)]',
    neutral:
      'bg-white/5 text-slate-300 border-white/10',
    status:
      'bg-dark-800 text-slate-300 border-white/10',
  };

  const dotStyles = {
    brand: 'bg-brand-400 animate-pulse',
    success: 'bg-emerald-400 animate-pulse',
    warning: 'bg-amber-400',
    danger: 'bg-rose-400',
    neutral: 'bg-slate-400',
    status: 'bg-slate-400',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border tracking-wide uppercase',
        variantStyles[activeVariant],
        className
      )}
      {...props}
    >
      {(dot || status === 'active' || status === 'pending') && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full shrink-0',
            dotStyles[activeVariant]
          )}
        />
      )}
      {label}
    </span>
  );
};
