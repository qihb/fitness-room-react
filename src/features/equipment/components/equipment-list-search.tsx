import { ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Form, Input, Select, Space } from "antd";
import { useEffect } from "react";
import { EQUIPMENT_STATUS_OPTIONS, EQUIPMENT_TYPE_OPTIONS } from "../constants";

export interface EquipmentListSearchValues {
  keyword?: string;
  status?: string;
  type?: string;
}

export interface EquipmentListSearchProps {
  /** 当前查询条件（来自 URL），用于回显（翻页/浏览器后退也能同步）。 */
  keyword: string;
  status: string;
  type: string;
  /** 提交查询；调用方负责重置分页与清空选中。 */
  onSearch: (values: EquipmentListSearchValues) => void;
  /** 重置查询；调用方负责清空条件与选中。 */
  onReset: () => void;
}

/** 设备列表搜索表单：名称模糊 + 状态 / 类型筛选。 */
export function EquipmentListSearch({
  keyword,
  status,
  type,
  onSearch,
  onReset,
}: EquipmentListSearchProps) {
  const [form] = Form.useForm<EquipmentListSearchValues>();

  useEffect(() => {
    form.setFieldsValue({
      keyword,
      status: status || undefined,
      type: type || undefined,
    });
  }, [form, keyword, status, type]);

  return (
    <div className="mb-6 shrink-0">
      <Form form={form} layout="inline" onFinish={onSearch}>
        <Form.Item name="keyword" label="设备名称">
          <Input allowClear placeholder="模糊匹配" />
        </Form.Item>
        <Form.Item name="status" label="状态">
          <Select
            allowClear
            className="w-49!"
            placeholder="全部"
            options={EQUIPMENT_STATUS_OPTIONS}
          />
        </Form.Item>
        <Form.Item name="type" label="类型">
          <Select
            allowClear
            className="w-49!"
            placeholder="全部"
            options={EQUIPMENT_TYPE_OPTIONS.map((item) => ({ value: item, label: item }))}
          />
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
