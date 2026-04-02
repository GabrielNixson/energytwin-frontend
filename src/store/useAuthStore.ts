import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  _id: string;
  userName: string;
  emailId: string;
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  chatSessionId: string | null;
  login: (userData: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      chatSessionId: null,
      login: (userData) =>
        set({
          user: userData,
          isAuthenticated: true,
          chatSessionId: 'chat-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9),
        }),
      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          chatSessionId: null,
        }),
    }),
    {
      name: "auth-storage",
    }
  )
);
