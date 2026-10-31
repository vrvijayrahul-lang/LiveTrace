import { createContext } from 'react';
import type { AppUser } from '@/types/user';

export interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  isFirebaseConfigured: boolean;
  login: (data: any) => Promise<AppUser>;
  signup: (data: any) => Promise<AppUser>;
  loginWithGoogle: () => Promise<AppUser>;
  enterDemoMode: () => Promise<AppUser>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
