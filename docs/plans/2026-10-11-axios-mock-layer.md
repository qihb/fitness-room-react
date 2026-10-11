# Axios 实例封装 + Mock 数据层 · 落地计划

**目标**：把项目唯一的 axios 实例补全为「baseURL + 统一注入 token + 统一错误提示 + 401 清登录态并跳登录页」；并把 mock 数据层扩到 ≥30 条、覆盖全部订单状态，读写操作真实改内存、后续查询可见。
**技术栈**：见 AGENTS.md（React 19 / Vite+ / react-router 8 / antd 6 / axios / zustand 5 / Tailwind 4），包管理器 pnpm。
**涉及文件**：见下方清单。
**关键决策**：✅ 已与用户确认（见「已定决策」）。
**执行约定**：本文件仅为计划；**由用户指定步骤后再执行**，每完成一步勾选 `- [ ]` 并更新「当前状态」。

---

## 现状核对（本次范围 vs 已有实现）

| 需求                                         | 现状                                     | 本次动作           |
| -------------------------------------------- | ---------------------------------------- | ------------------ |
| baseURL                                      | ✅ `request.ts` 已配 `VITE_API_BASE_URL` | 核对不改           |
| 请求拦截注入 `Authorization: Bearer <token>` | ✅ 已实现（读 `useAuthStore`）           | 核对不改           |
| 响应拦截统一错误提示                         | ⚠️ 仅归一化为 `Error`，未弹提示          | **补：全局提示**   |
| 401 → 清登录态 + 跳登录页                    | ❌ 未实现                                | **补：401 处理**   |
| Mock ≥30 条、覆盖全状态                      | ⚠️ 仅 8 条                               | **扩：≥30 条**     |
| 列表接口分页 + 筛选（tab/订单号/姓名/排序）  | ✅ `mock.ts` 已支持                      | 核对不改           |
| 写操作真实改内存（新建/续卡/撤单），刷新重置 | ✅ 已支持                                | 核对 + 补 401 模拟 |

## 涉及文件

- 改：`src/api/request.ts`（401 + 统一错误提示）、`src/api/mock.ts`（种子 ≥30 + 401 模拟）、`src/App.tsx`（挂载 message 桥）
- 增：`src/api/feedback.ts`（antd message 单例 + 桥组件）
- 改（去重复提示）：`src/pages/order/index.tsx`、`src/pages/order/new.tsx`、`src/features/order/components/renew-order-modal.tsx`
- 不改：`src/api/types.ts`、`src/features/order/**`（除上面去重处）、`src/router/index.tsx`、`src/store/auth.ts`

## 已定决策（用户已确认）

1. **401 跳转**：引入 `src/router` 单例，拦截器内 `router.navigate("/login", { replace: true })`（SPA 内跳转，不整页刷新）。
2. **错误提示**：非 401 错误在响应拦截器内**全局弹一次** `message.error`；同步清理页面里与接口错误重复的 `message.error`，避免双弹。
3. **Mock 401**：mock 在**无 token / token 非法**时返回 401，便于本地端到端验证；仍受 `VITE_USE_MOCK` 开关控制。

---

## 阶段 1 · Axios 实例封装

- [x] 1.1 `src/api/feedback.ts`：导出模块单例 `feedback`（`{ success/error/warning }`）与 `FeedbackBridge` 组件；`FeedbackBridge` 用 `App.useApp()` 取实例、在 `useEffect` 中写入单例，挂载于 `App.tsx` 的 `<AntdApp>` 内、`RouterProvider` 之前。
- [x] 1.2 `request.ts` 响应拦截：错误归一化保留（优先取后端 `message`）；**401 分支** → 清登录态 `useAuthStore.getState().logout()` + `router.navigate("/login", { replace: true })`，加 `handlingUnauthorized` 防抖避免并发 401 重复跳转/重复提示。
- [x] 1.3 `request.ts` 非 401 分支：调 `feedback.error(文案)` 全局提示一次，再 `reject`；401 只提示「登录已过期，请重新登录」。
- [x] 1.4 去重复提示：`pages/order/index.tsx`、`pages/order/new.tsx`、`renew-order-modal.tsx` 中与「接口失败」相关的 `message.error` 移除（保留必填校验、成功提示、`modal` 类交互）。

## 阶段 2 · Mock 数据层

- [x] 2.1 `src/api/mock.ts` 种子扩到 **42 条**：6 种状态全覆盖（待审核/待制卡/待寄卡 各 8、已到期 8、已完成 6、已取消 4）；含 `amount=0` 与 `amount=null`；姓名池 12 个故意重名（便于模糊搜索）；`createdAt` 按天递减，全部 42 条「全部」Tab 可翻 5 页、「进行中」可翻 3 页。
- [x] 2.2 核对 `GET /orders` 参数：`page/pageSize/tab/orderNo/memberName/sort/order` 与 `OrderListParams` 一致（已具备，仅校验）。
- [x] 2.3 核对写操作真实改内存：`POST /orders`（新建 → 待审核、生成递增订单号与 createdAt）、`POST /orders/renew`（仅已到期 → 年限累加 → 待审核）、`POST /orders/cancel`（仅待制卡/待寄卡 → 已取消）；写后 `GET` 可见。
- [x] 2.4 新增 401 模拟：请求无 `Authorization` 或 token 非法（`Bearer invalid`）时返回 401，供 1.2 分支端到端验证。
- [x] 2.5 **修复（走查发现）**：自定义 adapter 直接 resolve 会绕过 axios 内置 `validateStatus`，导致 4xx/5xx 被当作成功（401 分支不触发、`fail` 的 400 也不生效）。改为 `reject()` 抛出 `AxiosError`（携带 `response.status`），统一交由响应拦截器失败分支处理。

## 阶段 3 · 校验与走查

- [x] 3.1 `pnpm exec vp check` 全绿（46 文件格式 + 29 文件零告警）+ `pnpm exec vp test` 4 passed。
- [x] 3.2 浏览器走查：全部 Tab 共 42 条 / 5 页、「进行中」24 条 / 3 页、订单号精确搜索命中 1 条、姓名「张」模糊命中 7 条（均符合预期）；将 token 篡改为 `invalid` 后重载 `/orders` → 自动重定向 `/login`、弹出「登录已过期，请重新登录」、`token` 置空、无残留错误 Alert；重登后列表恢复 42 条 / 5 页。

---

## 当前状态

- **阶段 1→3 全部完成**，需求（axios 封装 + mock 数据层）全部落地并通过校验与浏览器走查。
- 校验：`pnpm exec vp check` 全绿；`pnpm exec vp test` 4 passed。
- 关键实现说明：
  - 错误提示集中在 `request.ts` 响应拦截器；页面/弹窗里的重复 `message.error` 已移除，改由拦截器统一提示（列表加载失败仍保留页内 `Alert` 作为常驻态）。
  - `feedback` 单例经 `FeedbackBridge`（`App.useApp()` + `useEffect`）注入，避免 antd 静态方法脱离 `App` 上下文的告警；`FeedbackBridge` 置于 `RouterProvider` 之前，保证页面首个请求前实例已就绪。
  - mock 的 4xx/401 现以 `AxiosError` 抛出；`VITE_USE_MOCK=false` 可切真实接口。
- 已知非阻断项：mock 数据存于内存，刷新页面即重置（演示场景预期内）。
