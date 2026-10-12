# fitness-room-react

健身房管理后台前端。基于 React + Vite+ + Ant Design，包管理器为 pnpm。

## 技术栈

| 分类      | 选型         | 版本 |
| --------- | ------------ | ---- |
| 框架      | React        | 19.3 |
| 语言      | TypeScript   | 6.0  |
| 构建      | Vite+        | 1.1  |
| 路由      | react-router | 8.4  |
| UI 组件库 | Ant Design   | 6.6  |
| HTTP 请求 | axios        | 1.20 |
| 全局状态  | zustand      | 5.0  |
| 样式方案  | Tailwind CSS | 4.3  |

## 常用命令

- 安装依赖：`pnpm install`
- 本地开发：`pnpm dev`
- 构建：`pnpm build`（即 `tsc && vp build`）
- 测试：`pnpm test`（即 `vp test`，Vitest；测试文件 `src/**/*.test.{ts,tsx}`）
- E2E 测试：`pnpm e2e`（Playwright；用例在 `e2e/`，首次需 `pnpm exec playwright install chromium`；`pnpm e2e:ui` 打开调试 UI；`pnpm test` 与 E2E 互不影响）
- 依赖关系门禁：`pnpm depcruise`（dependency-cruiser；循环 / 孤立 / 分层守卫；配置 `.dependency-cruiser.cjs`，需 Node ≥22）
- 重复率门禁：`pnpm cpd`（jscpd；阈值见 `.jscpd.json`）
- 浏览器性能门禁：`pnpm lhci`（Lighthouse CI；需先 `pnpm build` 并具备可用 Chrome，配置 `.lighthouserc.cjs`）
- 校验（格式化 + lint + 类型）：`pnpm exec vp check`
- 已安装全局 Vite+ CLI 时可直接用 `vp dev` / `vp check` 等；未安装时改用 `pnpm exec vp <command>`。
- 只允许使用 pnpm，禁止 npm / yarn。

## 目录约定

- `src/features/<feature>/`：**按业务领域分层**（`api/`、`components/`、`hooks/`、`stores/`、`types/`、`utils/`），并以 `index.ts` 作为唯一对外出口。
- `src/router/`：路由集中定义，使用 react-router 数据路由 `createBrowserRouter`。
- `src/pages/`：页面；`src/layouts/`：布局；`src/components/`：通用组件。
- `src/api/request.ts`：唯一的 axios 实例与拦截器，禁止在组件内直接 `new axios`。
- `src/store/`：按业务领域拆分的 zustand store。
- 组件统一为函数组件，文件扩展名使用 `.tsx`。

## 架构规范

代码**按功能（feature）而非文件类型组织**，详见项目技能 `.trae/skills/react-app-architecture/`。

- **feature 边界**：外部只能经 `@/features/<feature>`（即其 `index.ts`）导入，**禁止**深层导入 `features/<feature>/components|api/...`。
- **单向依赖**：`pages` → `features` → `components/hooks/lib`；feature 不反向依赖 `pages`，feature 间不深层互引。
- **API 层**：请求一律走 `src/api/request.ts` 的唯一实例；每个 feature 在 `features/<feature>/api/` 声明自己的请求与 hooks。
- **状态分区**：组件状态用 `useState`；表单用 antd `Form`；跨组件共享用 zustand；**可分享/可后退**的状态（分页、筛选、排序）放 URL search params。本项目用 zustand 承接服务端缓存，**不使用 react-query**。
- **错误处理**：预期错误就地用 antd `message`/`Alert` 处理；非预期错误用 `createBrowserRouter` 的 `errorElement` 按路由层级多层兜底。
- **权限**：以前端只做体验、后端鉴权为准；采用基于权限点（PBAC）的集中判断。
- **命名**：文件/目录 kebab-case；`@/*` 指代 `src/*`。

## 编码规范

- Tailwind 负责布局、间距、配色；Ant Design 负责交互型组件。
- Ant Design 主题统一经 `ConfigProvider` 配置，禁止写内联 `style`，禁止覆盖 antd 内部 class。
- 全局状态用 zustand，避免跨层级层层透传 props。

## 项目级配置优先（技能 / MCP）

本项目为**多人协作**，目标：**同一仓库、同一套技能与 MCP，保证 AI 输出一致**。

- **一律项目级固化**：团队需要的技能装到 `.trae/skills/`，并提交 `skills-lock.json`；队友 clone 后执行 `npx skills experimental_install` 恢复。
- **判据**：以「团队能否随仓库稳定复现」为准，**而非**「本机是否已可用」。
- **不得以"全局已有"为由跳过**：`~/.trae/plugins/`（plugin）、`~/.trae/skills/` 等**用户级配置不进仓库**，队友拿不到，**不能替代项目级配置**。
- **MCP 同样适用**：必需 MCP 需随仓库分发（若 Trae 支持项目级 MCP 配置）；不支持时，须在 README/AGENTS.md 固化「必装 MCP 清单 + 参数」作为人工同步项。
- **同名并存**：全局与项目级同名技能并存可能重复触发，属可接受代价，**不作为删除项目级配置的理由**。

## 边界（不要修改）

- `dist/`、`node_modules/`、`pnpm-lock.yaml`。
- 本文件中 `<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Built-in Commands vs Scripts

`vp <name>` runs a built-in command. `vp run <name>` runs a `package.json` script or a `vite.config.ts` task. Scripts cannot overwrite built-ins, so `vp dev` and `vp run dev` may do different things. Check `package.json` and `vite.config.ts` first, and run `vp run <name>` when the project defines a script or task with that name.

## Tool Versions

Run `vp toolchain` to show versions and relationships in the active Vite+
release. Add a tool name to select part of the graph. For example, run
`vp toolchain vite`. Use `--global` to ignore the local `vite-plus` package. Use
`vp why <package>` to show the package-manager dependency graph.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->` 之间的自动生成段落。

## 提交规范

- 提交前必须通过 `pnpm exec vp check`；pre-commit 已配置 `vp staged`，会自动格式化与 lint。

## 命令不可用时（重要）

若终端命令无法运行（`command not found` / 报错 / 不可用）：

- **禁止臆测**：不要推断"环境没装 / 工具缺失 / 依赖不全"，也不要输出长篇猜测。
- **只陈述事实**：说清①哪条命令不行（完整原文）②这条命令是做什么的 ③报错原文，由用户自行判断其环境。
- 环境可能**早已装好**，只是当前会话环境未刷新——例如**重启编辑器**即可恢复，不得轻易下"未安装"结论。
- 如需继续，只给最小验证方式（如重启编辑器后重试、改用 `pnpm exec <tool>`），不代替用户下结论。

## 开发协作流程（重要）

- **先计划后编码**：接到任务先产出简要计划（目标 / 步骤清单 / 涉及文件），等用户**明确确认**后再动手，禁止"出计划即落地代码"。
- **计划要简要**：尽量一屏读完，只列步骤与关键点，不贴大段代码、不写长篇背景。
- **按步执行**：用户确认计划后，由用户**指定**要执行哪几个步骤，只做被指定的步骤，不擅自扩大范围。
- **逐步交付**：大任务拆成小步骤，每完成一步更新计划/落地文档（勾选 + 备注）。
- **有疑问先确认**：计划阶段遇到需要决策的点，先问用户确认后再写进计划。

<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Built-in Commands vs Scripts

`vp <name>` runs a built-in command. `vp run <name>` runs a `package.json` script or a `vite.config.ts` task. Scripts cannot overwrite built-ins, so `vp dev` and `vp run dev` may do different things. Check `package.json` and `vite.config.ts` first, and run `vp run <name>` when the project defines a script or task with that name.

## Tool Versions

Run `vp toolchain` to show versions and relationships in the active Vite+
release. Add a tool name to select part of the graph. For example, run
`vp toolchain vite`. Use `--global` to ignore the local `vite-plus` package. Use
`vp why <package>` to show the package-manager dependency graph.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->
