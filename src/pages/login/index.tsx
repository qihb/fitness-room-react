import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Form, Input, Typography } from "antd";
import { useLocation, useNavigate } from "react-router";
import { useAuthStore } from "@/store/auth";

interface LoginFormValues {
  username: string;
  password: string;
}

/** 登录页：深色光影背景 + 毛玻璃卡片，直接写入本地登录态（真实项目替换为后端登录接口）。 */
export function LoginPage() {
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/";

  const onFinish = (values: LoginFormValues) => {
    login(values.username);
    void navigate(from, { replace: true });
  };

  return (
    <div className="relative flex h-full items-center justify-center overflow-hidden bg-slate-950 p-4">
      {/* 背景：深色底 + 两处柔光斑，靠纯 CSS 营造空间感，不依赖外部图片。 */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 size-96 rounded-full bg-blue-500/30 blur-3xl" />
        <div className="absolute -right-32 -bottom-24 size-[28rem] rounded-full bg-cyan-400/20 blur-3xl" />
      </div>

      {/* 登录卡片：半透明毛玻璃，叠加在背景之上。 */}
      <div className="relative w-full max-w-sm rounded-2xl border border-white/15 bg-white/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
        <Typography.Title level={3} className="!mb-1 text-center">
          健身房管理后台
        </Typography.Title>
        <Typography.Paragraph className="!mb-6 text-center !text-slate-500">
          欢迎回来，请登录你的账号
        </Typography.Paragraph>
        <Form<LoginFormValues>
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ username: "admin", password: "123456" }}
        >
          <Form.Item
            name="username"
            label="账号"
            rules={[{ required: true, message: "请输入账号" }]}
          >
            <Input prefix={<UserOutlined />} placeholder="admin" />
          </Form.Item>
          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: "请输入密码" }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="123456" />
          </Form.Item>
          <Form.Item className="!mb-0">
            <Button type="primary" htmlType="submit" block>
              登录
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}
