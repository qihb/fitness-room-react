import { createBrowserRouter, Navigate } from "react-router";
import { BasicLayout } from "@/layouts/basic-layout";
import { RouteErrorBoundary } from "./error-boundary";
import { RequireAuth } from "./guard";

/** 全应用路由表：数据路由 + 路由级懒加载 + 多层错误兜底。
 *  - `/login` 公开；
 *  - `/` 受守卫保护，内层为后台布局；
 *  - `*` 未匹配 → 404。
 */
export const router = createBrowserRouter([
  {
    path: "/login",
    ErrorBoundary: RouteErrorBoundary,
    lazy: async () => ({ Component: (await import("@/pages/login")).LoginPage }),
  },
  {
    path: "/",
    Component: RequireAuth,
    ErrorBoundary: RouteErrorBoundary,
    children: [
      {
        Component: BasicLayout,
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
        ],
      },
    ],
  },
  {
    path: "*",
    lazy: async () => ({ Component: (await import("@/pages/not-found")).NotFoundPage }),
  },
]);
