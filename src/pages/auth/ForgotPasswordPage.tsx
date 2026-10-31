import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Radio, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/lib/validation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

export const ForgotPasswordPage: React.FC = () => {
  const { resetPassword } = useAuth();
  const { error } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setLoading(true);
    try {
      await resetPassword(data.email);
      setSubmitted(true);
    } catch (err: any) {
      error('Password Reset Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center p-4 sm:p-6 text-slate-100 relative">
      <Link to="/" className="mb-6 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-brand-500/15 border border-brand-500/30 flex items-center justify-center">
          <Radio className="w-4 h-4 text-brand-400 animate-pulse" />
        </div>
        <div className="font-bold text-xl tracking-tight">
          <span className="text-white">Locate</span>
          <span className="text-brand-400">Flow</span>
        </div>
      </Link>

      <Card className="max-w-md w-full space-y-6">
        {!submitted ? (
          <>
            <div className="space-y-1 text-center">
              <h1 className="text-2xl font-bold tracking-tight text-white">Reset Password</h1>
              <p className="text-xs text-slate-400">
                Enter your email address and we'll send you a password reset link.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="you@company.com"
                leftIcon={<Mail className="w-4 h-4" />}
                error={errors.email?.message}
                {...register('email')}
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full justify-center shadow-glow-brand"
                loading={loading}
              >
                Send Reset Link
              </Button>
            </form>
          </>
        ) : (
          <div className="space-y-4 text-center py-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white">Check Your Inbox</h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
              If an account exists with that email, we've sent password reset instructions.
            </p>
          </div>
        )}

        <div className="pt-2 border-t border-white/10 text-center">
          <Link
            to="/auth/login"
            className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to sign in</span>
          </Link>
        </div>
      </Card>
    </div>
  );
};
