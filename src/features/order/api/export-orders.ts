import type { ApiResponse } from "@/api/types";
import { request } from "@/api/request";
import type { Order, OrderTab } from "../types/order";

/** 订单导出查询入参：勾选优先，否则按 Tab + 搜索条件。 */
export interface ExportOrdersParams {
  /** 勾选的订单号（支持跨页选中）；有值时优先按此导出。 */
  orderNos?: string[];
  tab?: OrderTab;
  /** 订单号，精确匹配。 */
  orderNo?: string;
  /** 会员姓名，模糊匹配。 */
  memberName?: string;
}

/**
 * 拉取导出数据。
 * 接口层对单次数据量有上限兜底，超出时返回 400（由响应拦截器统一提示），
 * 因此前端不具备「全量导出」能力。
 */
export async function exportOrders(params: ExportOrdersParams): Promise<Order[]> {
  const { data } = await request.get<ApiResponse<Order[]>>("/orders/export", { params });
  return data.data;
}
