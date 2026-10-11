# 订单列表页导出（CSV）· 落地计划

**目标**：在订单列表页提供「导出」CSV 能力，供财务对账；**不支持全量导出**（「全部」页签须有查询条件或勾选，否则拒绝；其他状态页签弹确认可导出该状态全部），导出能力按状态 Tab 授权，数据量由接口层兜底。
**技术栈**：见 AGENTS.md（React 19 / Vite+ / react-router 8 / antd 6 / axios / zustand 5 / Tailwind 4）。
**涉及文件**：

- 增：`src/lib/permissions.ts`、`src/hooks/use-authorization.ts`、`src/features/order/utils/export.ts`、`src/features/order/utils/export.test.ts`、`src/features/order/api/export-orders.ts`
- 改：`src/store/auth.ts`、`src/features/order/constants.ts`、`src/features/order/utils/format.ts`、`src/features/order/utils/format.test.ts`、`src/features/order/index.ts`、`src/api/mock.ts`、`src/pages/order/index.tsx`、`README.md`
  **关键决策**（业务方已澄清）：不做全量导出（「全部」页签无条件且无勾选直接提示拒绝；其他状态页签弹确认后导出全部）；导出字段明文；金额千分位无符号；不可导出状态改为**按 Tab 配置权限**，默认仅「已完成」；留痕由后端做；文件名 = Tab 状态 + 时间 + 操作人。
  **执行约定**：本文件仅为计划；由用户指定步骤后再执行，每完成一步勾选 `- [ ]`。

---

## 阶段 0 · 权限基建（PBAC）

- [x] 0.1 `src/lib/permissions.ts`：权限点目录（`order:export:<tab>`）+ mock 默认权限（仅「已完成」）
- [x] 0.2 `src/hooks/use-authorization.ts`：`useAuthorization(permission)` 统一判定入口
- [x] 0.3 `src/store/auth.ts`：登录态增 `permissions`，登录授予默认权限、登出清空，并做持久化版本迁移补默认值

## 阶段 1 · 领域规则（按 Tab 授权，废弃状态白名单）

- [x] 1.1 `constants.ts`：移除 `EXPORTABLE_STATUSES`，新增 `ORDER_EXPORT_PERMISSION_BY_TAB`
- [x] 1.2 `utils/format.ts`：移除 `isExportable`（状态不再写死，改由权限控制）

## 阶段 2 · 导出工具与接口

- [x] 2.1 `utils/export.ts`：列定义、`escapeCsvField`、`buildOrdersCsv`（BOM + CRLF）、`buildExportFilename`（Tab+时间+操作人）、`downloadCsv`
- [x] 2.2 `api/export-orders.ts`：`exportOrders`（勾选优先，否则按条件）
- [x] 2.3 `src/api/mock.ts`：抽出 `filterOrders`，新增 `GET /orders/export` 与 `EXPORT_MAX_ROWS` 超限 400 拒绝

## 阶段 3 · 页面接入

- [x] 3.1 导出权限按当前 Tab 判定，无权限隐藏「导出」入口
- [x] 3.2 `onExport`：有勾选直接导出；无勾选时「全部」页签无查询条件则提示拒绝、其他页签弹确认后导出该状态全部

## 阶段 4 · 单测

- [x] 4.1 `export.test.ts`：转义 / BOM 与表头 / 空列表 / 文件名（含操作人、非法字符降级）
- [x] 4.2 `format.test.ts`：移除 `isExportable` 用例

## 阶段 5 · 文档与校验

- [x] 5.1 README 更新为「问题 → 业务澄清 → 当前实现」结构 + 假设表 A1~A13 + 实现说明
- [x] 5.2 `pnpm exec vp check` + `pnpm exec vp test`

---

## 当前状态

- 阶段 0→5 全部完成。
- 与上一版的差异：导出范围由「筛选全量」改为**勾选优先 / 条件查询，且禁止无条件导出**——其中「全部」页签**限制查询条件**（无条件则提示拒绝），**其他状态页签不限制条件但弹确认**（提示将导出全部）；状态白名单改为 **Tab 级权限**；新增接口层数据量上限；文件名加入 Tab 与操作人。
