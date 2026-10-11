# 订单列表（筛选/续卡/撤单）+ 新建订单 · 落地计划

**目标**：把现有订单骨架升级为完整业务闭环 —— 列表页状态 Tab 筛选、订单号/姓名搜索、金额千分位、批量续卡、一键撤单；新建页字段改为会员姓名/手机号/购卡年限（费用自动计算），提交后回列表可见。
**技术栈**：见 AGENTS.md（React 19 / Vite+ / react-router 8 / antd 6 / axios / zustand 5 / Tailwind 4），包管理器 pnpm。
**涉及文件**：见下方清单。
**关键决策**：✅ 已与用户确认（见「已定决策」）。
**执行约定**：本文件仅为计划；**由用户指定步骤后再执行**，每完成一步勾选 `- [ ]` 并更新「当前状态」。

---

## 需求 → 实现对照

| 需求                                                                                                             | 落点                                                                        |
| ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| 状态 Tab（全部/进行中/已到期/已完成/已取消，进行中=待审核+待制卡+待寄卡）                                        | `pages/order/index.tsx` antd `Tabs`，Tab 与 page 同步进 URL params          |
| 搜索：订单号精确、会员姓名模糊                                                                                   | 列表页搜索表单，条件进 URL params（查询/重置均回第 1 页）                   |
| 表格列：订单号/会员姓名/购卡年限/订单金额/状态 Tag/创建时间/操作列                                               | `pages/order/index.tsx` `columns`                                           |
| 默认创建时间倒序（最新在前）                                                                                     | 接口入参 `sort=createdAt&order=desc`；mock 同步排序                         |
| 金额千分位 `12,000.00`，0 与 null 均显示 `0.00`                                                                  | `features/order/utils/format.ts#formatAmount`                               |
| 批量续卡（仅已到期；含不满足项需列出订单号；弹窗填年限 1~10，实时费用；≥5 年 8 折；成功后年限累加、状态→待审核） | `components/renew-order-modal.tsx` + `pages` 工具栏 + `api/renew-orders.ts` |
| 一键撤单（仅待制卡/待寄卡；二次确认列出订单号；→已取消）                                                         | 撤单按钮 + `Modal.confirm` + `api/cancel-orders.ts`                         |
| 操作列「续卡」（仅已到期行显示，逻辑同批量）                                                                     | 列 `render` 复用同一续卡弹窗                                                |
| 新建：会员姓名 2~30、手机号格式、年限 1~10、费用只读自动算、备注≤200；成功后提示并回列表                         | `pages/order/new.tsx`                                                       |

## 涉及文件

- 改：`src/features/order/types/order.ts`、`api/get-orders.ts`、`api/create-order.ts`、`utils/format.ts`、`utils/format.test.ts`、`index.ts`、`src/pages/order/index.tsx`、`src/pages/order/new.tsx`、`src/api/mock.ts`
- 增：`src/features/order/constants.ts`、`api/renew-orders.ts`、`api/cancel-orders.ts`、`components/renew-order-modal.tsx`
- 不改：`src/router/index.tsx`（路由 `/orders`、`/orders/new` 复用现有）、`src/api/request.ts`

## 已定决策（用户已确认）

1. **排序**：以「最新在前」为准 → 创建时间**倒序（desc）**，接口/mock 一致。
2. **金额空值**：`null`/`undefined` 一律按 `0.00` 展示。
3. **数据层**：**直接重构**为新领域模型（`orderNo/memberName/phone/years/amount/status/createdAt`），旧 `customer/product` 移除；新建页字段同步替换。
4. **Mock 全量实现**：筛选/搜索/排序、批量续卡、一键撤单、新建均走 mock，可本地完整走查。
5. **状态模型**：`pendingAudit` 待审核 / `pendingCard` 待制卡 / `pendingShip` 待寄卡 / `expired` 已到期 / `completed` 已完成 / `cancelled` 已取消；「进行中」= 待审核 + 待制卡 + 待寄卡。

   **完整状态流转**：

   ```
   待审核 ──▶ 待制卡 ──▶ 待寄卡 ──▶ 已完成
                                    │（会员卡到期未续费）
                                    ▼
                                  已到期 ──（续卡）──▶ 待审核
   待制卡 / 待寄卡 ──（客户撤单）──▶ 已取消
   ```

   - 正向主链路：待审核 → 待制卡 → 待寄卡 → 已完成
   - 会员卡到期未续费：已完成 → 已到期
   - 续卡：已到期 → 待审核（年限累加）
   - 撤单：待制卡 / 待寄卡 → 已取消

6. **计价规则**：单价 `1200 元/年`；续卡年限 `1~10` 整数；≥5 年按 **8 折**（费率 0.8）；年限累加为「原年限 + 续卡年限」。

---

## 阶段 0 · 领域模型与计价工具

- [x] 0.1 `types/order.ts`：新 `OrderStatus`（6 态）、`Order`、`OrderTab`、`OrderListParams`（含 tab/orderNo/memberName/sort）、`CreateOrderInput`、`RenewOrdersInput`、`CancelOrdersInput`
- [x] 0.2 `constants.ts`：`PRICE_PER_YEAR=1200`、`DISCOUNT_THRESHOLD_YEARS=5`、`DISCOUNT_RATE=0.8`、`MIN/MAX_YEARS`、`TAB_STATUSES`（Tab → 状态集合）、`ORDER_STATUS_TEXT` + `ORDER_STATUS_COLOR`（拆为文案与 Tag 颜色两表）
- [x] 0.3 `utils/format.ts`：`formatOrderStatus`、`formatAmount(number|null)`（千分位）、`calcRenewFee(years)`、`isRenewable(status)`、`isCancellable(status)`；更新 `format.test.ts` 覆盖 6 态 / 千分位 / 0 与 null / 折扣

## 阶段 1 · 数据层 API + Mock

- [x] 1.1 `api/get-orders.ts`（入参类型已扩展 tab/orderNo/memberName/sort）、`api/create-order.ts`（新入参）
- [x] 1.2 新增 `api/renew-orders.ts`（`POST /orders/renew`）、`api/cancel-orders.ts`（`POST /orders/cancel`）；`index.ts` 汇总出口
- [x] 1.3 `src/api/mock.ts`：新字段种子数据（含 0 与 null 金额、各状态各 1 条以上）；GET 支持 tab/精确订单号/模糊姓名/倒序分页；POST 新建→待审核；POST renew 校验「已到期」并累加年限→待审核；POST cancel 校验「待制卡/待寄卡」→已取消

## 阶段 2 · 订单列表页

- [x] 2.1 状态 Tab（`Tabs`）+ 搜索表单（订单号/会员姓名），Tab、搜索、分页状态统一进 URL params；切 Tab / 查询均重置到第 1 页
- [x] 2.2 表格列（订单号/会员姓名/购卡年限/订单金额/状态 Tag/创建时间/操作）+ 默认倒序；开启 `rowSelection` 供批量操作
- [x] 2.3 工具栏「批量续卡 / 一键撤单」：按选中项校验资格，不合格时用 `modal.warning` 列出不合格订单号；合格则进入弹窗/二次确认
- [x] 2.4 续卡弹窗 `components/renew-order-modal.tsx`：年限 `InputNumber`(1~10)，实时展示应付费用；确认后调接口，成功刷新列表 + `message`
- [x] 2.5 一键撤单：`modal.confirm` 列出待撤订单号，确认后调接口 → 状态变更 + 刷新
- [x] 2.6 操作列「续卡」按钮（仅 `expired` 行）复用 2.4 弹窗

## 阶段 3 · 新建订单页

- [x] 3.1 表单字段与校验：会员姓名(2~30)、手机号(格式)、购卡年限(1~10 整数)、办卡费用(只读、`Form.useWatch` 联动 = 年限×1200)、备注(≤200)
- [x] 3.2 提交成功 `message` 提示并 `navigate('/orders')`；新订单应出现在列表（mock 追加）

## 阶段 4 · 校验与走查

- [x] 4.1 `pnpm exec vp check` 全绿（42 文件格式 + 28 文件零告警）+ `pnpm exec vp test` 4 passed
- [x] 4.2 浏览器走查（11/11 通过）：Tab 切换回第 1 页 / 搜索精确与模糊 / 金额 0 与空值 / 批量续卡含不合格订单提示 / ≥5 年 8 折 / 续卡后年限累加且状态待审核 / 撤单二次确认与状态变更 / 行内续卡仅过期行 / 新建后列表可见

---

## 当前状态

- **全部阶段 0→4 已完成**，Part 1 与 Part 2 需求全部落地。
- 校验：`pnpm exec vp check` 全绿；`pnpm exec vp test` 4 passed；浏览器端到端走查 11/11 通过。
- 关键实现说明：
  - 金额展示 `formatAmount` 输出纯千分位（如 `12,000.00`），`null`/`undefined` 与 `0` 均显示 `0.00`（不带货币符号，按需求样例）。
  - 列表 loading 用「查询条件指纹」派生（`result.key === queryKey`），未在 effect 内同步 setState，规避 `react(set-state-in-effect)` 告警。
  - 清空已选用事件驱动（在 `updateQuery` 内），未使用 effect。
- 已知非阻断项：mock 数据存于内存，刷新页面即重置（演示场景预期内）。
