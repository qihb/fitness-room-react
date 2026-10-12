import { ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Form, Input, Space } from "antd";
import { useEffect } from "react";

export interface OrderListSearchValues {
  orderNo?: string;
  memberName?: string;
}

export interface OrderListSearchProps {
  /** 当前查询条件（来自 URL），用于回显（翻页/浏览器后退也能同步）。 */
  orderNo: string;
  memberName: string;
  /** 提交查询；调用方负责重置分页与清空选中。 */
  onSearch: (values: OrderListSearchValues) => void;
  /** 重置查询；调用方负责清空条件与选中。 */
  onReset: () => void;
}

/** 订单列表搜索表单：订单号精确匹配 + 会员姓名模糊匹配。 */
export function OrderListSearch({ orderNo, memberName, onSearch, onReset }: OrderListSearchProps) {
  const [form] = Form.useForm<OrderListSearchValues>();

  useEffect(() => {
    form.setFieldsValue({ orderNo, memberName });
  }, [form, orderNo, memberName]);

  return (
    <div className="mb-6 shrink-0">
      <Form form={form} layout="inline" onFinish={onSearch}>
        <Form.Item name="orderNo" label="订单号">
          <Input allowClear placeholder="精确匹配" />
        </Form.Item>
        <Form.Item name="memberName" label="会员姓名">
          <Input allowClear placeholder="模糊匹配" />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
              查询
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                form.resetFields();
                onReset();
              }}
            >
              重置
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
}
