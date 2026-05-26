import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authService } from "../services/auth";
import { Role } from "../types/admin.types";

interface User {
  _id: string;
  userName: string;
  email: string;
  role?: any;
  roleId?: string;
}

interface AuthStore {
  user: User | null;
  userRole: Role | null;
  isAuthenticated: boolean;
  chatSessionId: string | null;
  isCheckingAuth: boolean;
  accessToken: string | null;
  login: (userData: User, token?: string) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
  setAccessToken: (token: string | null) => void;
  setUserRole: (role: Role | null) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      userRole: null,
      isAuthenticated: false,
      chatSessionId: null,
      isCheckingAuth: false,
      accessToken: null,
      login: (userData, token) =>
        set({
          user: userData,
          isAuthenticated: true,
          accessToken: token || null,
          chatSessionId: 'chat-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9),
        }),
      logout: () =>
        set({
          user: null,
          userRole: null,
          isAuthenticated: false,
          accessToken: null,
          chatSessionId: null,
        }),
      setAccessToken: (token) => set({ accessToken: token }),
      setUserRole: (role) => set({ userRole: role }),
      checkAuth: async () => {
        set({ isCheckingAuth: true });
        try {
          const res = await authService.me();
          if (res && res.data) {
            const token = res.token || res.accessToken || res.data.token || res.data.accessToken || res.data.user?.token || res.data.user?.accessToken;
            set({
              user: res.data.user || res.data,
              isAuthenticated: true,
              isCheckingAuth: false,
              ...(token ? { accessToken: token } : {}),
            });
          } else {
            set({ user: null, userRole: null, isAuthenticated: false, isCheckingAuth: false, accessToken: null });
          }
        } catch (error) {
          set({ user: null, userRole: null, isAuthenticated: false, isCheckingAuth: false, accessToken: null });
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ 
        user: state.user, 
        userRole: state.userRole,
        isAuthenticated: state.isAuthenticated, 
        chatSessionId: state.chatSessionId,
        accessToken: state.accessToken
      }),
    }
  )
);

