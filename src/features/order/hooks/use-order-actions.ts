import { App as AntdApp } from "antd";
import { useState } from "react";
import { cancelOrders } from "../api/cancel-orders";
import type { Order } from "../types/order";
import { formatOrderLabel, isCancellable, isRenewable } from "../utils/format";

export interface UseOrderActionsOptions {
  /** 跨页选中行。 */
  selectedRows: Order[];
  /** 清空选中（批量操作成功后调用）。 */
  onClearSelection: () => void;
  /** 重新拉取列表（操作成功后调用）。 */
  reload: () => void;
}

export interface UseOrderActionsResult {
  /** 续卡弹窗目标订单；null 表示弹窗关闭。 */
  renewTargets: Order[] | null;
  /** 行内续卡：打开单条续卡弹窗。 */
  openRenew: (order: Order) => void;
  /** 关闭续卡弹窗。 */
  closeRenew: () => void;
  /** 续卡提交成功：关弹窗 + 清选中 + 刷新列表。 */
  onRenewSuccess: () => void;
  /** 批量续卡：先校验选中行是否可续卡，再打开续卡弹窗。 */
  onBatchRenew: () => void;
  /** 一键撤单：先校验选中行是否可撤单，确认后提交。 */
  onBatchCancel: () => void;
  /** 行内撤单：与批量撤单同一校验/确认流程，仅针对单条（成功后不清选中）。 */
  onRowCancel: (order: Order) => void;
}

/** 订单列表的续卡与撤单动作：校验、二次确认、成功后刷新列表。 */
export function useOrderActions({
  selectedRows,
  onClearSelection,
  reload,
}: UseOrderActionsOptions): UseOrderActionsResult {
  const { message, modal } = AntdApp.useApp();
  const [renewTargets, setRenewTargets] = useState<Order[] | null>(null);

  const openRenew = (order: Order) => {
    setRenewTargets([order]);
  };

  const closeRenew = () => {
    setRenewTargets(null);
  };

  const onRenewSuccess = () => {
    setRenewTargets(null);
    onClearSelection();
    reload();
  };

  const onBatchRenew = () => {
    if (selectedRows.length === 0) {
      message.warning("请先选择订单");
      return;
    }
    const invalid = selectedRows.filter((order) => !isRenewable(order.status));
    if (invalid.length > 0) {
      modal.warning({
        title: "部分订单不满足续卡条件",
        content: `仅「已到期」订单可续卡，以下订单不满足：${invalid.map(formatOrderLabel).join("、")}`,
      });
      return;
    }
    setRenewTargets(selectedRows);
  };

  const onBatchCancel = () => {
    if (selectedRows.length === 0) {
      message.warning("请先选择订单");
      return;
    }
    const invalid = selectedRows.filter((order) => !isCancellable(order.status));
    if (invalid.length > 0) {
      modal.warning({
        title: "部分订单不满足撤单条件",
        content: `仅「待制卡」「待寄卡」订单可撤单，以下订单不满足：${invalid.map(formatOrderLabel).join("、")}`,
      });
      return;
    }
    const orderNos = selectedRows.map((order) => order.orderNo);
    modal.confirm({
      title: "确认撤单",
      content: `将撤销以下订单：${selectedRows.map(formatOrderLabel).join("、")}`,
      okText: "确认撤单",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await cancelOrders({ orderNos });
          message.success("撤单成功");
          onClearSelection();
          reload();
        } catch {
          // 失败提示已由响应拦截器统一处理。
        }
      },
    });
  };

  const onRowCancel = (order: Order) => {
    modal.confirm({
      title: "确认撤单",
      content: `将撤销订单：${formatOrderLabel(order)}`,
      okText: "确认撤单",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await cancelOrders({ orderNos: [order.orderNo] });
          message.success("撤单成功");
          reload();
        } catch {
          // 失败提示已由响应拦截器统一处理。
        }
      },
    });
  };

  return {
    renewTargets,
    openRenew,
    closeRenew,
    onRenewSuccess,
    onBatchRenew,
    onBatchCancel,
    onRowCancel,
  };
}
