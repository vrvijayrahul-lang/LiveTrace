import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const maxWidthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Double-Bezel Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            className={cn(
              'relative w-full z-10 p-1.5 rounded-[2rem] bg-gradient-to-b from-white/[0.12] to-white/[0.04] border border-white/10 shadow-bezel-outer',
              maxWidthStyles[maxWidth]
            )}
          >
            <div className="relative p-6 sm:p-8 rounded-[calc(2rem-0.375rem)] bg-dark-900 border border-white/[0.05] shadow-bezel-inner">
              {/* Close Button */}
              <button
                onClick={onClose}
                aria-label="Close modal"
                className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Title & Description */}
              {(title || description) && (
                <div className="mb-6 pr-8">
                  {title && (
                    <h3 className="text-xl font-bold text-slate-100 tracking-tight">{title}</h3>
                  )}
                  {description && (
                    <p className="text-sm text-slate-400 mt-1 leading-relaxed">{description}</p>
                  )}
                </div>
              )}

              {/* Body */}
              <div>{children}</div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
