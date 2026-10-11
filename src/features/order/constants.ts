import type { OrderStatus, OrderTab } from "./types/order";
import { PERMISSION } from "@/lib/permissions";

/** 单价：元 / 年。 */
export const PRICE_PER_YEAR = 1200;

/** 年限下限 / 上限。 */
export const MIN_YEARS = 1;
export const MAX_YEARS = 10;

/** 达到该年限享折扣。 */
export const DISCOUNT_THRESHOLD_YEARS = 5;

/** 折扣费率：5 年及以上 8 折。 */
export const DISCOUNT_RATE = 0.8;

/** 状态 → 展示文案。 */
export const ORDER_STATUS_TEXT: Record<OrderStatus, string> = {
  pendingAudit: "待审核",
  pendingCard: "待制卡",
  pendingShip: "待寄卡",
  expired: "已到期",
  completed: "已完成",
  cancelled: "已取消",
};

/** 状态 → Tag 颜色（不同状态不同颜色）。 */
export const ORDER_STATUS_COLOR: Record<OrderStatus, string> = {
  pendingAudit: "gold",
  pendingCard: "blue",
  pendingShip: "cyan",
  expired: "orange",
  completed: "green",
  cancelled: "red",
};

/**
 * Tab → 导出权限点：导出能力按「状态维度」逐项授权，由业务方在权限配置中开通；
 * 名单不写死在前端，前端仅按当前 Tab 判断是否显示导出入口。
 */
export const ORDER_EXPORT_PERMISSION_BY_TAB: Record<OrderTab, string> = {
  all: PERMISSION.ORDER_EXPORT_ALL,
  inProgress: PERMISSION.ORDER_EXPORT_IN_PROGRESS,
  expired: PERMISSION.ORDER_EXPORT_EXPIRED,
  completed: PERMISSION.ORDER_EXPORT_COMPLETED,
  cancelled: PERMISSION.ORDER_EXPORT_CANCELLED,
};

/** Tab → 覆盖的订单状态集合；`all` 为 null 表示不过滤。 */
export const TAB_STATUSES: Record<OrderTab, OrderStatus[] | null> = {
  all: null,
  inProgress: ["pendingAudit", "pendingCard", "pendingShip"],
  expired: ["expired"],
  completed: ["completed"],
  cancelled: ["cancelled"],
};
