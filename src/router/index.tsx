import { createBrowserRouter } from "react-router";
import { BasicLayout } from "@/layouts/basic-layout";
import { RouteErrorBoundary } from "./error-boundary";
import { RequireAuth } from "./guard";

/** 全应用路由表：数据路由 + 路由级懒加载 + 多层错误兜底。 */
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
          {
            index: true,
            lazy: async () => ({ Component: (await import("@/pages/dashboard")).DashboardPage }),
          },
          {
            path: "members",
            lazy: async () => ({ Component: (await import("@/pages/member")).MemberPage }),
          },
          {
            path: "orders",
            lazy: async () => ({ Component: (await import("@/pages/order")).OrderPage }),
          },
          {
            path: "settings",
            lazy: async () => ({ Component: (await import("@/pages/settings")).SettingsPage }),
          },
          {
            path: "demo",
            lazy: async () => ({ Component: (await import("@/pages/demo")).DemoPage }),
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
