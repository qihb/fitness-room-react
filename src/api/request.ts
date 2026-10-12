import axios from "axios";
import { navigateTo } from "@/lib/navigation";
import { useAuthStore } from "@/store/auth";
import { feedback } from "./feedback";
import { mockAdapter } from "./mock";

/**
 * 全项目唯一的 axios 实例。
 * 禁止在组件或 feature 内 `new axios` / `axios.create`。
 */
export const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api",
  timeout: 10000,
});

// 启用 mock：默认开启，显式设 `VITE_USE_MOCK=false` 可关闭并走真实接口。
if (import.meta.env.VITE_USE_MOCK !== "false") {
  request.defaults.adapter = mockAdapter;
}

// 请求拦截：统一注入鉴权头（token 由全局登录态持有）。
request.interceptors.request.use((config) => {
  const { token } = useAuthStore.getState();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** 401 处理防抖：并发请求同时失败时，只清一次登录态 / 跳一次登录页 / 提示一次。 */
let handlingUnauthorized = false;

// 响应拦截：统一错误提示；401 清登录态并跳回登录页，其余错误归一化为 Error 交由调用方处理。
request.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    const message = axios.isAxiosError(error)
      ? ((error.response?.data as { message?: string } | undefined)?.message ?? error.message)
      : "网络异常";

    if (status === 401) {
      if (!handlingUnauthorized) {
        handlingUnauthorized = true;
        useAuthStore.getState().logout();
        feedback.error("登录已过期，请重新登录");
        navigateTo("/login", { replace: true });
        // 跳转后复位，允许新会话再次触发。
        window.setTimeout(() => {
          handlingUnauthorized = false;
        }, 1000);
      }
    } else {
      // 非 401 错误统一在此提示一次，调用方无需重复弹提示。
      feedback.error(message);
    }

    return Promise.reject(new Error(message));
  },
);
