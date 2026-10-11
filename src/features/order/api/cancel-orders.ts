import type { ApiResponse } from "@/api/types";
import { request } from "@/api/request";
import type { CancelOrdersInput, Order } from "../types/order";

/** 一键撤单：仅「待制卡」「待寄卡」订单可撤，成功后状态变更为「已取消」。 */
export async function cancelOrders(input: CancelOrdersInput): Promise<Order[]> {
  const { data } = await request.post<ApiResponse<Order[]>>("/orders/cancel", input);
  return data.data;
}
