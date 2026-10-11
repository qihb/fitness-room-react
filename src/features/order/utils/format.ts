import type { OrderStatus } from "../types/order";

const STATUS_TEXT: Record<OrderStatus, string> = {
  pending: "待支付",
  paid: "已支付",
  cancelled: "已取消",
};

/** 订单状态 → 展示文案。 */
export function formatOrderStatus(status: OrderStatus): string {
  return STATUS_TEXT[status];
}

/** 金额 → `¥0.00` 展示格式。 */
export function formatAmount(amount: number): string {
  return `¥${amount.toFixed(2)}`;
}
