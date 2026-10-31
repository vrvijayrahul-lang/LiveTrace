import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import { demoStore, DEMO_USER } from '@/services/demoStore';
import type { AppUser } from '@/types/user';
import type { LoginFormData, SignupFormData } from '@/lib/validation';

export const authService = {
  /**
   * Observe authentication state changes
   */
  onAuthStateChanged(callback: (user: AppUser | null) => void): () => void {
    if (isFirebaseConfigured && auth) {
      return onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          callback({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            isAnonymous: firebaseUser.isAnonymous,
            createdAt: firebaseUser.metadata.creationTime
              ? new Date(firebaseUser.metadata.creationTime).getTime()
              : Date.now(),
          });
        } else {
          callback(null);
        }
      });
    }

    // Demo Mode: observe demo store
    const initialUser = demoStore.getDemoUser();
    callback(initialUser);
    return demoStore.subscribe('user:changed', (user) => callback(user));
  },

  /**
   * Sign in with Email and Password
   */
  async login({ email, password }: LoginFormData): Promise<AppUser> {
    if (isFirebaseConfigured && auth) {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      return {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: cred.user.displayName,
        photoURL: cred.user.photoURL,
        createdAt: cred.user.metadata.creationTime
          ? new Date(cred.user.metadata.creationTime).getTime()
          : Date.now(),
      };
    }

    // Demo Mode Sign-in
    const demoUser: AppUser = {
      uid: 'demo-' + btoa(email).slice(0, 8),
      email,
      displayName: email.split('@')[0],
      isDemoUser: true,
      createdAt: Date.now(),
    };
    demoStore.setDemoUser(demoUser);
    return demoUser;
  },

  /**
   * Sign up with Email, Password and Display Name
   */
  async signup({ email, password, displayName }: SignupFormData): Promise<AppUser> {
    if (isFirebaseConfigured && auth) {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName && cred.user) {
        await updateProfile(cred.user, { displayName });
      }
      return {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: displayName || cred.user.displayName,
        createdAt: Date.now(),
      };
    }

    // Demo Mode Sign-up
    const demoUser: AppUser = {
      uid: 'demo-' + btoa(email).slice(0, 8),
      email,
      displayName,
      isDemoUser: true,
      createdAt: Date.now(),
    };
    demoStore.setDemoUser(demoUser);
    return demoUser;
  },

  /**
   * Google OAuth Sign-in
   */
  async signInWithGoogle(): Promise<AppUser> {
    if (isFirebaseConfigured && auth) {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      return {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: cred.user.displayName,
        photoURL: cred.user.photoURL,
        createdAt: Date.now(),
      };
    }

    // Demo Mode Google
    const demoUser: AppUser = {
      uid: 'demo-google-user',
      email: 'google.explorer@locateflow.dev',
      displayName: 'Google Demo User',
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
      isDemoUser: true,
      createdAt: Date.now(),
    };
    demoStore.setDemoUser(demoUser);
    return demoUser;
  },

  /**
   * Send Password Reset Email
   */
  async resetPassword(email: string): Promise<void> {
    if (isFirebaseConfigured && auth) {
      await sendPasswordResetEmail(auth, email);
      return;
    }

    // Simulated delay in demo mode
    await new Promise((resolve) => setTimeout(resolve, 800));
  },

  /**
   * Sign Out
   */
  async logout(): Promise<void> {
    if (isFirebaseConfigured && auth) {
      await firebaseSignOut(auth);
      return;
    }

    demoStore.setDemoUser(null);
  },

  /**
   * Switch into quick Demo Mode as Alex Rivera
   */
  async enterQuickDemo(): Promise<AppUser> {
    demoStore.setDemoUser(DEMO_USER);
    return DEMO_USER;
  },
};
