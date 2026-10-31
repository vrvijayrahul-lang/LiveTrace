export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  isAnonymous?: boolean;
  isDemoUser?: boolean;
  createdAt: number;
}
