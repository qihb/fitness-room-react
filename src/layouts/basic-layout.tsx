import {
  AppstoreOutlined,
  DashboardOutlined,
  LogoutOutlined,
  SettingOutlined,
  ShoppingOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Avatar, Dropdown, Layout, Menu, Space, Typography } from "antd";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { useAuthStore } from "@/store/auth";

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: "/", icon: <DashboardOutlined />, label: <Link to="/">仪表盘</Link> },
  { key: "/members", icon: <TeamOutlined />, label: <Link to="/members">会员</Link> },
  { key: "/orders", icon: <ShoppingOutlined />, label: <Link to="/orders">订单</Link> },
  { key: "/settings", icon: <SettingOutlined />, label: <Link to="/settings">设置</Link> },
  { key: "/demo", icon: <AppstoreOutlined />, label: <Link to="/demo">Demo</Link> },
];

/** 后台基础布局：侧边栏 + 顶栏 + 内容区。 */
export function BasicLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const firstSegment = pathname.split("/")[1];
  const selectedKey = firstSegment ? `/${firstSegment}` : "/";

  return (
    <Layout className="h-full">
      <Sider theme="dark" breakpoint="lg" collapsedWidth="0">
        <div className="flex h-16 items-center justify-center text-lg font-semibold text-white">
          健身房后台
        </div>
        <Menu theme="dark" mode="inline" selectedKeys={[selectedKey]} items={menuItems} />
      </Sider>
      <Layout>
        <Header className="flex items-center justify-between px-6">
          <Typography.Title level={4} className="!mb-0">
            管理后台
          </Typography.Title>
          <Dropdown
            menu={{
              items: [
                {
                  key: "logout",
                  icon: <LogoutOutlined />,
                  label: "退出登录",
                  onClick: () => {
                    logout();
                    void navigate("/login");
                  },
                },
              ],
            }}
          >
            <Space className="cursor-pointer">
              <Avatar size="small" icon={<UserOutlined />} />
              {user?.name}
            </Space>
          </Dropdown>
        </Header>
        <Content className="overflow-auto p-6">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
