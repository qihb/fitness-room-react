import axios from "axios";
import { useAuthStore } from "@/store/auth";

/**
 * 全项目唯一的 axios 实例。
 * 禁止在组件或 feature 内 `new axios` / `axios.create`。
 */
export const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api",
  timeout: 10000,
});

// 请求拦截：统一注入鉴权头（token 由全局登录态持有）。
request.interceptors.request.use((config) => {
  const { token } = useAuthStore.getState();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截：把 axios 错误归一化为 Error，由调用方就地处理。
request.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const message = axios.isAxiosError(error)
      ? ((error.response?.data as { message?: string } | undefined)?.message ?? error.message)
      : "网络异常";
    return Promise.reject(new Error(message));
  },
);
