import { Button, Card, Space, Typography } from "antd";
import { Link, useNavigate } from "react-router";
import { CounterCard, MemberPreview } from "@/features/demo";

const { Paragraph } = Typography;

/** 示例页：汇总 React 组件 / Tailwind 布局 / antd 组件 / zustand / axios / react-router 跳转。 */
export function DemoPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-4">
      <Card title="react-router 跳转示例">
        <Space direction="vertical">
          <Paragraph className="!mb-0">
            下面两个按钮分别用 <code>Link</code> 与 <code>useNavigate</code> 跳转到首页。
          </Paragraph>
          <Space>
            <Link to="/">
              <Button type="primary">Link 跳转首页</Button>
            </Link>
            <Button onClick={() => void navigate("/")}>useNavigate 跳转首页</Button>
          </Space>
        </Space>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CounterCard />
        <MemberPreview />
      </div>
    </div>
  );
}
