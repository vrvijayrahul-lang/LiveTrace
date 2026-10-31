import React, { useEffect, useState } from 'react';
import type { AppUser } from '@/types/user';
import { authService } from '@/services/authService';
import { isFirebaseConfigured } from '@/lib/firebase';
import { AuthContext } from '@/contexts/AuthContextValue';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (data: any) => {
    const loggedUser = await authService.login(data);
    setUser(loggedUser);
    return loggedUser;
  };

  const signup = async (data: any) => {
    const newUser = await authService.signup(data);
    setUser(newUser);
    return newUser;
  };

  const loginWithGoogle = async () => {
    const googleUser = await authService.signInWithGoogle();
    setUser(googleUser);
    return googleUser;
  };

  const enterDemoMode = async () => {
    const demoUser = await authService.enterQuickDemo();
    setUser(demoUser);
    return demoUser;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const resetPassword = async (email: string) => {
    await authService.resetPassword(email);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isFirebaseConfigured,
        login,
        signup,
        loginWithGoogle,
        enterDemoMode,
        logout,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
