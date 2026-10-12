import { App as AntdApp } from "antd";
import { useState } from "react";
import { deleteEquipment } from "../api/delete-equipment";
import type { Equipment } from "../types/equipment";
import { isDeletable } from "../utils/format";

export interface UseEquipmentActionsOptions {
  /** 跨页选中行。 */
  selectedRows: Equipment[];
  /** 清空选中（增删成功后调用）。 */
  onClearSelection: () => void;
  /** 重新拉取列表（增删成功后调用）。 */
  reload: () => void;
}

export interface UseEquipmentActionsResult {
  /** 表单弹窗是否打开。 */
  formOpen: boolean;
  /** 编辑目标；null 表示新增。 */
  editing: Equipment | null;
  /** 打开「新增」弹窗。 */
  openCreate: () => void;
  /** 打开「编辑」弹窗（行内）。 */
  openEdit: (equipment: Equipment) => void;
  /** 关闭表单弹窗。 */
  closeForm: () => void;
  /** 表单提交成功：关弹窗 + 清选中 + 刷新列表。 */
  onFormSuccess: () => void;
  /** 行内删除：二次确认后按单条删除（成功后不清选中）。 */
  onRowDelete: (equipment: Equipment) => void;
  /** 批量删除：先校验可删资格，确认后按选中集合删除。 */
  onBatchDelete: () => void;
}

/** 设备列表的增 / 改 / 删动作：校验、二次确认、成功后刷新列表。 */
export function useEquipmentActions({
  selectedRows,
  onClearSelection,
  reload,
}: UseEquipmentActionsOptions): UseEquipmentActionsResult {
  const { message, modal } = AntdApp.useApp();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Equipment | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (equipment: Equipment) => {
    setEditing(equipment);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
  };

  const onFormSuccess = () => {
    setFormOpen(false);
    onClearSelection();
    reload();
  };

  const confirmDelete = (equipmentNos: string[], onDone: () => void) => {
    modal.confirm({
      title: "确认删除",
      content: `将删除以下设备：${equipmentNos.join("、")}`,
      okText: "确认删除",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteEquipment({ equipmentNos });
          message.success(`已删除 ${equipmentNos.length} 台设备`);
          onDone();
        } catch {
          // 失败提示已由响应拦截器统一处理。
        }
      },
    });
  };

  const onRowDelete = (equipment: Equipment) => {
    confirmDelete([equipment.equipmentNo], reload);
  };

  const onBatchDelete = () => {
    if (selectedRows.length === 0) {
      message.warning("请先选择设备");
      return;
    }
    const invalid = selectedRows.filter((item) => !isDeletable(item.status));
    if (invalid.length > 0) {
      modal.warning({
        title: "部分设备不可删除",
        content: `仅「闲置」「已报废」设备可删除，以下设备不满足：${invalid
          .map((item) => item.equipmentNo)
          .join("、")}`,
      });
      return;
    }
    confirmDelete(
      selectedRows.map((item) => item.equipmentNo),
      () => {
        onClearSelection();
        reload();
      },
    );
  };

  return {
    formOpen,
    editing,
    openCreate,
    openEdit,
    closeForm,
    onFormSuccess,
    onRowDelete,
    onBatchDelete,
  };
}
