# fitness-room-react

健身房会员办卡订单管理模块+设备管理（前端）。

## 技术栈

React 19 · TypeScript 6 · Vite+ 1.1 · react-router 8（Data Mode）· Ant Design 6 · axios · zustand 5 · Tailwind CSS 4。包管理器为 **pnpm**。

## 快速开始

### 前置要求

| 依赖    | 版本要求            | 说明                               |
| ------- | ------------------- | ---------------------------------- |
| Node.js | ≥ 20 （推荐 >= 24） | 运行 `pnpm depcruise` 需 ≥ 24.11.0 |
| pnpm    | ≥ 10 （推荐 >= 12） | 本项目只允许 pnpm，禁止 npm / yarn |

注意：非推荐版本，ci环境可能会导致scripts部分测试命令失效，最低版本只能保证项目dev环境正常运行

### 启动步骤

```bash
pnpm install
pnpm dev        # 本地开发（默认 http://localhost:5173）
pnpm build      # 构建（tsc && vp build）
pnpm test       # 运行测试（Vitest）
pnpm e2e        # E2E 测试（Playwright；首次需 pnpm exec playwright install chromium）
pnpm exec vp check   # 格式化 + lint + 类型检查
pnpm depcruise  # 依赖关系门禁（循环 / 孤立 / 分层）
pnpm cpd        # 重复率门禁（jscpd）
pnpm lhci       # 浏览器性能门禁（Lighthouse CI，需先 pnpm build）
```

克隆后如恢复 AI 技能，见文末「AI 技能与 MCP」。

| 变量                    | 说明                                                                |
| ----------------------- | ------------------------------------------------------------------- |
| `VITE_API_BASE_URL`     | 接口基础路径；默认同域 `/api`，可填绝对地址                         |
| `VITE_API_PROXY_TARGET` | 开发代理目标；`vite dev server` 把 `/api` 转发到这里，避免跨域      |
| `VITE_USE_MOCK`         | 是否启用前端 mock（axios adapter）；默认开启，设 `false` 走后端接口 |

## 部署（GitHub Pages）

线上地址：<https://qihb.github.io/fitness-room-react/>

- **触发**：推送 `main` 自动构建发布，也可在 Actions 页手动触发（`workflow_dispatch`）。工作流见 `.github/workflows/deploy-pages.yml`。
- **首次启用**：仓库 `Settings → Pages → Build and deployment → Source` 需选择 **GitHub Actions**；产物经 artifact 发布，不占用 `gh-pages` 分支。
- **构建参数**：`VITE_BASE_PATH=/fitness-room-react/` 提供子路径 base（静态资源走绝对前缀）；`VITE_USE_MOCK=true` 保持前端 mock，纯静态即可演示。
- **SPA 回退**：构建后把 `index.html` 复制为 `404.html`。history 路由要求任意路径都返回 `index.html`，而 Pages 无服务端重写能力，故由此回退兜底——直达 / 刷新 `/orders` 等深层路由不会 404。
- **本地验证子路径构建**：`VITE_BASE_PATH=/fitness-room-react/ pnpm build`（不传该变量即 `/`，本地开发不受影响）。

## 目录结构

```
src/
├── api/          # 唯一 axios 实例（request.ts）与通用类型（types.ts）
├── features/     # 按业务领域分层；外部只能经 @/features/<feature>（index.ts）导入
├── pages/        # 页面
├── layouts/      # 布局
├── router/       # 路由表（createBrowserRouter）+ 守卫 + ErrorBoundary
├── store/        # 跨 feature 的 zustand store
└── styles/       # Tailwind 分层入口
```

每个 feature 内部按职责再分层（以 `features/order/` 为例）：

```
features/order/
├── api/          # 该领域的请求函数与 hooks（如 get-orders.ts、export-orders.ts）
├── components/   # 领域组件（表格列、搜索栏、弹窗等）
├── hooks/        # 领域行为 hook（如 use-order-actions.ts）
├── types/        # 领域类型
├── utils/        # 领域工具（含 *.test.ts）
├── constants.ts  # 领域常量
└── index.ts      # 唯一对外出口，外部禁止深层导入
```

架构与编码规范详见 [AGENTS.md](./AGENTS.md) 与技能 `.trae/skills/react-app-architecture/`。

## 请求层与状态管理（设计简述）

### 请求层

- **唯一实例**：[`src/api/request.ts`](./src/api/request.ts) 是全项目唯一的 axios 实例，组件与 feature 内**禁止** `new axios` / `axios.create`。`baseURL` 取自 `VITE_API_BASE_URL`（默认 `/api`）。
- **Mock 开关**：默认挂载 axios adapter（`src/api/mock.ts`）返回假数据，`VITE_USE_MOCK=false` 即切回真实后端，应用代码无需改动。
- **拦截器**：请求拦截统一注入 `Authorization: Bearer <token>`（token 来自全局登录态）；响应拦截做**统一错误提示**，调用方不再重复弹提示；`401` 时清登录态并跳回登录页，并做**防抖**（并发失败只处理一次）。
- **归一化**：除 401 外，错误统一转成 `Error` 交给调用方，由页面就地决定展示方式。
- **按领域组织**：每个 feature 在 `features/<feature>/api/` 内声明自己的请求函数与 hooks，不集中在全局 api 目录。

### 状态管理

- **不使用 react-query**，服务端数据的缓存/加载状态由「URL + 通用 hook」承接。
- **URL 是列表状态的唯一事实源**：分页、筛选、排序等**可分享、可后退**的状态写入 URL search params，由 [`src/hooks/use-list-query.ts`](./src/hooks/use-list-query.ts) 收敛「URL ⇄ 查询条件 ⇄ 请求」整条链路；浏览器前进/后退可还原，链接可直接分享。
- **分区原则**：组件局部状态用 `useState`；表单用 antd `Form`；**跨组件/跨 feature 共享**才上 zustand（当前仅 [`src/store/auth.ts`](./src/store/auth.ts) 的登录态与权限点）。
- **登录态**：`token` / `user` 经 `persist` 持久化到 localStorage；**`permissions` 不持久化**，登录与每次刷新按 token 重新获取，避免读到旧权限导致改权限后必须重新登录才生效。

## 订单导出（列表页）【5个Part需求+加分项都已实现】

业务方原话：「列表页帮我们加个导出功能吧，把订单数据导出来给财务对账用，金额格式弄得好看一点。对了，上次权限评审的时候说过，有些状态的订单是不能随便导出的，具体哪些你看着办。」

### 待向业务方澄清的问题（含澄清结论与当前实现）

1. **导出范围与数据量**：导「当前筛选全量 / 当前页 / 勾选项」？数据量多大？

   **不支持全量导出**（订单百万级，全量易崩且有数据安全问题）。
   有勾选则按勾选导出；无勾选时，**「全部」页签限制查询条件**——无查询条件则提示并**拒绝下载**；**其他状态页签不限制查询条件**，但弹确认提示「将导出该状态下全部订单」，用户确认后才下载。**接口层**再对数据量兜底拒绝。

2. **导出字段与隐私**：导出哪些列、顺序？姓名/手机号有隐私要求吗？

   **默认导出全部字段、明文**。

3. **金额「好看」的口径**：给人看的 `¥12,000.00`，还是给 Excel 求和的 `12000.00`？

   **千分位 + 两位小数、不加货币符号**，便于 Excel 求和统计。

4. **「不能随便导出」的状态**：具体哪些状态不可导出？

   状态范围**不确定**，改为**按状态 Tab 配置导出权限**，各 Tab 可独立配置，由业务方自行开通；**默认仅授予「已完成」**。

5. **导出方式**：是需要导出中心（进度，重下），还是直接下载文件？

   （未特别指定）按「浏览器直接下载文件」实现即可。

6. **导出留痕**：要不要保留导出记录、操作留痕？

   **留痕由后端实现**，前端无法留痕

7. **文件名规范**：文件名叫什么？

   按 **Tab 状态 + 导出时间 + 操作人** 组合。

### 权限配置（联调 / 测试用）

导出权限点集中在 [`src/lib/permissions.ts`](./src/lib/permissions.ts)：当前仅含 `ORDER_EXPORT_COMPLETED`（已完成）。**测试其他 Tab 的导出，改 `MOCK_USER_PERMISSIONS` 加上对应权限点即可**（如加 `PERMISSION.ORDER_EXPORT_ALL`）。

## 开发中遇到的最难的问题

业务开发本身没有问题，难点更多集中在工程化的配置与环境差异上。

### 一、CI 环境与本地不一致

**问题**：本地各项指标（`vp check` / 测试 / `depcruise` / `cpd` / `lhci`）全绿，推到 CI 却在装依赖或跑门禁时失败。根因是**两端工具链版本不一致**（如本机 pnpm 10、CI 按 `devEngines` 用 pnpm 12，后者新增 `minimumReleaseAge` 冷却期门禁），同一份 lockfile / 配置在两边表现不同。

**解决过程**：

1. 逐项对齐两端环境，定位差异来自**工具版本**而非代码：pnpm 版本、Chrome 路径、Lighthouse 就绪探针的输出解析等。
2. 用**与 CI 同版本的工具链本地复现**（如 `pnpm exec vp install` 走 vp 自带 pnpm 12），确认为环境问题而非 CI 独有。
3. 按版本差异逐个适配（把依赖降到冷却窗内、按平台解析 Chrome 路径、改用无色输出做探针），并在门禁下重解析 lockfile。

**收获**：在本地用**与 CI 同版本的工具链**复现，比在 CI 上盲试快得多。

## 开发工具与使用环节

| 环节                           | 工具 / 技能                                                                                           |
| ------------------------------ | ----------------------------------------------------------------------------------------------------- |
| 开发编辑器                     | Trae IDE（集成 AI 编码代理、终端、Git、内置浏览器调试）                                               |
| AI 模型                        | 编辑器内置 AI 编码代理（对话式编码），贯穿需求澄清、方案设计、编码、测试与排错                        |
| 需求澄清与方案设计             | 对话式澄清 + 技能 `plan-driven-development`（先计划后编码、逐步交付）                                 |
| 脚手架与架构落地               | 技能 `react-app-architecture`（feature 分层 / API 层 / 状态 / 错误处理 / 权限）                       |
| UI 组件与后台布局              | 技能 `ant-design`、`antd` + 项目级 Ant Design MCP（`@ant-design/cli mcp`，查组件 API / token / 示例） |
| 路由与访问控制                 | 技能 `react-router`（Data Mode 路由 / 守卫）                                                          |
| 规范约束（性能 / 类型 / 样式） | 技能 `vercel-react-best-practices`、`typescript-advanced-types`、`tailwind-design-system`             |
| UI 打磨与无障碍                | 技能 `baseline-ui`、`fixing-accessibility`、`web-design-guidelines`                                   |
| 测试                           | 技能 `tdd`；`pnpm test`（Vitest）、`pnpm e2e`（Playwright）                                           |
| 静态质量门禁                   | `pnpm exec vp check`（Oxfmt / Oxlint / tsc）、`pnpm depcruise`、`pnpm cpd`                            |
| 性能门禁                       | `pnpm lhci`（Lighthouse CI）                                                                          |
| 浏览器实测与调试               | 浏览器实机走查（Chrome / DevTools 控制台与网络排查）+ Playwright 用例                                 |
| 构建与 CI                      | Vite+（`vp dev` / `vp build`）、GitHub Actions（`voidzero-dev/setup-vp`）                             |

> 技能与 MCP 一律项目级固化、随仓库分发，清单与恢复方式见下一节。

## AI 技能与 MCP（项目级）

本项目为多人协作，技能与 MCP 一律**项目级固化、随仓库分发**，保证全员环境一致。

### 技能（`.trae/skills/`）

| 技能                                                             | 用途                                                                     |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `react-app-architecture`                                         | 本项目架构规范（feature 分层 / API 层 / 状态 / 错误处理 / 权限），自建   |
| `plan-driven-development`                                        | 开发协作流程（先计划后编码），自建                                       |
| `ant-design`                                                     | antd v6 + Ant Design Pro 5 + ProComponents 决策指南（管理后台布局/CRUD） |
| `antd`                                                           | Ant Design 官方 CLI 技能（组件 API/token/迁移查询）                      |
| `react-router`                                                   | React Router 官方技能（四种模式）                                        |
| `vercel-react-best-practices`                                    | React 性能规范                                                           |
| `tailwind-design-system`                                         | Tailwind v4 写法（CSS-first）                                            |
| `typescript-advanced-types`                                      | TypeScript 高级类型规范                                                  |
| `tdd`                                                            | 测试驱动开发流程                                                         |
| `baseline-ui` / `fixing-accessibility` / `web-design-guidelines` | UI 打磨 / 无障碍 / 设计审查                                              |
| `find-skills`                                                    | 元技能（查找与安装技能）                                                 |

> 外部来源技能记录在 `skills-lock.json`（`react-app-architecture`、`plan-driven-development` 为自建，不入锁）。

**团队一键恢复**（clone 后执行，读 `skills-lock.json`）：

```bash
npx skills experimental_install
```

### MCP（`.trae/mcp.json`）

包含 Ant Design 官方 MCP（`npx -y @ant-design/cli mcp`）。

启用：Trae `设置 > MCP` → 打开「启用项目级 MCP」。
