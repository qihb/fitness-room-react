import type { ApiResponse } from "@/api/types";
import { request } from "@/api/request";
import type { CreateOrderInput, Order } from "../types/order";

/** 新建订单。 */
export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const { data } = await request.post<ApiResponse<Order>>("/orders", input);
  return data.data;
}
