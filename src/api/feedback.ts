import { App } from "antd";
import { useEffect } from "react";

/** antd message 实例类型（从 App.useApp 推导，避免深链 antd 内部路径）。 */
type MessageApi = ReturnType<typeof App.useApp>["message"];

let messageApi: MessageApi | null = null;

/**
 * 全局反馈单例：供非组件模块（如 axios 拦截器）调用 message。
 * 实例由 `<FeedbackBridge>` 在 antd App 上下文中注入，避免静态方法脱离上下文/主题。
 */
export const feedback = {
  success: (content: string) => messageApi?.success(content),
  error: (content: string) => messageApi?.error(content),
  warning: (content: string) => messageApi?.warning(content),
};

/** 把 antd App 上下文中的 message 注入单例；须渲染在 `<App>` 内、Router 之前。 */
export function FeedbackBridge() {
  const { message } = App.useApp();
  useEffect(() => {
    messageApi = message;
    return () => {
      messageApi = null;
    };
  }, [message]);
  return null;
}
