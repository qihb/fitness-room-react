# 订单列表：mock 随机化 + 行内撤单 + 跨页选中 · 落地计划

**目标**：① mock 种子数据状态随机分布（不再按状态聚堆）；② 操作列对满足条件的行增加"撤单"按钮；③ 表格支持跨翻页选中，操作可拿到任意页选中数据，翻页保留选中状态。
**技术栈**：React 19 + antd 6 + zustand（无 react-query），mock 为 axios adapter（见 `src/api/mock.ts`）。
**涉及文件**：`src/api/mock.ts`、`src/pages/order/index.tsx`。
**关键决策**：

- mock 洗牌用 Fisher–Yates + `Math.random`，每次刷新分布不同；`createdAt` 仍按种子序递减，会话内分页/排序稳定；保留 6 状态覆盖与 0/null 金额边界样本。
- 行内撤单复用批量撤单的交互（`modal.confirm` + `cancelOrders`），单行操作不改选中集。
- 跨页选中：`selectedMap: Map<orderNo, Order>` 作为唯一事实源（含非当前页行的快照），`rowSelection.preserveSelectedRowKeys: true`；批量操作读取 `map.values()`。
- 选中保留范围（用户已确认）：仅翻页/改每页条数保留；切 Tab、搜索、重置仍清空。
  **执行约定**：本文件仅为计划；由用户指定步骤后再执行，每完成一步勾选 `- [ ]`。

---

## 阶段 0 · mock 随机化

- [x] 0.1 `src/api/mock.ts`：初始化时对 `SEED_SPECS` 洗牌后再生成 `seedOrders`，状态不再按序聚堆

## 阶段 1 · 行内撤单

- [x] 1.1 操作列：`isCancellable`（待制卡/待寄卡）的行显示"撤单"按钮（与续卡并列的 link 按钮），点击弹确认 → `cancelOrders([orderNo])` → 成功提示 + 刷新列表

## 阶段 2 · 跨页选中

- [x] 2.1 选中状态改造：`selectedKeys/selectedRows` → `selectedMap`；`rowSelection.onChange` 同步增删（非当前页 key 保留缓存快照）；开启 `preserveSelectedRowKeys`
- [x] 2.2 清空时机调整：翻页/改 pageSize 不清空；切 Tab、搜索、重置清空（把清空从 `updateQuery` 移到对应入口）；批量续卡/撤单改读 `selectedMap` 的值

## 阶段 3 · 校验

- [x] 3.1 运行 `pnpm exec vp check`（+ `pnpm exec vp test`）：均通过
- [x] 3.2 浏览器实测：第一页状态混合分布 PASS；待制卡/待寄卡行有撤单按钮、其余 "-" PASS；第 1 页勾 2 行 → 第 2 页勾 1 行 → 翻回第 1 页选中保留 PASS；一键撤单弹窗校验内容包含第 2 页订单号（跨页数据可取）PASS

---

## 当前状态

- 全部步骤（0.1、1.1、2.1、2.2、3.1、3.2）已执行完成，`vp check` / `vp test` 通过，浏览器实测 5 项全过。
- 改动：`src/api/mock.ts`（种子洗牌）、`src/pages/order/index.tsx`（行内撤单 + selectedMap 跨页选中）。
