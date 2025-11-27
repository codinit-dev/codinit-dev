import { atom } from 'nanostores';

interface ClerkUser {
  id: string;
  emailAddress?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
}

interface UserState {
  clerkUser: ClerkUser | null;
  isLoaded: boolean;
}

const initialState: UserState = {
  clerkUser: null,
  isLoaded: false,
};

export const userStore = atom<UserState>(initialState);

export const setClerkUser = (user: ClerkUser | null, isLoaded: boolean = true) => {
  userStore.set({
    clerkUser: user,
    isLoaded,
  });
};

export const clearUser = () => {
  userStore.set({
    clerkUser: null,
    isLoaded: true,
  });
};
