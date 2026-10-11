import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MOCK_USER_PERMISSIONS } from "@/lib/permissions";

interface AuthUser {
  name: string;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  /** 当前用户的权限点集合（PBAC）；mock 登录授予 `MOCK_USER_PERMISSIONS`。 */
  permissions: string[];
  login: (username: string) => void;
  logout: () => void;
}

/**
 * 跨 feature 的全局登录态（mock）。
 * 经 `persist` 中间件把 `token` / `user` / `permissions` 持久化到 localStorage（key: fitness-room-auth）。
 * 登录为模拟实现：任意账号密码均写同一个 mock token，并授予固定的默认权限点；
 * 真实项目应改为调用后端登录接口，凭证以 Bearer Token 承载
 * （请求头 `Authorization: Bearer <token>`），不使用 Cookie，权限点由接口返回。
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      permissions: [],
      login: (username) =>
        set({ token: "mock-token", user: { name: username }, permissions: MOCK_USER_PERMISSIONS }),
      logout: () => set({ token: null, user: null, permissions: [] }),
    }),
    {
      name: "fitness-room-auth",
      version: 1,
      // 旧版本持久化数据没有 permissions 字段，补齐默认权限，避免导出入口被误隐藏。
      migrate: (persistedState, version) => {
        const state = persistedState as Partial<AuthState>;
        if (version < 1) {
          return { ...state, permissions: state.permissions ?? MOCK_USER_PERMISSIONS } as AuthState;
        }
        return state as AuthState;
      },
    },
  ),
);
