import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  children?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      icon,
      iconPosition = 'right',
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'group relative inline-flex items-center justify-center font-medium transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none select-none rounded-full';

    const sizeStyles = {
      sm: 'text-xs px-3.5 py-1.5 gap-2',
      md: 'text-sm px-5 py-2.5 gap-2.5',
      lg: 'text-base px-7 py-3.5 gap-3',
    };

    const variantStyles = {
      primary:
        'bg-brand-600 hover:bg-brand-500 text-white shadow-glow-brand hover:shadow-[0_0_40px_-5px_rgba(99,102,241,0.5)] border border-brand-400/30',
      secondary:
        'bg-dark-800 hover:bg-dark-750 text-slate-200 border border-white/10 hover:border-white/20 shadow-bezel-inner',
      danger:
        'bg-rose-600/90 hover:bg-rose-500 text-white shadow-glow-rose border border-rose-400/30',
      ghost:
        'bg-transparent hover:bg-white/5 text-slate-300 hover:text-white',
      outline:
        'bg-transparent border border-white/15 hover:border-brand-500/50 hover:bg-brand-500/5 text-slate-200',
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: disabled || loading ? 1 : 1.015 }}
        whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
        transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
        disabled={disabled || loading}
        className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
        {...props}
      >
        {/* Loading spinner */}
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}

        {/* Left Icon */}
        {!loading && icon && iconPosition === 'left' && (
          <span className="shrink-0 transition-transform duration-300 group-hover:-translate-x-0.5">
            {icon}
          </span>
        )}

        <span>{children}</span>

        {/* Right Icon - Nested button-in-button island architecture */}
        {!loading && icon && iconPosition === 'right' && (
          <span
            className={cn(
              'shrink-0 flex items-center justify-center rounded-full transition-all duration-300',
              size === 'sm' && 'w-5 h-5 text-xs',
              size === 'md' && 'w-6 h-6 text-sm',
              size === 'lg' && 'w-7 h-7 text-base',
              variant === 'primary' && 'bg-white/15 group-hover:bg-white/25 group-hover:translate-x-0.5',
              variant === 'secondary' && 'bg-white/5 group-hover:bg-white/10 group-hover:translate-x-0.5',
              variant === 'danger' && 'bg-white/20 group-hover:bg-white/30 group-hover:translate-x-0.5',
              variant === 'ghost' && 'group-hover:translate-x-0.5',
              variant === 'outline' && 'bg-white/5 group-hover:bg-white/10 group-hover:translate-x-0.5'
            )}
          >
            {icon}
          </span>
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
