import { App as AntdApp } from "antd";
import { useState } from "react";
import { useAuthStore } from "@/store/auth";
import { exportOrders, type ExportOrdersParams } from "../api/export-orders";
import { TAB_LABELS } from "../constants";
import type { Order, OrderTab } from "../types/order";
import { buildExportFilename, buildOrdersCsv, downloadCsv } from "../utils/export";

export interface UseOrderExportOptions {
  /** 当前 Tab，决定确认文案与文件名。 */
  tab: OrderTab;
  /** 当前订单号筛选条件。 */
  orderNo: string;
  /** 当前会员姓名筛选条件。 */
  memberName: string;
  /** 跨页选中行，勾选优先导出。 */
  selectedRows: Order[];
}

export interface UseOrderExportResult {
  exporting: boolean;
  /** 导出入口点击：勾选优先；未勾选时「全部」页签须有查询条件，其他页签弹确认后整状态导出。 */
  onExport: () => void;
}

/**
 * 订单导出 CSV：勾选优先（跨页选中集）直接导出；
 * 未勾选时「全部」页签必须先有查询条件（否则拒绝），其他状态页签需确认「导出该状态下全部订单」。
 */
export function useOrderExport({
  tab,
  orderNo,
  memberName,
  selectedRows,
}: UseOrderExportOptions): UseOrderExportResult {
  const { message, modal } = AntdApp.useApp();
  const operatorName = useAuthStore((state) => state.user?.name);
  const [exporting, setExporting] = useState(false);

  /** 拉取导出数据并下载；数据量上限由接口层兜底（超出返回 400，由拦截器提示）。 */
  const runExport = async (params: ExportOrdersParams) => {
    setExporting(true);
    try {
      const list = await exportOrders(params);
      downloadCsv(
        buildOrdersCsv(list),
        buildExportFilename({ tabLabel: TAB_LABELS[tab], operator: operatorName }),
      );
      message.success(`已导出 ${list.length} 条订单`);
    } catch {
      // 失败提示（含「数据量过大」）已由响应拦截器统一处理。
    } finally {
      setExporting(false);
    }
  };

  const onExport = () => {
    if (selectedRows.length > 0) {
      void runExport({ orderNos: selectedRows.map((order) => order.orderNo) });
      return;
    }

    const hasQuery = orderNo.trim() !== "" || memberName.trim() !== "";
    if (tab === "all") {
      if (!hasQuery) {
        message.warning("「全部」页签需先输入查询条件或勾选订单，不支持整表导出");
        return;
      }
      void runExport({ tab, orderNo, memberName });
      return;
    }

    modal.confirm({
      title: "确认导出",
      content: hasQuery
        ? `将导出「${TAB_LABELS[tab]}」下符合当前查询条件的订单，是否继续？`
        : `将导出「${TAB_LABELS[tab]}」下的全部订单，是否继续？`,
      okText: "确认导出",
      onOk: () => runExport({ tab, orderNo, memberName }),
    });
  };

  return { exporting, onExport };
}
