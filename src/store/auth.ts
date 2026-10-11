import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MOCK_USER_PERMISSIONS } from "@/lib/permissions";

interface AuthUser {
  name: string;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  /** 当前用户的权限点集合（PBAC）；不持久化，由登录 / 刷新时按 token 重新获取。 */
  permissions: string[];
  login: (username: string) => void;
  logout: () => void;
  /** 按当前 token 拉取最新权限点；有 token 才拉取，无 token 视为未登录并清空。 */
  refreshPermissions: () => void;
}

/**
 * 跨 feature 的全局登录态（mock）。
 * 经 `persist` 中间件把 `token` / `user` 持久化到 localStorage（key: fitness-room-auth）；
 * **`permissions` 不持久化**，由 `refreshPermissions()` 在登录与每次刷新时按 token 重新获取，
 * 避免读到 localStorage 里的旧权限（否则改权限点后必须重新登录才生效）。
 * 登录为模拟实现：任意账号密码均写同一个 mock token，并授予固定的默认权限点；
 * 真实项目应改为调用后端登录接口，凭证以 Bearer Token 承载
 * （请求头 `Authorization: Bearer <token>`），不使用 Cookie，权限点由接口返回。
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      permissions: [],
      login: (username) =>
        set({ token: "mock-token", user: { name: username }, permissions: MOCK_USER_PERMISSIONS }),
      logout: () => set({ token: null, user: null, permissions: [] }),
      refreshPermissions: () => {
        if (!get().token) {
          set({ permissions: [] });
          return;
        }
        // mock：直接取默认权限点；真实项目替换为「按 token 请求用户权限接口」。
        set({ permissions: MOCK_USER_PERMISSIONS });
      },
    }),
    {
      name: "fitness-room-auth",
      version: 2,
      // 只持久化凭证与用户信息；permissions 每次刷新重新获取。
      partialize: (state) => ({ token: state.token, user: state.user }),
      // 旧版本持久化数据带有 permissions，一律丢弃，交由 refreshPermissions 重新获取。
      migrate: (persistedState) => {
        const state = persistedState as { token?: string | null; user?: AuthUser | null };
        return { token: state.token ?? null, user: state.user ?? null };
      },
    },
  ),
);
