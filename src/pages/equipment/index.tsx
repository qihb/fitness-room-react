import { PlusOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Space, Spin, Table } from "antd";
import {
  DEFAULT_PAGE_SIZE,
  EQUIPMENT_STATUS_VALUES,
  EQUIPMENT_TYPE_OPTIONS,
  EquipmentFormModal,
  EquipmentListSearch,
  getEquipmentColumns,
  getEquipmentList,
  PAGE_SIZE_OPTIONS,
  useEquipmentActions,
  type Equipment,
  type EquipmentListParams,
  type EquipmentListSearchValues,
} from "@/features/equipment";
import { useAuthorization } from "@/hooks/use-authorization";
import { useListQuery } from "@/hooks/use-list-query";
import { useRowSelection } from "@/hooks/use-row-selection";
import { useTableScrollY } from "@/hooks/use-table-scroll-y";
import { PERMISSION } from "@/lib/permissions";

// 列表查询配置：模块级常量，保证引用稳定（hook 依引用判断配置是否变化）。
const LIST_QUERY_FIELDS = [
  { key: "keyword" },
  { key: "status", options: EQUIPMENT_STATUS_VALUES },
  { key: "type", options: EQUIPMENT_TYPE_OPTIONS },
];
const LIST_QUERY_EXTRA_PARAMS = { sort: "purchasedAt", order: "desc" } as const;

/** 设备列表页：名称/状态/类型筛选 + 新增/编辑/删除 + 批量删除；筛选状态放 URL search params，选中支持跨翻页。 */
export function EquipmentListPage() {
  const { data, total, loading, error, params, setParams, resetParams, reload } = useListQuery<
    Equipment,
    EquipmentListParams
  >({
    fetcher: getEquipmentList,
    fields: LIST_QUERY_FIELDS,
    extraParams: LIST_QUERY_EXTRA_PARAMS,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
    defaultPageSize: DEFAULT_PAGE_SIZE,
  });

  const keyword = params.keyword ?? "";
  const status = params.status ?? "";
  const type = params.type ?? "";

  const canCreate = useAuthorization(PERMISSION.EQUIPMENT_CREATE);
  const canUpdate = useAuthorization(PERMISSION.EQUIPMENT_UPDATE);
  const canDelete = useAuthorization(PERMISSION.EQUIPMENT_DELETE);

  const selection = useRowSelection<Equipment>({
    rows: data,
    getRowKey: (item) => item.equipmentNo,
  });
  const { ref: tableAreaRef, scrollY } = useTableScrollY();
  const actions = useEquipmentActions({
    selectedRows: selection.selectedRows,
    onClearSelection: selection.clear,
    reload,
  });

  const columns = getEquipmentColumns({
    onEdit: actions.openEdit,
    onDelete: actions.onRowDelete,
    canEdit: canUpdate,
    canDelete,
  });

  return (
    <Card
      title="设备管理"
      className="flex h-full flex-col"
      styles={{
        body: { flex: 1, minHeight: 0, display: "flex", flexDirection: "column" },
      }}
      extra={
        canCreate && (
          <Button type="primary" icon={<PlusOutlined />} onClick={actions.openCreate}>
            新增设备
          </Button>
        )
      }
    >
      <EquipmentListSearch
        keyword={keyword}
        status={status}
        type={type}
        onSearch={(values: EquipmentListSearchValues) => {
          // 查询条件变化时清空已选，避免跨条件误操作。
          selection.clear();
          setParams({
            keyword: values.keyword ?? "",
            status: values.status ?? "",
            type: values.type ?? "",
            page: 1,
          });
        }}
        onReset={() => {
          selection.clear();
          resetParams(["keyword", "status", "type"]);
        }}
      />

      {canDelete && (
        <Space className="mb-3 shrink-0">
          <Button danger onClick={actions.onBatchDelete}>
            批量删除
          </Button>
        </Space>
      )}

      {error === null ? (
        <div ref={tableAreaRef} className="min-h-0 flex-1">
          <Spin spinning={loading}>
            <Table<Equipment>
              rowKey="equipmentNo"
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

      <EquipmentFormModal
        open={actions.formOpen}
        equipment={actions.editing}
        onCancel={actions.closeForm}
        onSuccess={actions.onFormSuccess}
      />
    </Card>
  );
}
