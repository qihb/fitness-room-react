# 登录鉴权 + 订单后台 · 落地计划

**目标**：从现有骨架收敛出一个可跑闭环 —— 登录鉴权（mock）→ 订单列表 → 新建订单，含后台布局（菜单/顶栏/面包屑）与路由守卫。
**技术栈**：见 AGENTS.md（React 19 / Vite+ / react-router 8 / antd 6 / axios / zustand 5 / Tailwind 4）。
**执行约定**：本文件仅为计划；**由用户指定步骤后再执行**，每完成一步勾选 `- [ ]`。

---

## 需求 → 实现对照

| 需求                                                                   | 落点                                                                  |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------- |
| 路由：`/login`、`/orders`、`/orders/new`、未匹配 404                   | `src/router/index.tsx` + `src/pages/{login,order/·,not-found}`        |
| 布局：左菜单（订单列表/新建订单）、顶栏（用户名/退出）、面包屑、内容区 | `src/layouts/basic-layout.tsx`                                        |
| 模拟登录：任意账密成功、mock token 存 localStorage、zustand 管理       | `src/store/auth.ts`（zustand `persist`）+ `src/pages/login/index.tsx` |
| 路由守卫：未登录 → `/login`；退出清 token → 登录页                     | `src/router/guard.tsx` + `basic-layout` 退出项                        |

## 涉及文件

- 改：`src/router/index.tsx`、`src/layouts/basic-layout.tsx`、`src/store/auth.ts`、`src/api/request.ts`、`src/pages/order/index.tsx`、`src/vite-env.d.ts`、`.env.example`、`src/App.tsx`（增 antd `<App>` 以承载 message 上下文）
- 增：`src/features/order/`（`types/order.ts`、`api/get-orders.ts`、`api/create-order.ts`、`utils/format.ts` + `format.test.ts`、`index.ts`）、`src/pages/order/new.tsx`、`src/api/mock.ts`
- 删：`src/pages/{dashboard,member,settings,demo}/`、`src/features/{demo,member}/`（既有示例）

## 已定决策

1. **精简**：菜单只留「订单列表 / 新建订单」；既有 `dashboard/member/settings/demo` 的路由、菜单、页面与 feature 文件一并移除（删除示例后补 1 个订单层单测，保证 `vp test` 仍有用例）。
2. **mock 接口**：零依赖 —— `src/api/mock.ts` 用 axios **自定义 adapter** 短路 `/orders` 请求，按 `VITE_USE_MOCK` 开关（默认开）。
3. **404 不受守卫**：`*` 作公开路由（未匹配 → 404 页），不触发登录重定向。

---

## 阶段 0 · 路由收敛

- [x] 0.1 路由表：`/login`（公开）；`/`（`RequireAuth` + `BasicLayout`）下 `index → 重定向 /orders`、`orders`、`orders/new`；`*` → 404
- [x] 0.2 摘除 dashboard/member/settings/demo 路由与菜单；删除对应页面与 feature 文件

## 阶段 1 · 登录与路由守卫

- [x] 1.1 `store/auth.ts`：`persist`（key `fitness-room-auth`）→ token 落 localStorage；`login(username)` 写 mock token + 用户名，`logout()` 清空
- [x] 1.2 `guard.tsx`：未登录 → `/login` 并带 `from`；`login` 页登录后按 `from` 回跳
- [x] 1.3 顶栏「退出登录」：清 token → `/login`

## 阶段 2 · features/order（数据层）

- [x] 2.1 `types/order.ts`：`Order` / `OrderStatus` / `OrderListParams` / `CreateOrderInput`
- [x] 2.2 `api/get-orders.ts`（GET `/orders`，`PageResult<Order>`）、`api/create-order.ts`（POST `/orders`）
- [x] 2.3 `utils/format.ts` + 单测（状态/金额格式化），`index.ts` 汇总出口

## 阶段 3 · mock 接口

- [x] 3.1 `src/api/mock.ts`：axios 自定义 adapter，内置 `/orders` GET（分页）/ POST（创建）假数据
- [x] 3.2 `request.ts` 按 `VITE_USE_MOCK` 挂载 adapter；`.env.example` 增 `VITE_USE_MOCK`

## 阶段 4 · 订单页面

- [x] 4.1 列表页 `pages/order/index.tsx`：antd Table + 分页（分页放 URL search params）+「新建订单」入口
- [x] 4.2 新建页 `pages/order/new.tsx`：antd Form（客户/商品/金额/备注），提交成功 `message` 提示并回列表

## 阶段 5 · 后台布局

- [x] 5.1 菜单：「订单列表 `/orders`」「新建订单 `/orders/new`」；顶栏保留用户名 + 退出
- [x] 5.2 内容区顶部 antd `Breadcrumb`（`/orders` → 订单列表；`/orders/new` → 订单列表 / 新建订单）

## 阶段 6 · 校验

- [x] 6.1 `pnpm exec vp check` + `pnpm exec vp test`（check 全绿；`format.test` 2 passed）
- [x] 6.2 浏览器走查：未登录访问 `/orders` → `/login`；登录 → 回列表；新建 → 列表可见；退出 → `/login`；乱路径 → 404（全部通过）

---

## 当前状态

- **全部阶段 0→6 已完成**，需求 4 条全部落地。
- 校验：`pnpm exec vp check` 全绿（35 文件格式 + 22 文件零告警）；`pnpm exec vp test` 2 passed；浏览器端到端走查 6/6 通过。
- 额外修复：新建页原用 antd `message` 静态方法会触发 `[antd: message] Static function can not consume context` 告警 → 在 `App.tsx` 加 `<App>` 包裹、新建页改用 `App.useApp()`，告警消失；退出下拉开菜单由 hover 改为 `trigger={["click"]}`。
- 已知非阻断项：视口 <992px 时 antd `Sider`（`breakpoint="lg" collapsedWidth="0"`）自动收起为 0 宽（既有配置，桌面宽度正常）；react-router 提示未配 `HydrateFallback`（不影响）。
