import { PlusOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import {
  Alert,
  App as AntdApp,
  Button,
  Card,
  Form,
  Input,
  Space,
  Spin,
  Table,
  Tabs,
  Tag,
} from "antd";
import type { TableProps } from "antd";
import { useEffect, useRef, useState, type Key } from "react";
import { Link, useSearchParams } from "react-router";
import {
  cancelOrders,
  formatAmount,
  formatOrderStatus,
  getOrders,
  isCancellable,
  isRenewable,
  ORDER_STATUS_COLOR,
  RenewOrderModal,
  type Order,
  type OrderStatus,
  type OrderTab,
} from "@/features/order";

const PAGE_SIZE_OPTIONS = [10, 20, 50];
const DEFAULT_PAGE_SIZE = 10;
/** 表头 + 分页占用的固定高度（antd 默认值），用于推算表格内部滚动高度。 */
const TABLE_CHROME_HEIGHT = 120;

const TAB_ITEMS: { key: OrderTab; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "inProgress", label: "进行中" },
  { key: "expired", label: "已到期" },
  { key: "completed", label: "已完成" },
  { key: "cancelled", label: "已取消" },
];

interface SearchValues {
  orderNo?: string;
  memberName?: string;
}

/** 订单列表页：状态 Tab + 订单号/姓名搜索 + 批量续卡/一键撤单；筛选状态放 URL search params。 */
export function OrderListPage() {
  const { message, modal } = AntdApp.useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [form] = Form.useForm<SearchValues>();

  const tabParam = searchParams.get("tab");
  const tab = (TAB_ITEMS.some((item) => item.key === tabParam) ? tabParam : "all") as OrderTab;
  const page = Number(searchParams.get("page") ?? "1") || 1;
  const pageSizeParam = Number(searchParams.get("pageSize") ?? "");
  const pageSize = PAGE_SIZE_OPTIONS.includes(pageSizeParam) ? pageSizeParam : DEFAULT_PAGE_SIZE;
  const orderNo = searchParams.get("orderNo") ?? "";
  const memberName = searchParams.get("memberName") ?? "";

  const [result, setResult] = useState<{
    key: string;
    data: Order[];
    total: number;
    error: string | null;
  } | null>(null);

  const [reloadToken, setReloadToken] = useState(0);
  const [selectedKeys, setSelectedKeys] = useState<Key[]>([]);
  const [selectedRows, setSelectedRows] = useState<Order[]>([]);
  const [renewTargets, setRenewTargets] = useState<string[] | null>(null);

  // 表格内部滚动高度：随可用区域自适应（由 ResizeObserver 异步回填，避免在 effect 内同步 setState）。
  const [scrollY, setScrollY] = useState<number>();
  const tableAreaRef = useRef<HTMLDivElement | null>(null);

  // 查询条件指纹：命中即视为「已加载」，避免切条件瞬间展示旧数据。
  const queryKey = `${tab}|${page}|${pageSize}|${orderNo}|${memberName}|${reloadToken}`;

  // 搜索框回显当前 URL 条件（翻页/后退也能同步）。
  useEffect(() => {
    form.setFieldsValue({ orderNo, memberName });
  }, [form, orderNo, memberName]);

  useEffect(() => {
    let alive = true;
    getOrders({
      page,
      pageSize,
      tab,
      orderNo,
      memberName,
      sort: "createdAt",
      order: "desc",
    })
      .then((pageResult) => {
        if (alive) {
          setResult({ key: queryKey, data: pageResult.list, total: pageResult.total, error: null });
        }
      })
      .catch((cause: unknown) => {
        if (alive) {
          setResult({
            key: queryKey,
            data: [],
            total: 0,
            error: cause instanceof Error ? cause.message : "加载失败",
          });
        }
      });
    return () => {
      alive = false;
    };
    // queryKey 已包含全部查询条件。
  }, [tab, page, pageSize, orderNo, memberName, reloadToken, queryKey]);

  // 表格区域尺寸变化时，重算表体内部滚动高度，使表格「撑满且不溢出」内容区。
  useEffect(() => {
    const el = tableAreaRef.current;
    if (el === null) {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const height = entries[0]?.contentRect.height ?? 0;
      setScrollY(Math.max(Math.floor(height) - TABLE_CHROME_HEIGHT, 120));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // 仅采用与当前查询匹配的结果，切条件瞬间展示 loading 而非旧数据。
  const settled = result?.key === queryKey ? result : null;
  const loading = settled === null;
  const data = settled?.data ?? [];
  const total = settled?.total ?? 0;
  const error = settled?.error ?? null;

  const clearSelection = () => {
    setSelectedKeys([]);
    setSelectedRows([]);
  };

  const updateQuery = (next: Record<string, string | null>) => {
    // 条件变化时清空已选，避免跨条件误操作。
    clearSelection();
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      Object.entries(next).forEach(([key, value]) => {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      return params;
    });
  };

  const reload = () => {
    setReloadToken((token) => token + 1);
  };

  const onSearch = (values: SearchValues) => {
    updateQuery({ orderNo: values.orderNo ?? "", memberName: values.memberName ?? "", page: "1" });
  };

  const onReset = () => {
    form.resetFields();
    updateQuery({ orderNo: null, memberName: null, page: "1" });
  };

  const onBatchRenew = () => {
    if (selectedRows.length === 0) {
      message.warning("请先选择订单");
      return;
    }
    const invalid = selectedRows.filter((order) => !isRenewable(order.status));
    if (invalid.length > 0) {
      modal.warning({
        title: "部分订单不满足续卡条件",
        content: `仅「已到期」订单可续卡，以下订单不满足：${invalid.map((order) => order.orderNo).join("、")}`,
      });
      return;
    }
    setRenewTargets(selectedRows.map((order) => order.orderNo));
  };

  const onBatchCancel = () => {
    if (selectedRows.length === 0) {
      message.warning("请先选择订单");
      return;
    }
    const invalid = selectedRows.filter((order) => !isCancellable(order.status));
    if (invalid.length > 0) {
      modal.warning({
        title: "部分订单不满足撤单条件",
        content: `仅「待制卡」「待寄卡」订单可撤单，以下订单不满足：${invalid.map((order) => order.orderNo).join("、")}`,
      });
      return;
    }
    const orderNos = selectedRows.map((order) => order.orderNo);
    modal.confirm({
      title: "确认撤单",
      content: `将撤销以下订单：${orderNos.join("、")}`,
      okText: "确认撤单",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await cancelOrders({ orderNos });
          message.success("撤单成功");
          clearSelection();
          reload();
        } catch {
          // 失败提示已由响应拦截器统一处理。
        }
      },
    });
  };

  const columns: TableProps<Order>["columns"] = [
    { title: "订单号", dataIndex: "orderNo" },
    { title: "会员姓名", dataIndex: "memberName" },
    { title: "购卡年限", dataIndex: "years", render: (years: number) => `${years} 年` },
    {
      title: "订单金额",
      dataIndex: "amount",
      render: (amount: number | null) => formatAmount(amount),
    },
    {
      title: "状态",
      dataIndex: "status",
      render: (status: OrderStatus) => (
        <Tag color={ORDER_STATUS_COLOR[status]}>{formatOrderStatus(status)}</Tag>
      ),
    },
    { title: "创建时间", dataIndex: "createdAt" },
    {
      title: "操作",
      key: "action",
      render: (_, record) =>
        isRenewable(record.status) ? (
          <Button type="link" size="small" onClick={() => setRenewTargets([record.orderNo])}>
            续卡
          </Button>
        ) : (
          "-"
        ),
    },
  ];

  // 批量按钮只出现在对应 Tab：续卡对「已到期」有效，撤单对「进行中」有效；「全部」两者都可操作。
  const canRenew = tab === "all" || tab === "expired";
  const canCancel = tab === "all" || tab === "inProgress";

  return (
    <Card
      title="订单列表"
      className="flex h-full flex-col"
      styles={{
        body: { flex: 1, minHeight: 0, display: "flex", flexDirection: "column" },
      }}
      extra={
        <Link to="/orders/new">
          <Button type="primary" icon={<PlusOutlined />}>
            新建订单
          </Button>
        </Link>
      }
    >
      <Tabs
        className="shrink-0"
        activeKey={tab}
        items={TAB_ITEMS}
        onChange={(key) => updateQuery({ tab: key, page: "1" })}
      />

      <div className="mb-6 shrink-0">
        <Form form={form} layout="inline" onFinish={onSearch}>
          <Form.Item name="orderNo" label="订单号">
            <Input allowClear placeholder="精确匹配" />
          </Form.Item>
          <Form.Item name="memberName" label="会员姓名">
            <Input allowClear placeholder="模糊匹配" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                查询
              </Button>
              <Button icon={<ReloadOutlined />} onClick={onReset}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </div>

      {(canRenew || canCancel) && (
        <Space className="mb-3 shrink-0">
          {canRenew && <Button onClick={onBatchRenew}>批量续卡</Button>}
          {canCancel && (
            <Button danger onClick={onBatchCancel}>
              一键撤单
            </Button>
          )}
        </Space>
      )}

      {error === null ? (
        <div ref={tableAreaRef} className="min-h-0 flex-1">
          <Spin spinning={loading}>
            <Table<Order>
              rowKey="orderNo"
              rowSelection={{
                selectedRowKeys: selectedKeys,
                onChange: (keys, rows) => {
                  setSelectedKeys(keys);
                  setSelectedRows(rows);
                },
              }}
              columns={columns}
              dataSource={data}
              scroll={{ y: scrollY }}
              pagination={{
                current: page,
                pageSize,
                total,
                showSizeChanger: true,
                pageSizeOptions: PAGE_SIZE_OPTIONS,
                showQuickJumper: true,
                showTotal: (count) => `共 ${count} 条`,
                onChange: (nextPage, nextPageSize) => {
                  if (nextPageSize !== pageSize) {
                    updateQuery({ pageSize: String(nextPageSize), page: "1" });
                  } else {
                    updateQuery({ page: String(nextPage) });
                  }
                },
              }}
            />
          </Spin>
        </div>
      ) : (
        <Alert type="error" message={error} showIcon />
      )}

      <RenewOrderModal
        open={renewTargets !== null}
        orderNos={renewTargets ?? []}
        onCancel={() => setRenewTargets(null)}
        onSuccess={() => {
          setRenewTargets(null);
          clearSelection();
          reload();
        }}
      />
    </Card>
  );
}
