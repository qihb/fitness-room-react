import { Button, Space, Tag } from "antd";
import type { TableProps } from "antd";
import { ORDER_STATUS_COLOR } from "../constants";
import type { Order, OrderStatus } from "../types/order";
import { formatAmount, formatOrderStatus, isCancellable, isRenewable } from "../utils/format";

export interface OrderColumnsOptions {
  /** 行内「续卡」：打开单条续卡弹窗。 */
  onRenew: (order: Order) => void;
  /** 行内「撤单」：走与批量撤单一致的校验与确认流程。 */
  onCancel: (order: Order) => void;
}

/** 订单列表列定义；操作列按状态决定可用的行内动作。 */
export function getOrderColumns({
  onRenew,
  onCancel,
}: OrderColumnsOptions): TableProps<Order>["columns"] {
  return [
    { title: "订单号", dataIndex: "orderNo", align: "center" },
    { title: "会员姓名", dataIndex: "memberName", align: "center" },
    {
      title: "购卡年限",
      dataIndex: "years",
      align: "center",
      render: (years: number) => `${years} 年`,
    },
    {
      title: "订单金额",
      dataIndex: "amount",
      align: "center",
      render: (amount: number | null) => formatAmount(amount),
    },
    {
      title: "状态",
      dataIndex: "status",
      align: "center",
      render: (status: OrderStatus) => (
        <Tag color={ORDER_STATUS_COLOR[status]}>{formatOrderStatus(status)}</Tag>
      ),
    },
    { title: "创建时间", dataIndex: "createdAt", align: "center", width: 200 },
    {
      title: "操作",
      key: "action",
      align: "center",
      render: (_, record) => {
        if (!isRenewable(record.status) && !isCancellable(record.status)) {
          return "-";
        }
        return (
          <Space size={4}>
            {isRenewable(record.status) && (
              <Button type="link" size="small" onClick={() => onRenew(record)}>
                续卡
              </Button>
            )}
            {isCancellable(record.status) && (
              <Button type="link" size="small" danger onClick={() => onCancel(record)}>
                撤单
              </Button>
            )}
          </Space>
        );
      },
    },
  ];
}
