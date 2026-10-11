/** 订单状态：覆盖「下单 → 制卡 → 寄卡 → 完成」及到期/撤单的完整流转。 */
export type OrderStatus =
  | "pendingAudit" // 待审核
  | "pendingCard" // 待制卡
  | "pendingShip" // 待寄卡
  | "expired" // 已到期
  | "completed" // 已完成
  | "cancelled"; // 已取消

/** 列表筛选 Tab：全部 / 进行中 / 已到期 / 已完成 / 已取消。 */
export type OrderTab = "all" | "inProgress" | "expired" | "completed" | "cancelled";

/** 订单领域实体。 */
export interface Order {
  orderNo: string;
  memberName: string;
  phone: string;
  /** 购卡年限。 */
  years: number;
  /** 订单金额，接口可能返回空值。 */
  amount: number | null;
  status: OrderStatus;
  createdAt: string;
}

/** 订单列表查询参数。 */
export interface OrderListParams {
  page: number;
  pageSize: number;
  tab?: OrderTab;
  /** 订单号，精确匹配。 */
  orderNo?: string;
  /** 会员姓名，模糊匹配。 */
  memberName?: string;
  sort?: "createdAt";
  order?: "asc" | "desc";
}

/** 新建订单入参。 */
export interface CreateOrderInput {
  memberName: string;
  phone: string;
  years: number;
  remark?: string;
}

/** 批量续卡入参。 */
export interface RenewOrdersInput {
  orderNos: string[];
  years: number;
}

/** 批量撤单入参。 */
export interface CancelOrdersInput {
  orderNos: string[];
}
