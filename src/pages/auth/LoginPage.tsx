import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Radio, Mail, Lock, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { loginSchema, type LoginFormData } from '@/lib/validation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

export const LoginPage: React.FC = () => {
  const { login, loginWithGoogle, enterDemoMode, isFirebaseConfigured } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      await login(data);
      success('Welcome back', 'Signed in successfully.');
      navigate('/dashboard');
    } catch (err: any) {
      error('Sign-in Failed', err.message || 'Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await loginWithGoogle();
      success('Google Sign-In', 'Connected with Google account.');
      navigate('/dashboard');
    } catch (err: any) {
      error('Google Sign-In Failed', err.message);
    }
  };

  const handleQuickDemo = async () => {
    await enterDemoMode();
    success('Simulator Mode Active', 'Logged in as Demo Explorer (Alex Rivera).');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center p-4 sm:p-6 text-slate-100 relative">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-500/10 rounded-full blur-[100px]" />
      </div>

      {/* Brand Icon Header */}
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
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-white">Sign In</h1>
          <p className="text-xs text-slate-400">
            Access your tracking dashboard and manage live links.
          </p>
        </div>

        {/* Quick Demo Mode Pill */}
        {!isFirebaseConfigured && (
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Simulator Environment Active</span>
            </div>
            <p className="text-[11px] text-amber-300/80 leading-relaxed">
              No Firebase credentials needed to test. Click below for instant one-click dashboard access:
            </p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleQuickDemo}
              className="w-full justify-center bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/30 text-amber-200"
            >
              Sign In as Demo Explorer
            </Button>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="you@company.com"
            leftIcon={<Mail className="w-4 h-4" />}
            error={errors.email?.message}
            {...register('email')}
          />

          <div className="space-y-1">
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              error={errors.password?.message}
              {...register('password')}
            />
            <div className="text-right">
              <Link
                to="/auth/forgot-password"
                className="text-[11px] text-brand-400 hover:text-brand-300 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full justify-center shadow-glow-brand"
            loading={loading}
            icon={<ArrowRight className="w-4 h-4" />}
          >
            Sign In
          </Button>
        </form>

        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-white/10 w-full" />
          <span className="bg-dark-900 px-3 text-[11px] text-slate-500 uppercase tracking-wider">
            Or continue with
          </span>
          <div className="border-t border-white/10 w-full" />
        </div>

        {/* Google OAuth Button */}
        <Button
          type="button"
          variant="secondary"
          size="md"
          className="w-full justify-center"
          onClick={handleGoogleSignIn}
        >
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Google Account
        </Button>

        <p className="text-center text-xs text-slate-400">
          Don't have an account?{' '}
          <Link to="/auth/signup" className="text-brand-400 hover:text-brand-300 font-medium">
            Create account
          </Link>
        </p>
      </Card>
    </div>
  );
};
