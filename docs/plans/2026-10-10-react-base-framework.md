# React 基础框架 · 落地计划

**目标**：把 vanilla Vite+ 脚手架改造成 React 管理后台基础框架。
**技术栈**：见 AGENTS.md（React 19 / Vite+ 1.1 / react-router 8 / antd 6 / axios 1.20 / zustand 5 / Tailwind 4）。
**涉及文件**：改 `package.json` / `pnpm-workspace.yaml` / `vite.config.ts` / `tsconfig.json` / `index.html` / `README.md` / `AGENTS.md`；增 `src/main.tsx`、`src/App.tsx`、`src/styles/`、`src/layouts/`、`src/router/`、`src/api/`、`src/store/`、`src/pages/`、`.env` / `.env.example`；删 `src/main.ts`、`src/counter.ts`、`src/style.css`、`src/assets/`。
**关键决策**：见「当前状态 → 待确认决策」（沙箱放行 `~/Library/pnpm/_tmp_*`）。
**执行约定**：本文件仅为计划；**由用户指定步骤后再执行**，每完成一步勾选 `- [ ]`。

---

## 阶段 0 · React 化地基

- [x] 0.1 安装 React 及依赖（补全 `pnpm-workspace.yaml` catalog）（已完成：新增 `@vitejs/plugin-react` / `@tailwindcss/vite` / `tailwindcss` / `@types/react` / `@types/react-dom` / `@types/node` / `@ant-design/icons` / `dayjs`）
- [x] 0.2 配置 Vite：React 插件 / `@` 别名 / `server.proxy` / lint 启用 react
- [x] 0.3 `tsconfig` 开 JSX 与别名（`.tsx`、`@/*` → `./src/*`）；`index.html` 挂载点改 `#root`；加 `vite-env.d.ts`
- [x] 0.4 新建 `src/main.tsx`、`src/App.tsx`；删除 vanilla 残留（main.ts/counter.ts/style.css/assets）
- [x] 0.5 验证：`pnpm exec vp check` 通过 + 首屏渲染（dev server 返回 React 入口，JSX 转换正常）

## 阶段 1 · 样式与 UI 基座

- [x] 1.1 接入 Tailwind 4 + 处理与 antd 的 preflight 冲突（`src/styles/index.css`）
- [x] 1.2 安装 antd、`@ant-design/icons`、dayjs（已随 0.1 声明并安装）
- [x] 1.3 `App` 挂 `ConfigProvider`（主题 token + zh-CN locale + Layout token）

## 阶段 2 · 引入 Demo（每框架一个最小示例）

- [x] 2.1 React 组件（`src/features/demo/components/counter-card.tsx`）
- [x] 2.2 Tailwind 布局（`src/pages/demo/index.tsx` 的 flex/grid 布局 + 各示例类）
- [x] 2.3 antd 组件（CounterCard / MemberPreview 使用 Card/Space/Statistic/Table 等）
- [x] 2.4 react-router 跳转（Demo 页 `Link` + `useNavigate`）
- [x] 2.5 zustand store（`src/features/demo/stores/use-counter-store.ts`）
- [x] 2.6 axios 请求（`MemberPreview` 经 `@/features/member` 取数，含 loading / 错误 Alert）

## 阶段 3 · 页面结构骨架

- [x] 3.1 `src/layouts/basic-layout.tsx`（侧边栏 + 顶栏 + 内容区，含用户下拉/退出）
- [x] 3.2 页面占位：dashboard / member / order / settings / login / not-found（另含 demo）
- [x] 3.3 路由表 `src/router/index.tsx`（createBrowserRouter + 懒加载 + 404 + errorElement）
- [x] 3.4 `ErrorBoundary`（`src/router/error-boundary.tsx`）+ 路由守卫骨架 `src/router/guard.tsx`（配 `src/store/auth.ts`）

## 阶段 4 · 网络请求层

- [x] 4.1 `src/api/request.ts`：axios 实例 + token/响应拦截器 + 错误归一化（`baseURL` 读 `VITE_API_BASE_URL`，token 取 `@/store/auth` 全局登录态）
- [x] 4.2 `src/api/types.ts`：`ApiResponse<T>` / `PageResult<T>`
- [x] 4.3 示例业务接口（按 feature 规范落在 `features/member/api/get-members.ts`，返回 `PageResult<Member>`；分页示例：会员页 + Demo 预览同步适配）
- [x] 4.4 `.env.example`（`VITE_API_BASE_URL` / `VITE_API_PROXY_TARGET`）+ proxy 验证（`vite.config.ts` 改用 `loadEnv` 读 `.env`；实测 `/api/*` 被转发而非回落 HTML）

## 阶段 5 · 收尾与沉淀

- [x] 5.1 Vitest 配置 + 示例测试（`vite.config.ts` 加 `test` 块；示例测试 `use-counter-store.test.ts`；`pnpm test` 通过）
- [x] 5.2 更新 README / AGENTS；`vp check` 与 `vp test` 全绿（README 补技术栈/快速开始/环境变量/目录结构；AGENTS 常用命令补测试项；`package.json` 加 `test` 脚本）
- [x] 5.3 把"分阶段开发 + 更新文档"沉淀为技能（已完成：`.trae/skills/plan-driven-development`）

---

## 当前状态

- **执行范围（用户确认）**：阶段 0→5 全部执行；与已有骨架文件**保留并融合**、对齐 feature 规范；依赖直接安装。
- **阶段 0 已完成**：依赖装齐（`pnpm install` 未再被沙箱拦截）、Vite/tsconfig/index.html 配置就绪、React 入口跑通、`vp check` 全绿、首屏渲染正常。
  - 决策落定：启用 oxlint `react` 插件需**显式列全默认插件**（`eslint`/`typescript`/`unicorn`/`oxc`），否则会覆盖默认集。
  - 因 `lint.options.typeCheck` 会检查 `vite.config.ts`，补装 `@types/node` 并在 tsconfig `types` 加入 `node`。
  - tsgolint（TS7）已移除 `baseUrl`；别名改用无 baseUrl 的相对写法 `"@/*": ["./src/*"]`。
- **阶段 1–3 已完成**：Tailwind4 + antd 基座、Demo（组件/Tailwind/antd/router/zustand/axios）、页面骨架（BasicLayout/路由表/守卫/ErrorBoundary）；`vp check` 全绿、`pnpm build` 通过、浏览器 6 步验证通过。
- **阶段 4 已完成**：唯一 axios 实例（读 `VITE_API_BASE_URL`、注入 `Bearer` token、错误归一化）、`src/api/types.ts`（`ApiResponse<T>`/`PageResult<T>`）、会员分页示例接口、`.env.example` + `loadEnv` 驱动的 dev proxy；`vp check` 全绿、`pnpm build` 通过、proxy 实测生效。
  - 融合决策：示例接口按 feature 规范落在 `features/member/api/`（不新建 `src/api/modules/`）；`getMembers` 返回 `PageResult<Member>`，会员页与 Demo 预览同步适配（会员页表格接入 `total`）。
  - `.env` 未落盘（已 gitignore，代码默认值即可运行）；`.env.example` 为模板。
- **阶段 5 已完成**：Vitest 接入（`test` 块 + 示例测试 `use-counter-store.test.ts`）、README/AGENTS 补全、`package.json` 加 `test` 脚本；`vp check`（38 文件格式 + 26 文件零告警）与 `pnpm test`（2 passed）全绿。
- **结论**：阶段 0→5 全部完成，React 管理后台基础框架落地完毕。
