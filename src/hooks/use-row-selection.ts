import { useState } from "react";
import type { TableProps } from "antd";

/**
 * 表格跨页选中通用 hook：以「key → 行快照」Map 作为选中集的唯一事实源，
 * 当前页命中真实行数据、非当前页保留已缓存快照，因此批量操作可跨页聚合。
 *
 * 约定：
 * - `getRowKey` 返回值需与 `Table.rowKey` 一致（统一转字符串比较）。
 * - `rows` 传**当前页**数据：翻页/改每页条数时不要 `clear`；切换筛选条件时应 `clear`。
 *
 * @example
 * ```tsx
 * const selection = useRowSelection<Order>({ rows: data, getRowKey: (o) => o.orderNo });
 *
 * <Table rowKey="orderNo" rowSelection={selection.rowSelectionProps} dataSource={data} />
 *
 * selection.selectedRows; // 跨页聚合后的行快照，批量操作直接读取
 * selection.clear();      // 切换筛选条件时清空
 * ```
 */

export interface UseRowSelectionOptions<T> {
  /** 当前页行数据：用于把选中 key 关联回行快照。 */
  rows: T[];
  /** 取行唯一键（与表格 rowKey 一致）。 */
  getRowKey: (row: T) => string;
}

export interface UseRowSelectionResult<T> {
  /** 选中行 key 集合（跨页聚合）。 */
  selectedKeys: string[];
  /** 选中行快照（含非当前页），批量操作直接读取。 */
  selectedRows: T[];
  /** 清空选中：筛选条件变化时调用（翻页/改每页条数不调用）。 */
  clear: () => void;
  /** 直接展开给 antd Table 的 rowSelection。 */
  rowSelectionProps: TableProps<T>["rowSelection"];
}

/** 表格跨页选中 hook 主体（用途与用法见文件头部说明）。 */
export function useRowSelection<T>({
  rows,
  getRowKey,
}: UseRowSelectionOptions<T>): UseRowSelectionResult<T> {
  const [selectedMap, setSelectedMap] = useState<Map<string, T>>(new Map());

  const clear = () => {
    setSelectedMap(new Map());
  };

  const rowSelectionProps: TableProps<T>["rowSelection"] = {
    preserveSelectedRowKeys: true,
    selectedRowKeys: [...selectedMap.keys()],
    onChange: (keys) => {
      setSelectedMap((prev) => {
        const next = new Map<string, T>();
        keys.forEach((key) => {
          const keyText = String(key);
          const row = rows.find((item) => getRowKey(item) === keyText);
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
  };

  return {
    selectedKeys: [...selectedMap.keys()],
    selectedRows: [...selectedMap.values()],
    clear,
    rowSelectionProps,
  };
}
