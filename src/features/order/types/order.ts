/** 订单状态。 */
export type OrderStatus = "pending" | "paid" | "cancelled";

/** 订单领域实体。 */
export interface Order {
  id: string;
  customer: string;
  product: string;
  amount: number;
  status: OrderStatus;
  createdAt: string;
}

/** 订单列表查询参数。 */
export interface OrderListParams {
  page: number;
  pageSize: number;
}

/** 新建订单入参。 */
export interface CreateOrderInput {
  customer: string;
  product: string;
  amount: number;
  remark?: string;
}
