import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { useAuth } from '@/hooks/useAuth';
import { ToastProvider } from '@/contexts/ToastContext';

// Pages
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { SignupPage } from '@/pages/auth/SignupPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DashboardOverviewPage } from '@/pages/dashboard/DashboardOverviewPage';
import { SessionsListPage } from '@/pages/dashboard/SessionsListPage';
import { SessionDetailPage } from '@/pages/dashboard/SessionDetailPage';
import { RecipientConsentPage } from '@/pages/share/RecipientConsentPage';
import { PrivacyPage } from '@/pages/legal/PrivacyPage';
import { TermsPage } from '@/pages/legal/TermsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, isFirebaseConfigured, enterDemoMode } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
          <span className="text-xs">Authenticating...</span>
        </div>
      </div>
    );
  }

  // If not logged in and Firebase is configured, redirect to login
  if (!user && isFirebaseConfigured) {
    return <Navigate to="/auth/login" replace />;
  }

  // If in demo mode without user, auto-initialize demo user
  if (!user && !isFirebaseConfigured) {
    enterDemoMode();
    return null;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Landing & Marketing */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />

            {/* Public Authentication */}
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/signup" element={<SignupPage />} />
            <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />

            {/* Public Recipient Consent & Live Sharing Route */}
            <Route path="/share/:token" element={<RecipientConsentPage />} />

            {/* Authenticated Dashboard Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardOverviewPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/sessions"
              element={
                <ProtectedRoute>
                  <SessionsListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/sessions/:id"
              element={
                <ProtectedRoute>
                  <SessionDetailPage />
                </ProtectedRoute>
              }
            />

            {/* 404 Fallback */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
