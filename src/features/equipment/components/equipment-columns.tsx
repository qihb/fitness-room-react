import { Button, Space, Tag } from "antd";
import type { TableProps } from "antd";
import { EQUIPMENT_STATUS_COLOR } from "../constants";
import type { Equipment, EquipmentStatus } from "../types/equipment";
import { formatEquipmentStatus, isDeletable } from "../utils/format";

export interface EquipmentColumnsOptions {
  /** 行内「编辑」：打开编辑弹窗。 */
  onEdit: (equipment: Equipment) => void;
  /** 行内「删除」：走与批量删除一致的确认流程。 */
  onDelete: (equipment: Equipment) => void;
  /** 是否有编辑权限（无则不展示编辑入口）。 */
  canEdit: boolean;
  /** 是否有删除权限（无则不展示删除入口）。 */
  canDelete: boolean;
}

/** 设备列表列定义；操作入口按权限与设备状态（是否可删）决定。 */
export function getEquipmentColumns({
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: EquipmentColumnsOptions): TableProps<Equipment>["columns"] {
  return [
    { title: "设备编号", dataIndex: "equipmentNo", align: "center" },
    { title: "设备名称", dataIndex: "name", align: "center" },
    { title: "设备类型", dataIndex: "type", align: "center" },
    {
      title: "状态",
      dataIndex: "status",
      align: "center",
      render: (status: EquipmentStatus) => (
        <Tag color={EQUIPMENT_STATUS_COLOR[status]}>{formatEquipmentStatus(status)}</Tag>
      ),
    },
    { title: "存放位置", dataIndex: "location", align: "center" },
    { title: "购入日期", dataIndex: "purchasedAt", align: "center", width: 160 },
    {
      title: "操作",
      key: "action",
      align: "center",
      render: (_, record) => {
        const showDelete = canDelete && isDeletable(record.status);
        if (!canEdit && !showDelete) {
          return "-";
        }
        return (
          <Space size={4}>
            {canEdit && (
              <Button type="link" size="small" onClick={() => onEdit(record)}>
                编辑
              </Button>
            )}
            {showDelete && (
              <Button type="link" size="small" danger onClick={() => onDelete(record)}>
                删除
              </Button>
            )}
          </Space>
        );
      },
    },
  ];
}
