import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Card, Form, Input, Typography } from "antd";
import { useLocation, useNavigate } from "react-router";
import { useAuthStore } from "@/store/auth";

interface LoginFormValues {
  username: string;
  password: string;
}

/** 登录页：骨架实现，直接写入本地登录态（真实项目替换为后端登录接口）。 */
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
    <div className="flex h-full items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-sm">
        <Typography.Title level={3} className="text-center">
          健身房管理后台
        </Typography.Title>
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
      </Card>
    </div>
  );
}
