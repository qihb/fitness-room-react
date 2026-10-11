import { Alert, App as AntdApp, Form, InputNumber, Modal } from "antd";
import { useEffect, useState } from "react";
import { renewOrders } from "../api/renew-orders";
import { MAX_YEARS, MIN_YEARS } from "../constants";
import { calcRenewFee, formatAmount } from "../utils/format";

interface RenewOrderModalProps {
  open: boolean;
  orderNos: string[];
  onCancel: () => void;
  onSuccess: () => void;
}

/** 续卡弹窗：填写续卡年限并实时展示应付费用；批量与行内续卡共用。 */
export function RenewOrderModal({ open, orderNos, onCancel, onSuccess }: RenewOrderModalProps) {
  const { message } = AntdApp.useApp();
  const [form] = Form.useForm<{ years: number }>();
  const [submitting, setSubmitting] = useState(false);
  const years = Form.useWatch("years", form);
  const fee = calcRenewFee(Number(years) || 0);

  useEffect(() => {
    if (open) {
      form.resetFields();
    }
  }, [open, form]);

  const submit = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      await renewOrders({ orderNos, years: values.years });
      message.success(`已完成 ${orderNos.length} 笔订单续卡`);
      onSuccess();
    } catch {
      // 失败提示已由响应拦截器统一处理。
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      title="续卡"
      okText="确认续卡"
      confirmLoading={submitting}
      onOk={submit}
      onCancel={onCancel}
    >
      <Alert
        type="info"
        showIcon
        className="!mb-4"
        message={`共 ${orderNos.length} 笔订单：${orderNos.join("、")}`}
      />
      <Form form={form} layout="vertical">
        <Form.Item
          name="years"
          label="续卡年限"
          rules={[{ required: true, message: "请输入续卡年限" }]}
        >
          <InputNumber
            className="w-full"
            min={MIN_YEARS}
            max={MAX_YEARS}
            precision={0}
            placeholder={`${MIN_YEARS}~${MAX_YEARS} 的整数`}
          />
        </Form.Item>
      </Form>
      <div>
        应付费用：<span className="font-medium text-red-500">{formatAmount(fee)}</span> 元
      </div>
    </Modal>
  );
}
