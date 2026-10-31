import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Copy,
  Check,
  Share2,
  Clock,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { sessionService } from '@/services/sessionService';
import { createSessionSchema, type CreateSessionFormData } from '@/lib/validation';
import { formatDateTime } from '@/lib/utils';
import type { CreatedSessionResult } from '@/types/session';

export interface CreateSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (result: CreatedSessionResult) => void;
}

export const CreateSessionModal: React.FC<CreateSessionModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [createdResult, setCreatedResult] = useState<CreatedSessionResult | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateSessionFormData>({
    resolver: zodResolver(createSessionSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  const onSubmit = async (data: CreateSessionFormData) => {
    if (!user) {
      error('Authentication required', 'Please sign in or use demo mode to create a tracking session.');
      return;
    }

    setLoading(true);
    try {
      const result = await sessionService.createSession(
        user.uid,
        user.displayName || undefined,
        data
      );
      setCreatedResult(result);
      success('Tracking Link Generated', 'Your private 24-hour link is ready to share.');

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#6366F1', '#8B5CF6', '#10B981'],
      });

      if (onCreated) {
        onCreated(result);
      }
    } catch (err: any) {
      error('Failed to create session', err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!createdResult) return;
    navigator.clipboard.writeText(createdResult.shareUrl);
    setCopied(true);
    success('Copied to clipboard', 'Share URL is copied and ready to send.');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    if (!createdResult) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `LocateFlow: ${createdResult.session.title}`,
          text: `Please share your live location for: "${createdResult.session.title}". Location is only shared after your explicit consent.`,
          url: createdResult.shareUrl,
        });
      } catch {
        // User cancelled or share dismissed
      }
    } else {
      handleCopyLink();
    }
  };

  const handleWhatsAppShare = () => {
    if (!createdResult) return;
    const text = encodeURIComponent(
      `Hi, please share your live location for "${createdResult.session.title}" on LocateFlow: ${createdResult.shareUrl}\n\n(Note: GPS coordinates are only shared after you explicitly agree. The link expires in 24 hours).`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleModalClose = () => {
    reset();
    setCreatedResult(null);
    setCopied(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title={createdResult ? 'Your Link is Ready' : 'Create Location Request'}
      description={
        createdResult
          ? 'Share this link with your recipient. Tracking begins only after they grant explicit consent.'
          : 'Generate a cryptographically secured 24-hour link. No GPS data is collected without explicit consent.'
      }
      maxWidth="md"
    >
      {!createdResult ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Session Title"
            placeholder="e.g. Courier Delivery, Airport Pickup, Mountain Hike"
            error={errors.title?.message}
            {...register('title')}
          />

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold text-slate-300 tracking-wide uppercase">
              Optional Context / Instructions
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Please share your location while driving so we can meet at Terminal 2."
              className="w-full bg-dark-900/80 text-slate-100 placeholder:text-slate-500 text-sm rounded-xl px-4 py-2.5 border border-white/10 shadow-bezel-inner focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/60 transition-all resize-none"
              {...register('description')}
            />
            {errors.description && (
              <p className="text-xs text-rose-400 mt-1">{errors.description.message}</p>
            )}
          </div>

          <div className="p-3.5 rounded-2xl bg-dark-800/80 border border-white/10 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5 text-slate-300">
              <Clock className="w-4 h-4 text-brand-400" />
              <span>Session Lifetime</span>
            </div>
            <span className="font-semibold text-brand-300 bg-brand-500/10 px-2.5 py-1 rounded-full border border-brand-500/20">
              Fixed 24 Hours
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2.5 text-xs text-emerald-300">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Zero Covert Tracking:</strong> The recipient must review your request and press "Share My Live Location" in their browser before any coordinates are recorded.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <Button type="button" variant="ghost" onClick={handleModalClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              icon={<Sparkles className="w-4 h-4" />}
            >
              Generate Link
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Shareable Link
            </label>
            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-dark-800 border border-white/10">
              <input
                readOnly
                value={createdResult.shareUrl}
                className="w-full bg-transparent px-3 py-1.5 text-xs font-mono text-brand-300 truncate focus:outline-none"
              />
              <Button
                size="sm"
                variant={copied ? 'secondary' : 'primary'}
                onClick={handleCopyLink}
                icon={copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              >
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="secondary"
              size="md"
              onClick={handleWhatsAppShare}
              className="w-full justify-center bg-emerald-600/15 hover:bg-emerald-600/25 border-emerald-500/30 text-emerald-300"
              icon={<MessageSquare className="w-4 h-4 text-emerald-400" />}
            >
              WhatsApp
            </Button>

            <Button
              variant="secondary"
              size="md"
              onClick={handleNativeShare}
              className="w-full justify-center"
              icon={<Share2 className="w-4 h-4 text-brand-400" />}
            >
              Share Option
            </Button>
          </div>

          <div className="p-3.5 rounded-2xl bg-dark-800/80 border border-white/10 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <span>Expires At</span>
              <span className="font-semibold text-slate-100">
                {formatDateTime(createdResult.session.expiresAt)}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span>Security</span>
              <span className="text-emerald-400">SHA-256 Cryptographic Hash</span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between gap-3 border-t border-white/10">
            <a
              href={createdResult.shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1.5"
            >
              <span>Test recipient view</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <Button
              variant="primary"
              size="sm"
              icon={<ArrowRight className="w-3.5 h-3.5" />}
              onClick={handleModalClose}
            >
              Done & View Map
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
