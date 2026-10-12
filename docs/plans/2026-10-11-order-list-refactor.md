# 订单列表页重构（通用列表 hooks + 页面组件化）· 落地计划

**目标**：抽出后台列表页通用的三块能力（**useListQuery / useRowSelection / useTableScrollY**），并把订单列表页按关注点拆到 feature 内，页面由 **~494 行降到 ~130~150 行**，**对外行为完全不变**。
**技术栈**：见 AGENTS.md（React 19 / Vite+ / react-router 8 / antd 6 / axios / zustand 5 / Tailwind 4）。
**涉及文件**：

- 增：`src/hooks/use-list-query.ts`、`src/hooks/use-list-query.test.ts`、`src/hooks/use-row-selection.ts`、`src/hooks/use-table-scroll-y.ts`
- 增：`src/features/order/components/order-columns.tsx`、`order-list-search.tsx`、`order-batch-actions.tsx`
- 增：`src/features/order/hooks/use-order-export.ts`、`src/features/order/hooks/use-order-actions.ts`
- 改：`src/pages/order/index.tsx`、`src/features/order/constants.ts`、`src/features/order/index.ts`

**关键决策**（已与用户确认）：

- **范围**：通用 hooks + 页面组件化两档一起做，**一次性交付订单页**。
- **位置**：三块通用能力放 `src/hooks/`（跨 feature 复用，不建 `index.ts`，沿用直接导入习惯）；业务组件 / 业务动作 hooks 放 `features/order/`。
- **不搬页面**：`pages/order/index.tsx` 保留路由组件身份，只做组合与接线，不整体搬进 feature。
- **不抽业务语义**：列定义、导出规则（勾选优先 / 全量限制）、续卡撤单的校验与二次确认，保持业务专属，不做通用化。
- **URL 仍是唯一事实源**：筛选/分页沿用 `useSearchParams`；写时合并、空值删除、条件变更重置 `page=1`。
- **保留现有两个语义**：`queryKey` 指纹（切条件立即 loading，不显示旧数据）+ `alive` 防竞态。
- **不引入新依赖**：hook 保持 UI 无关（`useRowSelection` 仅 `import type` antd 的 `TableProps`）；「URL ↔ 参数」纯逻辑抽成同文件导出的纯函数，用现有 `vp test` 覆盖，hook 本体走手工回归（项目无 `@testing-library/react` 与 e2e 基建）。

**执行约定**：本文件仅为计划；由用户指定步骤后再执行，每完成一步勾选 `- [ ]`。

---

## 接口草案

```ts
// src/hooks/use-list-query.ts
export interface ListQueryField {
  key: string;
  /** 读取时兜底值 */
  defaultValue?: string;
  /** 白名单校验，不命中则回落 defaultValue；不传表示不校验 */
  options?: readonly string[];
}

export interface UseListQueryOptions<T, P> {
  /** 查询函数（feature/api），入参为组装好的请求参数 */
  fetcher: (params: P) => Promise<PageResult<T>>;
  fields?: readonly ListQueryField[];
  /** 固定附加参数，如 { sort: "createdAt", order: "desc" } */
  extraParams?: Partial<Omit<P, "page" | "pageSize">>;
  pageSizeOptions?: readonly number[];
  defaultPageSize?: number;
}

export interface UseListQueryResult<T, P> {
  data: T[];
  total: number;
  loading: boolean;
  error: string | null;
  /** 当前查询参数（含 page/pageSize），导出等场景可直接复用 */
  params: P;
  /** 合并写 URL：null / "" / undefined 删除该键 */
  setParams: (next: Record<string, string | number | null | undefined>) => void;
  /** 重置指定筛选键（删除参数、回落默认值）并回到第 1 页；keys 必填，避免误连 tab 一起重置 */
  resetParams: (keys: readonly string[]) => void;
  /** 手动重载（续卡/撤单成功后） */
  reload: () => void;
}
```

```ts
// src/hooks/use-row-selection.ts
export interface UseRowSelectionOptions<T> {
  /** 当前页行数据（用于把 key 关联回行快照） */
  rows: T[];
  getRowKey: (row: T) => string;
}

export interface UseRowSelectionResult<T> {
  selectedKeys: string[];
  /** 跨页聚合后的行快照，批量操作直接读取 */
  selectedRows: T[];
  clear: () => void;
  /** 展开给 antd Table 的 rowSelection（preserveSelectedRowKeys + 跨页快照合并） */
  rowSelectionProps: TableProps<T>["rowSelection"];
}
```

```ts
// src/hooks/use-table-scroll-y.ts
export function useTableScrollY(options?: {
  /** 表头 + 分页等固定占高，默认 120 */
  chromeHeight?: number;
  /** 最小高度，默认 120 */
  minHeight?: number;
}): { ref: RefObject<HTMLDivElement | null>; scrollY: number | undefined };
```

---

## 不变量（重构不得改变，回归按此逐条核对）

1. 进入 `/orders` 默认：`tab=all`、`page=1`、`pageSize=10`、无筛选关键字。
2. 非法 `tab` 回落 `all`；非法/缺失 `pageSize` 回落 `10`；非法 `page` 回落 `1`。
3. 切 Tab / 提交搜索 / 重置 → `page` 回 `1`，并**清空选中**；翻页 / 改每页条数 → **保留选中**。
4. 切条件的瞬间展示 loading（Spin），**不显示旧数据**；过期响应不覆盖当前条件的结果。
5. 空值与已清空的筛选**不写入 URL**（键被删除）。
6. 导出：有勾选直接导出勾选项；「全部」页签无查询条件时提示拒绝；其他页签弹确认后整状态导出。
7. 批量续卡/批量撤单成功后：清选中 + `reload`；**行内撤单成功只 `reload`，不清选中**（保持现状）。
8. 表格撑满内容区且不溢出（`scrollY` 随容器尺寸自适应）。
9. 浏览器前进/后退能还原筛选与分页，搜索框回显与 URL 一致。

---

## 阶段 0 · 接口定稿

- [x] 0.1 本文档与三段接口草案经用户确认

## 阶段 1 · 通用 hooks（`src/hooks/`）

- [x] 1.1 `use-list-query.ts`：纯函数 `parseListQuery`（白名单兜底）/ `buildListQueryUpdate`（合并、空值删除）/ `buildListQueryParams` + hook 主体（组装 `params`（含 `extraParams`）→ 请求 → 状态）
- [x] 1.2 `use-list-query.ts`：`setParams` / `resetParams` / `reload`；内部沿用「URL 指纹」+ `alive` 防竞态
- [x] 1.3 `use-row-selection.ts`：跨页选中 Map（当前页取真实行、非当前页保留快照）+ 条件变更时由调用方 `clear`
- [x] 1.4 `use-table-scroll-y.ts`：`ResizeObserver` 回填 `scrollY`（`chromeHeight` / `minHeight` 可配）

## 阶段 2 · 订单 feature 内部拆分

- [x] 2.1 `constants.ts`：从页面搬入 `TAB_ITEMS` / `TAB_LABELS` / `PAGE_SIZE_OPTIONS` / `DEFAULT_PAGE_SIZE`（`TABLE_CHROME_HEIGHT` 未搬：由 `useTableScrollY` 默认值 120 承接，避免两处常量）
- [x] 2.2 `components/order-columns.tsx`：`getOrderColumns({ onRenew, onCancel })`（7 列 + 状态 Tag + 操作列）
- [x] 2.3 `components/order-list-search.tsx`：搜索表单，受控于 URL 条件（含回显 effect、查询/重置回调）
- [x] 2.4 `components/order-batch-actions.tsx`：导出 / 批量续卡 / 一键撤单按钮组（按 Tab 与权限决定显隐）
- [x] 2.5 `hooks/use-order-export.ts`：`runExport` + `onExport`（勾选优先 / 全量限制 / 确认弹窗 / 文件名）
- [x] 2.6 `hooks/use-order-actions.ts`：`onBatchRenew` / `onBatchCancel` / `onRowCancel`（校验 + 二次确认 + 成功后回调 `reload`/`clear`）
- [x] 2.7 `index.ts`：补充新增对外件的出口（仅页面需要的）

## 阶段 3 · 页面重新接线

- [x] 3.1 用三个 hooks 替换内联逻辑：URL 解析、`result` / `reloadToken` / 请求 effect、`settled` 派生、`updateQuery`、`selectedMap`、`scrollY` / `ResizeObserver`
- [x] 3.2 用拆出的组件与 columns 替换 JSX 大块与 `columns` 定义
- [x] 3.3 分页 props 由 `params.page / params.pageSize` 拼装；`tab` 类型收敛到一处
- [x] 3.4 核对：非预期错误仍走路由 `errorElement` 多层兜底，页面内不做全局兜底

## 阶段 4 · 单测

- [x] 4.1 `use-list-query.test.ts`：默认值兜底、白名单不命中回落、非法 `page/pageSize` 回落、空值删除键、数字转字符串

## 阶段 5 · 校验与回归

- [x] 5.1 `pnpm exec vp check` + `pnpm exec vp test`（0 error / 0 warning；19 个单测全绿）
- [ ] 5.2 按「不变量」9 条回归，并确认页面行数目标达成

---

## 当前状态

- 阶段 0→4 与 5.1 已完成；**阶段 5.2（按「不变量」9 条回归）待做**：E2E 依赖的 chromium 未安装，下载已停止，回归尚未执行。
- **页面行数**：`src/pages/order/index.tsx` 由 494 行降至 161 行。
- **新增通用能力**：`useListQuery` / `useRowSelection` / `useTableScrollY`（`src/hooks/`）。
- **与计划的三处偏差（均已记录）**：
  1. `TABLE_CHROME_HEIGHT` 不搬入 `constants.ts`，改由 `useTableScrollY` 默认值承接（避免两处同值常量）。
  2. `resetParams` 的 `keys` 由可选改为**必填**：原计划的「不传则重置全部筛选字段」会连 `tab` 一起重置，与现有「重置只清 orderNo/memberName」的行为不符，故要求显式传入。
  3. 新增配置约定：`fetcher` / `fields` / `extraParams` / `pageSizeOptions` 需为**稳定引用**（页面已改为模块级常量），否则会被视为配置变化而重复请求；已写入 hook 的 JSDoc。
- 收益模型（诚实版）：首个列表页仓库总代码略增；**从第二个列表页起净赚**，且通用 hook 修一次（如过期响应覆盖、切条件闪旧数据）后续列表页全部受益。

## 待确认的取舍

- 若希望更激进，可把整个列表再搬进 `features/order/components/order-list.tsx`（页面仅挂路由）；当前计划**不做**此步，`pages/` 保留路由组件身份。
