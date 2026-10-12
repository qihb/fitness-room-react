import {
  DownOutlined,
  FireOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PlusOutlined,
  ToolOutlined,
  UnorderedListOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Avatar, Breadcrumb, Button, ConfigProvider, Dropdown, Layout, Menu, Space } from "antd";
import type { BreadcrumbProps } from "antd";
import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { useAuthStore } from "@/store/auth";

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: "/orders", icon: <UnorderedListOutlined />, label: <Link to="/orders">订单列表</Link> },
  { key: "/orders/new", icon: <PlusOutlined />, label: <Link to="/orders/new">新建订单</Link> },
  { key: "/equipment", icon: <ToolOutlined />, label: <Link to="/equipment">设备管理</Link> },
];

/** 后台基础布局：左侧菜单 + 顶栏（用户名/退出）+ 面包屑 + 内容区。 */
export function BasicLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const isNewOrder = pathname.startsWith("/orders/new");
  const isOrderList = pathname === "/orders";
  const isEquipment = pathname === "/equipment";

  // 菜单高亮与面包屑：按当前路由分支，未命中业务路由时均留空。
  let selectedKey = "";
  let breadcrumbItems: BreadcrumbProps["items"] = [];
  if (isNewOrder) {
    selectedKey = "/orders/new";
    breadcrumbItems = [{ title: <Link to="/orders">订单列表</Link> }, { title: "新建订单" }];
  } else if (isOrderList) {
    selectedKey = "/orders";
    breadcrumbItems = [{ title: "订单列表" }];
  } else if (isEquipment) {
    selectedKey = "/equipment";
    breadcrumbItems = [{ title: "设备管理" }];
  }

  return (
    <Layout className="h-full">
      <Sider
        theme="dark"
        breakpoint="lg"
        collapsed={collapsed}
        onCollapse={setCollapsed}
        collapsedWidth="80"
      >
        <div className="flex h-16 items-center justify-center text-lg font-semibold text-white">
          {collapsed ? <FireOutlined className="text-base" /> : "健身房后台"}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={selectedKey ? [selectedKey] : []}
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header className="flex items-center justify-between">
          <Button
            type="text"
            aria-label={collapsed ? "展开菜单" : "收起菜单"}
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
          />
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
              <DownOutlined className="text-xs" />
            </Space>
          </Dropdown>
        </Header>
        {/* 面包屑条：紧贴顶栏、高 32px，背景与内容区一致（透出布局灰底）；
            Breadcrumb 无字号 token，用局部 ConfigProvider 把子树字号降为 12。 */}
        {breadcrumbItems.length > 0 && (
          <div className="flex h-8 shrink-0 items-center px-6">
            <ConfigProvider theme={{ token: { fontSize: 12 } }}>
              <Breadcrumb items={breadcrumbItems} />
            </ConfigProvider>
          </div>
        )}
        <Content className="flex flex-col overflow-hidden px-6 pb-6 pt-3">
          <div className="min-h-0 flex-1 overflow-auto">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
