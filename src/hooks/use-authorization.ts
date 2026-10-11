import { useAuthStore } from "@/store/auth";

/** PBAC 统一入口：判断当前用户是否具备某权限点。 */
export function useAuthorization(permission: string): boolean {
  return useAuthStore((state) => state.permissions.includes(permission));
}
