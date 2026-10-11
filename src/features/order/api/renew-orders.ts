import type { ApiResponse } from "@/api/types";
import { request } from "@/api/request";
import type { Order, RenewOrdersInput } from "../types/order";

/** 批量续卡：仅「已到期」订单可续，成功后购卡年限累加、状态回到「待审核」。 */
export async function renewOrders(input: RenewOrdersInput): Promise<Order[]> {
  const { data } = await request.post<ApiResponse<Order[]>>("/orders/renew", input);
  return data.data;
}
