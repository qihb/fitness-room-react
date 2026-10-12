/**
 * 部署子路径（Vite `base`，如 GitHub Pages 项目页 `/repo/`）。
 * `import.meta.env.BASE_URL` 带尾斜杠，此处统一去掉；本地与其他部署为空串。
 */
export const BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/, "");

/** 去掉 URL 上的部署子路径：`useLocation().pathname` 含 basename，直接用于比较 / 回跳会重复拼接前缀。 */
export function stripBasePath(pathname: string): string {
  if (!BASE_PATH || !pathname.startsWith(BASE_PATH)) {
    return pathname;
  }
  return pathname.slice(BASE_PATH.length) || "/";
}

/**
 * 导航桥（依赖倒置）：非路由层（如 `api/request.ts`）不直接依赖 router，
 * 改由 router 在创建后注入 navigate；调用方只依赖本模块这个叶子依赖，
 * 从而避免 `request → router → pages → features → api → request` 的静态循环。
 * router 尚未就绪时调用为 no-op。
 */
type Navigator = (to: string, options?: { replace?: boolean }) => void;

let navigator: Navigator | null = null;

export function registerNavigator(next: Navigator): void {
  navigator = next;
}

export function navigateTo(to: string, options?: { replace?: boolean }): void {
  navigator?.(to, options);
}
