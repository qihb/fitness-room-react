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
