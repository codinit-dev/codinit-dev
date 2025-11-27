import { atom } from 'nanostores';
import type { LocalUser } from '~/lib/persistence/db';

interface UserState {
  isRegistered: boolean;
  user: LocalUser | null;
  isSyncing: boolean;
  syncError: string | null;
  registrationCompletedAt: string | null;
}

// Initialize with stored registration state or defaults
const storedRegistrationState = typeof window !== 'undefined' ? localStorage.getItem('codinit_registration') : null;
const initialState: UserState = storedRegistrationState
  ? JSON.parse(storedRegistrationState)
  : {
      isRegistered: false,
      user: null,
      isSyncing: false,
      syncError: null,
      registrationCompletedAt: null,
    };

export const userStore = atom<UserState>(initialState);

export const updateUserState = (updates: Partial<UserState>) => {
  const newState = { ...userStore.get(), ...updates };
  userStore.set(newState);

  // Persist to localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('codinit_registration', JSON.stringify(newState));
  }
};

export const setUserRegistered = (user: LocalUser) => {
  updateUserState({
    isRegistered: true,
    user,
    registrationCompletedAt: new Date().toISOString(),
    syncError: null,
  });
};

export const setSyncing = (isSyncing: boolean, error?: string) => {
  updateUserState({
    isSyncing,
    syncError: error || null,
  });
};
