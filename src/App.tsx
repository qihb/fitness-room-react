import { App as AntdApp, ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import dayjs from "dayjs";
import { RouterProvider } from "react-router";
import "dayjs/locale/zh-cn";
import { FeedbackBridge } from "@/api/feedback";
import { router } from "@/router";

dayjs.locale("zh-cn");

export default function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: "#1677ff",
          borderRadius: 6,
        },
        components: {
          Layout: {
            headerBg: "#ffffff",
          },
        },
      }}
    >
      {/* antd App：为 message/notification 等提供上下文，保证主题生效。 */}
      <AntdApp className="h-full">
        {/* 注入 message 单例给 axios 拦截器等非组件模块使用。 */}
        <FeedbackBridge />
        <RouterProvider router={router} />
      </AntdApp>
    </ConfigProvider>
  );
}
