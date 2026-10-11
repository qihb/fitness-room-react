import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import dayjs from "dayjs";
import { RouterProvider } from "react-router";
import "dayjs/locale/zh-cn";
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
      <RouterProvider router={router} />
    </ConfigProvider>
  );
}
