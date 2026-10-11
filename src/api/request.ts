import axios from "axios";

/** 后端统一响应结构。 */
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

/**
 * 全项目唯一的 axios 实例。
 * 禁止在组件或 feature 内 `new axios` / `axios.create`。
 */
export const request = axios.create({
  baseURL: "/api",
  timeout: 10000,
});

// 错误分流：把 axios 错误归一化为 Error，由调用方就地处理。
request.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const message = axios.isAxiosError(error)
      ? ((error.response?.data as { message?: string } | undefined)?.message ?? error.message)
      : "网络异常";
    return Promise.reject(new Error(message));
  },
);
