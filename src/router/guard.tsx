import { Navigate, Outlet, useLocation } from "react-router";
import { useAuthStore } from "@/store/auth";

/** 路由守卫骨架：未登录跳转登录页，并记录来源以便登录后回跳。 */
export function RequireAuth() {
  const token = useAuthStore((state) => state.token);
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

/** 访客守卫：已登录用户不应再停留登录页，访问 `/login` 一律重定向回后台。 */
export function GuestOnly() {
  const token = useAuthStore((state) => state.token);

  if (token) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
