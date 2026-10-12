import { App as AntdApp, DatePicker, Form, Input, Modal, Select } from "antd";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import { useEffect, useState } from "react";
import { createEquipment } from "../api/create-equipment";
import { updateEquipment } from "../api/update-equipment";
import { EQUIPMENT_STATUS_OPTIONS, EQUIPMENT_TYPE_OPTIONS } from "../constants";
import type { Equipment, EquipmentStatus } from "../types/equipment";

export interface EquipmentFormModalProps {
  open: boolean;
  /** 编辑目标；null 表示新增。 */
  equipment: Equipment | null;
  onCancel: () => void;
  onSuccess: () => void;
}

interface EquipmentFormValues {
  name: string;
  type: string;
  status: EquipmentStatus;
  location: string;
  purchasedAt: Dayjs;
}

/** 新增 / 编辑设备共用弹窗：新增时编号由服务端生成，编辑时按编号提交。 */
export function EquipmentFormModal({
  open,
  equipment,
  onCancel,
  onSuccess,
}: EquipmentFormModalProps) {
  const { message } = AntdApp.useApp();
  const [form] = Form.useForm<EquipmentFormValues>();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    if (equipment !== null) {
      form.setFieldsValue({
        name: equipment.name,
        type: equipment.type,
        status: equipment.status,
        location: equipment.location,
        purchasedAt: dayjs(equipment.purchasedAt),
      });
    } else {
      form.resetFields();
    }
  }, [open, equipment, form]);

  const submit = async () => {
    const values = await form.validateFields();
    const payload = {
      name: values.name,
      type: values.type,
      status: values.status,
      location: values.location,
      purchasedAt: values.purchasedAt.format("YYYY-MM-DD"),
    };
    setSubmitting(true);
    try {
      if (equipment !== null) {
        await updateEquipment({ equipmentNo: equipment.equipmentNo, ...payload });
        message.success("设备更新成功");
      } else {
        await createEquipment(payload);
        message.success("设备新增成功");
      }
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
      title={equipment !== null ? "编辑设备" : "新增设备"}
      okText={equipment !== null ? "保存" : "新增"}
      confirmLoading={submitting}
      onOk={submit}
      onCancel={onCancel}
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="设备名称"
          rules={[
            { required: true, message: "请输入设备名称" },
            { min: 2, max: 30, message: "设备名称需为 2~30 个字符" },
          ]}
        >
          <Input placeholder="请输入设备名称" />
        </Form.Item>
        <Form.Item
          name="type"
          label="设备类型"
          rules={[{ required: true, message: "请选择设备类型" }]}
        >
          <Select
            placeholder="请选择设备类型"
            options={EQUIPMENT_TYPE_OPTIONS.map((item) => ({ value: item, label: item }))}
          />
        </Form.Item>
        <Form.Item
          name="status"
          label="状态"
          rules={[{ required: true, message: "请选择设备状态" }]}
        >
          <Select placeholder="请选择设备状态" options={EQUIPMENT_STATUS_OPTIONS} />
        </Form.Item>
        <Form.Item
          name="location"
          label="存放位置"
          rules={[{ required: true, message: "请输入存放位置" }]}
        >
          <Input placeholder="如：一层有氧区" />
        </Form.Item>
        <Form.Item
          name="purchasedAt"
          label="购入日期"
          rules={[{ required: true, message: "请选择购入日期" }]}
        >
          <DatePicker className="w-full" placeholder="请选择购入日期" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
