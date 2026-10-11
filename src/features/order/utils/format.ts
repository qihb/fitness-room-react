import {
  DISCOUNT_RATE,
  DISCOUNT_THRESHOLD_YEARS,
  ORDER_STATUS_TEXT,
  PRICE_PER_YEAR,
} from "../constants";
import type { OrderStatus } from "../types/order";

/** 订单状态 → 展示文案。 */
export function formatOrderStatus(status: OrderStatus): string {
  return ORDER_STATUS_TEXT[status];
}

/** 金额 → 千分位展示（如 12,000.00）；空值按 0 处理。 */
export function formatAmount(amount: number | null | undefined): string {
  const [intPart, decPart] = (amount ?? 0).toFixed(2).split(".");
  return `${intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${decPart}`;
}

/** 续卡应付费用 = 年限 × 单价；5 年及以上按 8 折。 */
export function calcRenewFee(years: number): number {
  const base = years * PRICE_PER_YEAR;
  const total = years >= DISCOUNT_THRESHOLD_YEARS ? base * DISCOUNT_RATE : base;
  return Math.round(total * 100) / 100;
}

/** 是否可续卡：仅「已到期」。 */
export function isRenewable(status: OrderStatus): boolean {
  return status === "expired";
}

/** 是否可撤单：仅「待制卡」「待寄卡」。 */
export function isCancellable(status: OrderStatus): boolean {
  return status === "pendingCard" || status === "pendingShip";
}
