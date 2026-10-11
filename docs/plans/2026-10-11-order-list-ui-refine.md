# 订单列表页 · 交互与布局优化 · 落地计划

**目标**：订单列表页 4 项体验优化 —— 分页增强、批量按钮按 Tab 显隐、工具栏位置、表格区独立滚动。
**技术栈**：见 AGENTS.md（React 19 / Vite+ / antd 6 / Tailwind 4），包管理器 pnpm。
**涉及文件**：

- 改：`src/pages/order/index.tsx`（主要）
- 改：`src/layouts/basic-layout.tsx`（内容区溢出策略）

**关键决策**：

1. ✅ 按钮归属：`全部` Tab 两个都显示；`已到期` 只显示「批量续卡」；`进行中` 只显示「一键撤单」；`已完成` / `已取消` 都不显示。
2. ✅ 分页：`showTotal`（共 X 条）+ `showQuickJumper`（跳页）+ `showSizeChanger`（每页条数，写入 URL）。
3. ✅ 表格高度：内容区改为不滚动，表格区用 flex 撑满 + `Table scroll.y` 实现内部滚动（`y` 由 `ResizeObserver` 量取可用高度后回填，避免写死像素/`calc` 常量）。

**执行约定**：本文件仅为计划；**由用户指定步骤后再执行**，每完成一步勾选 `- [ ]` 并更新「当前状态」。

---

## 需求 → 落点

| 需求                             | 落点                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| ① 分页加「页码 + 跳页」          | `pages/order/index.tsx` `pagination`：`showTotal` / `showQuickJumper` / `showSizeChanger`；`pageSize` 进 URL |
| ② 两个按钮只显示在对应 Tab       | 依据当前 `tab` 计算 `canRenew = all\|expired`、`canCancel = all\|inProgress`，工具栏按此渲染                 |
| ③ 按钮贴近表格、远离搜索条件     | 调整搜索表单与工具栏的上下间距（加大与表单距离、缩小与表格距离）                                             |
| ④ 滚动条限制在表格、内容区不滚动 | `layouts/basic-layout.tsx` 内容区改 flex、不滚动；列表页 Card 撑满高度，表格区内部滚动                       |

## 当前状态

- **全部阶段 A→E 已完成**（用户确认「可以落地代码了」后执行）。
- 校验：`pnpm exec vp check` 全绿（47 文件格式 + 29 文件零告警）；`pnpm exec vp test` 4 passed。
- 浏览器走查（A/B/C/D 全通过）：
  - A 分页：显示「共 42 条」、跳页输入框（`page=3 → 2` 有效）、每页条数选择器（10/20/50）；切 20 条/页后 URL 变 `?pageSize=20&page=1`。
  - B 按钮显隐：全部→两个；已到期→仅续卡；进行中→仅撤单；已完成/已取消→都不显示。
  - C 间距：搜索表单底部→按钮顶部 24px，按钮底部→表格顶部 12px（按钮更靠近表格）。
  - D 滚动：`document.scrollingElement` 不滚动（scrollHeight = clientHeight）；`.ant-table-body` 内部滚动（clientHeight 395 < scrollHeight 1980）；滚动表体时表头位置不变。
- 关键实现说明：
  - `scrollY` 由 `ResizeObserver` 异步回填（`TABLE_CHROME_HEIGHT = 120` 为表头+分页高度），未在 effect 内同步 setState，规避 `react(set-state-in-effect)` 告警。
  - 间距改用外层 `div` 承载（antd Form 样式会覆盖直接加在 `Form` 上的 Tailwind `mb-6`，实测为 0px）。

---

## 阶段 A · 分页增强（①）

- [x] A.1 `pageSize` 纳入 URL params（默认 10；非法值回退 10），并入 `queryKey`
- [x] A.2 `pagination` 增加 `showTotal` / `showQuickJumper` / `showSizeChanger`（`pageSizeOptions: [10,20,50]`）；切换每页条数时重置到第 1 页

## 阶段 B · 批量按钮按 Tab 显隐（②）

- [x] B.1 计算 `canRenew = tab === "all" || tab === "expired"`、`canCancel = tab === "all" || tab === "inProgress"`
- [x] B.2 工具栏按可见性渲染对应按钮；两者都不可见时不渲染整行

## 阶段 C · 工具栏位置（③）

- [x] C.1 搜索表单下方留白加大、工具栏与表格间距缩小（表单外层 div `mb-6`、工具栏 `mb-3`）
- [x] C.2 修正：`mb-6` 改挂在外层 `div`（antd Form 样式会覆盖加在 `Form` 上的 Tailwind margin）

## 阶段 D · 表格区独立滚动（④）

- [x] D.1 `basic-layout.tsx`：`Content` 改 `flex flex-col gap-4 overflow-hidden p-6`，`Breadcrumb` 固定不滚，`Outlet` 外包一层 `min-h-0 flex-1 overflow-auto`
- [x] D.2 `pages/order/index.tsx`：`Card` 改 `flex h-full flex-col`，卡片 body 用 antd 官方 `styles.body` 设 `flex:1/minHeight:0/纵向 flex`；Tabs/表单/工具栏固定，表格区 `flex-1 min-h-0`
- [x] D.3 `Table` 加 `scroll={{ y: scrollY }}`（`scrollY` 由 ResizeObserver 量取），使表头固定、表体内部滚动、分页常驻

## 阶段 E · 校验与走查

- [x] E.1 `pnpm exec vp check` 全绿 + `pnpm exec vp test` 通过
- [x] E.2 浏览器走查：分页总数/跳页/每页条数；按钮随 Tab 显隐；工具栏间距；表格内部滚动且内容区不滚动
