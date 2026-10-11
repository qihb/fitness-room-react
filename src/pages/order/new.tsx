import { App as AntdApp, Button, Card, Form, Input, InputNumber, Space } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router";
import {
  createOrder,
  formatAmount,
  MAX_YEARS,
  MIN_YEARS,
  PRICE_PER_YEAR,
  type CreateOrderInput,
} from "@/features/order";

const PHONE_PATTERN = /^1[3-9]\d{9}$/;

/** 新建订单页：办卡费用随购卡年限自动计算（只读）；提交成功后回订单列表。 */
export function OrderNewPage() {
  const navigate = useNavigate();
  const { message } = AntdApp.useApp();
  const [form] = Form.useForm<CreateOrderInput>();
  const [submitting, setSubmitting] = useState(false);

  const years = Form.useWatch("years", form);
  const fee = (Number(years) || 0) * PRICE_PER_YEAR;

  const onFinish = async (values: CreateOrderInput) => {
    setSubmitting(true);
    try {
      await createOrder(values);
      message.success("订单创建成功");
      void navigate("/orders");
    } catch {
      // 失败提示已由响应拦截器统一处理。
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card title="新建订单">
      <Form<CreateOrderInput>
        form={form}
        layout="vertical"
        className="max-w-md"
        onFinish={onFinish}
      >
        <Form.Item
          name="memberName"
          label="会员姓名"
          rules={[
            { required: true, message: "请输入会员姓名" },
            { min: 2, max: 30, message: "会员姓名需为 2~30 个字符" },
          ]}
        >
          <Input placeholder="请输入会员姓名" />
        </Form.Item>
        <Form.Item
          name="phone"
          label="联系手机号"
          rules={[
            { required: true, message: "请输入联系手机号" },
            { pattern: PHONE_PATTERN, message: "请输入正确的手机号" },
          ]}
        >
          <Input maxLength={11} placeholder="请输入 11 位手机号" />
        </Form.Item>
        <Form.Item
          name="years"
          label="购卡年限"
          rules={[{ required: true, message: "请输入购卡年限" }]}
        >
          <InputNumber
            className="w-full"
            min={MIN_YEARS}
            max={MAX_YEARS}
            precision={0}
            placeholder={`${MIN_YEARS}~${MAX_YEARS} 的整数`}
          />
        </Form.Item>
        <Form.Item label="办卡费用">
          <Input readOnly value={`${formatAmount(fee)} 元`} />
        </Form.Item>
        <Form.Item name="remark" label="备注">
          <Input.TextArea rows={3} maxLength={200} showCount placeholder="选填，最多 200 字" />
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
