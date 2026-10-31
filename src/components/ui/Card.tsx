import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  outerClassName?: string;
  glow?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, outerClassName, glow = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative p-1.5 rounded-[2rem] bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/[0.08] shadow-bezel-outer transition-all duration-300',
          glow && 'before:absolute before:-inset-px before:rounded-[2rem] before:bg-brand-500/10 before:blur-xl before:-z-10',
          outerClassName
        )}
      >
        <div
          className={cn(
            'relative w-full h-full p-6 sm:p-8 rounded-[calc(2rem-0.375rem)] bg-dark-900/95 backdrop-blur-md shadow-bezel-inner border border-white/[0.04]',
            className
          )}
          {...props}
        >
          {children}
        </div>
      </div>
    );
  }
);

Card.displayName = 'Card';
