import { atom } from 'nanostores';

interface User {
  id: string;
  emailAddress?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
}

interface UserState {
  user: User | null;
  isLoaded: boolean;
}

const initialState: UserState = {
  user: null,
  isLoaded: false,
};

export const userStore = atom<UserState>(initialState);

export const setUser = (user: User | null, isLoaded: boolean = true) => {
  userStore.set({
    user,
    isLoaded,
  });
};

export const clearUser = () => {
  userStore.set({
    user: null,
    isLoaded: true,
  });
};
