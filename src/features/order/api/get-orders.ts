import type { ApiResponse, PageResult } from "@/api/types";
import { request } from "@/api/request";
import type { Order, OrderListParams } from "../types/order";

/** 查询订单列表（分页），统一走项目唯一的 axios 实例。 */
export async function getOrders(params: OrderListParams): Promise<PageResult<Order>> {
  const { data } = await request.get<ApiResponse<PageResult<Order>>>("/orders", { params });
  return data.data;
}
