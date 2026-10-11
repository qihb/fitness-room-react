import {
  LogoutOutlined,
  PlusOutlined,
  UnorderedListOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Avatar, Breadcrumb, Dropdown, Layout, Menu, Space, Typography } from "antd";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { useAuthStore } from "@/store/auth";

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: "/orders", icon: <UnorderedListOutlined />, label: <Link to="/orders">订单列表</Link> },
  { key: "/orders/new", icon: <PlusOutlined />, label: <Link to="/orders/new">新建订单</Link> },
];

/** 后台基础布局：左侧菜单 + 顶栏（用户名/退出）+ 面包屑 + 内容区。 */
export function BasicLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const isNewOrder = pathname.startsWith("/orders/new");
  const selectedKey = isNewOrder ? "/orders/new" : "/orders";
  const breadcrumbItems = isNewOrder
    ? [{ title: <Link to="/orders">订单列表</Link> }, { title: "新建订单" }]
    : [{ title: "订单列表" }];

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
            trigger={["click"]}
            menu={{
              items: [
                {
                  key: "logout",
                  icon: <LogoutOutlined />,
                  label: "退出登录",
                  onClick: () => {
                    logout();
                    void navigate("/login", { replace: true });
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
          <Breadcrumb className="mb-4" items={breadcrumbItems} />
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
