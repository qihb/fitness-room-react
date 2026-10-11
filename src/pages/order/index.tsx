import { PlusOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Spin, Table, Tag } from "antd";
import type { TableProps } from "antd";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import {
  formatAmount,
  formatOrderStatus,
  getOrders,
  type Order,
  type OrderStatus,
} from "@/features/order";

const PAGE_SIZE = 10;

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending: "gold",
  paid: "green",
  cancelled: "red",
};

interface PageState {
  page: number;
  data: Order[];
  total: number;
  error: string | null;
}

/** 订单列表页：经 feature 数据层取数，分页状态放 URL search params。 */
export function OrderListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get("page") ?? "1") || 1;

  const [result, setResult] = useState<PageState | null>(null);

  useEffect(() => {
    let alive = true;
    getOrders({ page, pageSize: PAGE_SIZE })
      .then((pageResult) => {
        if (alive) {
          setResult({ page, data: pageResult.list, total: pageResult.total, error: null });
        }
      })
      .catch((cause: unknown) => {
        if (alive) {
          setResult({
            page,
            data: [],
            total: 0,
            error: cause instanceof Error ? cause.message : "加载失败",
          });
        }
      });
    return () => {
      alive = false;
    };
  }, [page]);

  // 仅采用与当前 page 匹配的结果，避免翻页瞬间串数据。
  const settled = result?.page === page ? result : null;
  const loading = settled === null;
  const error = settled?.error ?? null;
  const data = settled?.data ?? [];
  const total = settled?.total ?? 0;

  const columns: TableProps<Order>["columns"] = [
    { title: "订单号", dataIndex: "id" },
    { title: "客户", dataIndex: "customer" },
    { title: "商品", dataIndex: "product" },
    { title: "金额", dataIndex: "amount", render: (amount: number) => formatAmount(amount) },
    {
      title: "状态",
      dataIndex: "status",
      render: (status: OrderStatus) => (
        <Tag color={STATUS_COLOR[status]}>{formatOrderStatus(status)}</Tag>
      ),
    },
    { title: "创建时间", dataIndex: "createdAt" },
  ];

  return (
    <Card
      title="订单列表"
      extra={
        <Link to="/orders/new">
          <Button type="primary" icon={<PlusOutlined />}>
            新建订单
          </Button>
        </Link>
      }
    >
      {error === null ? (
        <Spin spinning={loading}>
          <Table<Order>
            rowKey="id"
            columns={columns}
            dataSource={data}
            pagination={{
              current: page,
              pageSize: PAGE_SIZE,
              total,
              onChange: (nextPage) => {
                setSearchParams((prev) => {
                  const next = new URLSearchParams(prev);
                  next.set("page", String(nextPage));
                  return next;
                });
              },
            }}
          />
        </Spin>
      ) : (
        <Alert type="error" message={error} showIcon />
      )}
    </Card>
  );
}
