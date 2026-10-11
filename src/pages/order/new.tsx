import { App as AntdApp, Button, Card, Form, Input, InputNumber, Space } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router";
import { createOrder, type CreateOrderInput } from "@/features/order";

/** 新建订单页：提交成功后提示并返回订单列表。 */
export function OrderNewPage() {
  const navigate = useNavigate();
  const { message } = AntdApp.useApp();
  const [submitting, setSubmitting] = useState(false);

  const onFinish = async (values: CreateOrderInput) => {
    setSubmitting(true);
    try {
      await createOrder(values);
      message.success("订单创建成功");
      void navigate("/orders");
    } catch (cause) {
      message.error(cause instanceof Error ? cause.message : "创建失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card title="新建订单">
      <Form<CreateOrderInput> layout="vertical" className="max-w-md" onFinish={onFinish}>
        <Form.Item
          name="customer"
          label="客户"
          rules={[{ required: true, message: "请输入客户姓名" }]}
        >
          <Input placeholder="请输入客户姓名" />
        </Form.Item>
        <Form.Item
          name="product"
          label="商品"
          rules={[{ required: true, message: "请输入商品名称" }]}
        >
          <Input placeholder="如：年卡 / 私教课 10 节" />
        </Form.Item>
        <Form.Item name="amount" label="金额" rules={[{ required: true, message: "请输入金额" }]}>
          <InputNumber className="w-full" min={0} precision={2} placeholder="请输入金额" />
        </Form.Item>
        <Form.Item name="remark" label="备注">
          <Input.TextArea rows={3} placeholder="选填" />
        </Form.Item>
        <Form.Item className="!mb-0">
          <Space>
            <Button type="primary" htmlType="submit" loading={submitting}>
              提交
            </Button>
            <Button onClick={() => void navigate("/orders")}>取消</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
}
