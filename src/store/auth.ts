import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthUser {
  name: string;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  login: (username: string) => void;
  logout: () => void;
}

/**
 * 跨 feature 的全局登录态（骨架）。
 * 真实项目应改为调用后端登录接口，并优先使用 HttpOnly Cookie 承载凭证。
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      login: (username) => set({ token: "mock-token", user: { name: username } }),
      logout: () => set({ token: null, user: null }),
    }),
    { name: "fitness-room-auth" },
  ),
);
