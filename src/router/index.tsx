import { createBrowserRouter, Navigate } from "react-router";
import { BasicLayout } from "@/layouts/basic-layout";
import { registerNavigator } from "@/lib/navigation";
import { RouteErrorBoundary } from "./error-boundary";
import { GuestOnly, RequireAuth } from "./guard";

/** 全应用路由表：数据路由 + 路由级懒加载 + 多层错误兜底。
 *  - `/login` 公开，经 GuestOnly 守卫：已登录访问即跳回后台；
 *  - `/` 受 RequireAuth 守卫保护，内层为后台布局；
 *  - 异常页（403/500/404）与子页错误边界均在布局内部，渲染于内容区（保留菜单/顶栏）；
 *  - 布局及以上层级的崩溃由外层 ErrorBoundary 全屏兜底。
 */
export const router = createBrowserRouter([
  {
    path: "/login",
    Component: GuestOnly,
    ErrorBoundary: RouteErrorBoundary,
    children: [
      {
        index: true,
        lazy: async () => ({ Component: (await import("@/pages/login")).LoginPage }),
      },
    ],
  },
  {
    path: "/",
    Component: RequireAuth,
    ErrorBoundary: RouteErrorBoundary,
    children: [
      {
        Component: BasicLayout,
        children: [
          {
            // 内容区错误兜底：错误在此层渲染，落在 BasicLayout 的 Outlet 内（保留菜单/顶栏）
            ErrorBoundary: RouteErrorBoundary,
            children: [
              { index: true, element: <Navigate to="/orders" replace /> },
              {
                path: "orders",
                lazy: async () => ({ Component: (await import("@/pages/order")).OrderListPage }),
              },
              {
                path: "orders/new",
                lazy: async () => ({ Component: (await import("@/pages/order/new")).OrderNewPage }),
              },
              {
                path: "equipment",
                lazy: async () => ({
                  Component: (await import("@/pages/equipment")).EquipmentListPage,
                }),
              },
              {
                path: "403",
                lazy: async () => ({
                  Component: (await import("@/pages/forbidden")).ForbiddenPage,
                }),
              },
              {
                path: "500",
                lazy: async () => ({
                  Component: (await import("@/pages/server-error")).ServerErrorPage,
                }),
              },
              {
                path: "*",
                lazy: async () => ({ Component: (await import("@/pages/not-found")).NotFoundPage }),
              },
            ],
          },
        ],
      },
    ],
  },
]);

// 注册导航桥：供非路由层（如 api/request.ts）跳转，避免其直接依赖 router 形成循环。
registerNavigator((to, options) => {
  void router.navigate(to, options);
});
