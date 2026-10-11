# 异常页放入内容区 · 落地计划

**目标**：异常页与错误边界按登录态区分 —— 未登录全屏兜底；已登录统一渲染在后台内容区（保留菜单/顶栏/面包屑规则）；已登录不得再停留 / 返回登录页。
**技术栈**：见 AGENTS.md（React 19 / react-router 8 / antd 6 / Tailwind 4），包管理器 pnpm。
**涉及文件**：

- 改：`src/router/index.tsx`（主）
- 改：`src/layouts/basic-layout.tsx`（面包屑显隐 + 菜单选中）
- 改：`src/router/guard.tsx`（新增 `GuestOnly` 登录态互斥守卫）

**关键决策**：

1. ✅ 未登录优先跳登录：`/403`、`/500`、404 均在登录守卫之后，未登录直访先跳 `/login`。
2. ✅ 异常 / 未知路由隐藏面包屑，并清空菜单选中。
3. ✅ 已登录访问 `/login` 一律重定向回后台（`/`），不再停留登录页。

**执行约定**：本文件仅为计划；由用户指定步骤后再执行，每完成一步勾选 `- [ ]` 并更新「当前状态」。

---

## 需求 → 落点

| 需求                                    | 落点                                                        |
| --------------------------------------- | ----------------------------------------------------------- |
| 未登录崩溃 → 全屏                       | `/login`、`/`（RequireAuth）层保留 `ErrorBoundary`          |
| 已登录异常 → 内容区（保留菜单/顶栏）    | `BasicLayout` 内新增内容区兜底路由（`ErrorBoundary`）       |
| `/403`、`/500`、404 进内容区            | 由顶层路由迁为内容区兜底路由的 children                     |
| 异常 / 未知路由隐藏面包屑、清空菜单选中 | `basic-layout.tsx`                                          |
| 已登录不得回到 `/login`                 | `src/router/guard.tsx` 新增 `GuestOnly` + `/login` 路由改造 |

## 关键机制

react-router 的 `ErrorBoundary` 会**替换其所在路由的整棵子树**：

- 挂 `BasicLayout` 路由上 → 替换整个布局（当前问题根因，全屏）。
- 挂布局**内部**一层 pathless 兜底路由上 → 渲染于 `BasicLayout` 的 `<Outlet/>` 位置 → 内容区，布局保留。

## 阶段 A · 路由重构（`src/router/index.tsx`）

- [x] A.1 删除顶层 `/403`、`/500`、`*` 三条路由
- [x] A.2 `BasicLayout` 内新增内容区兜底路由（pathless，`ErrorBoundary` + 隐式 `Outlet`），children：`index→/orders`、`orders`、`orders/new`、`403`、`500`、`*`(404)
- [x] A.3 摘除 `BasicLayout` 路由上的 `ErrorBoundary`；保留 `/login`、`/`（RequireAuth）的全屏兜底

## 阶段 B · 布局适配（`src/layouts/basic-layout.tsx`）

- [x] B.1 仅订单路由（`/orders`、`/orders/new`）显示面包屑，其余隐藏
- [x] B.2 非订单路由清空 `Menu` 选中（避免在异常页误高亮「订单列表」）

## 阶段 C · 校验

- [x] C.1 `pnpm exec vp check` + `pnpm exec vp test`
- [x] C.2 浏览器走查：已登录访问 `/500`、乱路径 → 内容区；未登录访问 → 跳登录

## 阶段 D · 已登录不得回到 `/login`（追加需求）

- [x] D.1 `guard.tsx` 新增 `GuestOnly`：有 token → `<Navigate to="/" replace />`，否则渲染 `<Outlet/>`
- [x] D.2 `/login` 路由改为 `Component: GuestOnly`，登录页作为其子路由（保留 `ErrorBoundary` 全屏兜底）
- [x] D.3 校验：已登录访问 `/login` → 跳后台；未登录访问 `/login` 正常；`vp check` / `vp test`、浏览器走查

---

## 当前状态

- 阶段 A、B、C 全部完成。
- 校验：`pnpm exec vp check` 全绿（49 文件格式 + 29 文件零告警）；`pnpm exec vp test` 4 passed。
- 浏览器走查（localhost:5180）：
  - 未登录访问 `/orders` → 重定向 `/login`（全屏，无菜单/顶栏）。
  - 已登录访问 `/500`、`/403`、`/foo/bar` → 均渲染在内容区，保留左侧菜单 + 顶栏，无面包屑。
  - 已登录访问 `/orders` → 正常显示面包屑「订单列表」（对比项）。
- 备注：走查期间 `basic-layout.tsx` 被并发编辑（顶栏改为折叠按钮 + 用户名、Sider `collapsedWidth` 改 80），本计划的面包屑显隐与菜单选中改动仍在，合并后 `vp check` 通过。
- 阶段 D 已完成：`guard.tsx` 新增 `GuestOnly`，`/login` 路由改由其守卫；已登录访问 `/login` 一律跳回 `/orders`。
  - 校验：`vp check` 全绿（49 文件格式 + 29 文件零告警）；`vp test` 4 passed。
  - 浏览器走查（localhost:5181）：未登录 `/login` 正常显示；已登录访问 `/login` 两次均重定向到 `/orders`；浏览器后退也不会回到登录页。
