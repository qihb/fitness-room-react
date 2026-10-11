import { DownloadOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons";
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
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import {
  buildExportFilename,
  buildOrdersCsv,
  cancelOrders,
  downloadCsv,
  exportOrders,
  formatAmount,
  formatOrderStatus,
  getOrders,
  isCancellable,
  isRenewable,
  ORDER_EXPORT_PERMISSION_BY_TAB,
  ORDER_STATUS_COLOR,
  RenewOrderModal,
  type ExportOrdersParams,
  type Order,
  type OrderStatus,
  type OrderTab,
} from "@/features/order";
import { useAuthorization } from "@/hooks/use-authorization";
import { useAuthStore } from "@/store/auth";

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

/** Tab → 中文名，用于导出文件名。 */
const TAB_LABELS = Object.fromEntries(TAB_ITEMS.map((item) => [item.key, item.label])) as Record<
  OrderTab,
  string
>;

interface SearchValues {
  orderNo?: string;
  memberName?: string;
}

/** 订单列表页：状态 Tab + 订单号/姓名搜索 + 行内/批量续卡撤单；筛选状态放 URL search params，选中支持跨翻页。 */
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

  // 导出权限按当前 Tab（状态维度）判定：无权限则不展示导出入口。
  const canExport = useAuthorization(ORDER_EXPORT_PERMISSION_BY_TAB[tab]);
  // 导出文件名中的操作人。
  const operatorName = useAuthStore((state) => state.user?.name);

  const [result, setResult] = useState<{
    key: string;
    data: Order[];
    total: number;
    error: string | null;
  } | null>(null);

  const [reloadToken, setReloadToken] = useState(0);
  // 跨页选中：orderNo → 行数据快照（含非当前页），作为选中集的唯一事实源。
  const [selectedMap, setSelectedMap] = useState<Map<string, Order>>(new Map());
  const [renewTargets, setRenewTargets] = useState<string[] | null>(null);
  const [exporting, setExporting] = useState(false);

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
    setSelectedMap(new Map());
  };

  // 选中订单（跨页聚合），批量操作直接读取。
  const selectedOrders = [...selectedMap.values()];

  const updateQuery = (next: Record<string, string | null>) => {
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
    // 查询条件变化时清空已选，避免跨条件误操作（翻页/改每页条数保留选中）。
    clearSelection();
    updateQuery({ orderNo: values.orderNo ?? "", memberName: values.memberName ?? "", page: "1" });
  };

  const onReset = () => {
    form.resetFields();
    clearSelection();
    updateQuery({ orderNo: null, memberName: null, page: "1" });
  };

  /** 拉取导出数据并下载；数据量上限由接口层兜底（超出返回 400，由拦截器提示）。 */
  const runExport = async (params: ExportOrdersParams) => {
    setExporting(true);
    try {
      const list = await exportOrders(params);
      downloadCsv(
        buildOrdersCsv(list),
        buildExportFilename({ tabLabel: TAB_LABELS[tab], operator: operatorName }),
      );
      message.success(`已导出 ${list.length} 条订单`);
    } catch {
      // 失败提示（含「数据量过大」）已由响应拦截器统一处理。
    } finally {
      setExporting(false);
    }
  };

  /**
   * 导出 CSV：勾选优先（跨页选中集）直接导出。
   * 未勾选时：「全部」页签必须先有查询条件（否则拒绝）；其他状态页签不限制条件，
   * 但需用户确认「将导出该状态下全部订单」后再下载。
   */
  const onExport = () => {
    if (selectedOrders.length > 0) {
      void runExport({ orderNos: selectedOrders.map((order) => order.orderNo) });
      return;
    }

    const hasQuery = orderNo.trim() !== "" || memberName.trim() !== "";
    if (tab === "all") {
      if (!hasQuery) {
        message.warning("「全部」页签需先输入查询条件或勾选订单，不支持整表导出");
        return;
      }
      void runExport({ tab, orderNo, memberName });
      return;
    }

    modal.confirm({
      title: "确认导出",
      content: hasQuery
        ? `将导出「${TAB_LABELS[tab]}」下符合当前查询条件的订单，是否继续？`
        : `将导出「${TAB_LABELS[tab]}」下的全部订单，是否继续？`,
      okText: "确认导出",
      onOk: () => runExport({ tab, orderNo, memberName }),
    });
  };

  const onBatchRenew = () => {
    if (selectedOrders.length === 0) {
      message.warning("请先选择订单");
      return;
    }
    const invalid = selectedOrders.filter((order) => !isRenewable(order.status));
    if (invalid.length > 0) {
      modal.warning({
        title: "部分订单不满足续卡条件",
        content: `仅「已到期」订单可续卡，以下订单不满足：${invalid.map((order) => order.orderNo).join("、")}`,
      });
      return;
    }
    setRenewTargets(selectedOrders.map((order) => order.orderNo));
  };

  const onBatchCancel = () => {
    if (selectedOrders.length === 0) {
      message.warning("请先选择订单");
      return;
    }
    const invalid = selectedOrders.filter((order) => !isCancellable(order.status));
    if (invalid.length > 0) {
      modal.warning({
        title: "部分订单不满足撤单条件",
        content: `仅「待制卡」「待寄卡」订单可撤单，以下订单不满足：${invalid.map((order) => order.orderNo).join("、")}`,
      });
      return;
    }
    const orderNos = selectedOrders.map((order) => order.orderNo);
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

  /** 行内撤单：与批量撤单同一校验/确认流程，仅针对单条。 */
  const onRowCancel = (order: Order) => {
    modal.confirm({
      title: "确认撤单",
      content: `将撤销订单：${order.orderNo}`,
      okText: "确认撤单",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await cancelOrders({ orderNos: [order.orderNo] });
          message.success("撤单成功");
          reload();
        } catch {
          // 失败提示已由响应拦截器统一处理。
        }
      },
    });
  };

  const columns: TableProps<Order>["columns"] = [
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
              <Button type="link" size="small" onClick={() => setRenewTargets([record.orderNo])}>
                续卡
              </Button>
            )}
            {isCancellable(record.status) && (
              <Button type="link" size="small" danger onClick={() => onRowCancel(record)}>
                撤单
              </Button>
            )}
          </Space>
        );
      },
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
        onChange={(key) => {
          // 切 Tab 属于换条件，清空已选（翻页/改每页条数不清空）。
          clearSelection();
          updateQuery({ tab: key, page: "1" });
        }}
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

      {(canExport || canRenew || canCancel) && (
        <Space className="mb-3 shrink-0">
          {canExport && (
            <Button icon={<DownloadOutlined />} loading={exporting} onClick={onExport}>
              导出
            </Button>
          )}
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
                preserveSelectedRowKeys: true,
                selectedRowKeys: [...selectedMap.keys()],
                onChange: (keys) => {
                  // 当前页返回真实行数据；非当前页的 key 保留已缓存快照，实现跨页选中。
                  setSelectedMap((prev) => {
                    const next = new Map<string, Order>();
                    keys.forEach((key) => {
                      const keyText = String(key);
                      const row = data.find((order) => order.orderNo === keyText);
                      const cached = prev.get(keyText);
                      if (row !== undefined) {
                        next.set(keyText, row);
                      } else if (cached !== undefined) {
                        next.set(keyText, cached);
                      }
                    });
                    return next;
                  });
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
