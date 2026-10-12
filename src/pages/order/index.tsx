import { PlusOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Spin, Table, Tabs } from "antd";
import { Link } from "react-router";
import {
  DEFAULT_PAGE_SIZE,
  getOrderColumns,
  getOrders,
  OrderBatchActions,
  OrderListSearch,
  ORDER_EXPORT_PERMISSION_BY_TAB,
  PAGE_SIZE_OPTIONS,
  RenewOrderModal,
  TAB_ITEMS,
  useOrderActions,
  useOrderExport,
  type Order,
  type OrderListParams,
  type OrderListSearchValues,
} from "@/features/order";
import { useAuthorization } from "@/hooks/use-authorization";
import { useListQuery } from "@/hooks/use-list-query";
import { useRowSelection } from "@/hooks/use-row-selection";
import { useTableScrollY } from "@/hooks/use-table-scroll-y";

const TAB_KEYS = TAB_ITEMS.map((item) => item.key);

// 列表查询配置：模块级常量，保证引用稳定（hook 依引用判断配置是否变化）。
const LIST_QUERY_FIELDS = [
  { key: "tab", defaultValue: "all", options: TAB_KEYS },
  { key: "orderNo" },
  { key: "memberName" },
];
const LIST_QUERY_EXTRA_PARAMS = { sort: "createdAt", order: "desc" } as const;

/** 订单列表页：状态 Tab + 订单号/姓名搜索 + 行内/批量续卡撤单；筛选状态放 URL search params，选中支持跨翻页。 */
export function OrderListPage() {
  const { data, total, loading, error, params, setParams, resetParams, reload } = useListQuery<
    Order,
    OrderListParams
  >({
    fetcher: getOrders,
    fields: LIST_QUERY_FIELDS,
    extraParams: LIST_QUERY_EXTRA_PARAMS,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
    defaultPageSize: DEFAULT_PAGE_SIZE,
  });

  const tab = params.tab ?? "all";
  const orderNo = params.orderNo ?? "";
  const memberName = params.memberName ?? "";

  // 导出权限按当前 Tab（状态维度）判定：无权限则不展示导出入口。
  const canExport = useAuthorization(ORDER_EXPORT_PERMISSION_BY_TAB[tab]);

  const selection = useRowSelection<Order>({ rows: data, getRowKey: (order) => order.orderNo });
  const { ref: tableAreaRef, scrollY } = useTableScrollY();
  const actions = useOrderActions({
    selectedRows: selection.selectedRows,
    onClearSelection: selection.clear,
    reload,
  });
  const { exporting, onExport } = useOrderExport({
    tab,
    orderNo,
    memberName,
    selectedRows: selection.selectedRows,
  });

  // 批量按钮只出现在对应 Tab：续卡对「已到期」有效，撤单对「进行中」有效；「全部」两者都可操作。
  const canRenew = tab === "all" || tab === "expired";
  const canCancel = tab === "all" || tab === "inProgress";

  const columns = getOrderColumns({ onRenew: actions.openRenew, onCancel: actions.onRowCancel });

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
          selection.clear();
          setParams({ tab: key, page: 1 });
        }}
      />

      <OrderListSearch
        orderNo={orderNo}
        memberName={memberName}
        onSearch={(values: OrderListSearchValues) => {
          // 查询条件变化时清空已选，避免跨条件误操作。
          selection.clear();
          setParams({
            orderNo: values.orderNo ?? "",
            memberName: values.memberName ?? "",
            page: 1,
          });
        }}
        onReset={() => {
          selection.clear();
          resetParams(["orderNo", "memberName"]);
        }}
      />

      <OrderBatchActions
        canExport={canExport}
        canRenew={canRenew}
        canCancel={canCancel}
        exporting={exporting}
        onExport={onExport}
        onBatchRenew={actions.onBatchRenew}
        onBatchCancel={actions.onBatchCancel}
      />

      {error === null ? (
        <div ref={tableAreaRef} className="min-h-0 flex-1">
          <Spin spinning={loading}>
            <Table<Order>
              rowKey="orderNo"
              rowSelection={selection.rowSelectionProps}
              columns={columns}
              dataSource={data}
              scroll={{ y: scrollY }}
              pagination={{
                current: params.page,
                pageSize: params.pageSize,
                total,
                showSizeChanger: true,
                pageSizeOptions: PAGE_SIZE_OPTIONS,
                showQuickJumper: true,
                showTotal: (count) => `共 ${count} 条`,
                onChange: (nextPage, nextPageSize) => {
                  if (nextPageSize !== params.pageSize) {
                    setParams({ pageSize: nextPageSize, page: 1 });
                  } else {
                    setParams({ page: nextPage });
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
        open={actions.renewTargets !== null}
        orderNos={actions.renewTargets ?? []}
        onCancel={actions.closeRenew}
        onSuccess={actions.onRenewSuccess}
      />
    </Card>
  );
}
