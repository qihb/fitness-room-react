# React 基础框架 · 落地计划

**目标**：把 vanilla Vite+ 脚手架改造成 React 管理后台基础框架。
**技术栈**：见 AGENTS.md（React 19 / Vite+ 1.1 / react-router 8 / antd 6 / axios 1.20 / zustand 5 / Tailwind 4）。
**涉及文件**：改 `package.json` / `pnpm-workspace.yaml` / `vite.config.ts` / `tsconfig.json` / `index.html` / `README.md` / `AGENTS.md`；增 `src/main.tsx`、`src/App.tsx`、`src/styles/`、`src/layouts/`、`src/router/`、`src/api/`、`src/store/`、`src/pages/`、`.env` / `.env.example`；删 `src/main.ts`、`src/counter.ts`、`src/style.css`、`src/assets/`。
**关键决策**：见「当前状态 → 待确认决策」（沙箱放行 `~/Library/pnpm/_tmp_*`）。
**执行约定**：本文件仅为计划；**由用户指定步骤后再执行**，每完成一步勾选 `- [ ]`。

---

## 阶段 0 · React 化地基

- [ ] 0.1 安装 React 及依赖（补全 `pnpm-workspace.yaml` catalog）（部分完成，见当前状态）
- [ ] 0.2 配置 Vite：React 插件 / `@` 别名 / `server.proxy` / lint 启用 react
- [ ] 0.3 `tsconfig` 开 JSX 与别名；`index.html` 挂载点改 `#root`；加 `vite-env.d.ts`
- [ ] 0.4 新建 `src/main.tsx`、`src/App.tsx`；删除 vanilla 残留（main.ts/counter.ts/style.css/assets）
- [ ] 0.5 验证：`pnpm exec vp check` 通过 + 首屏渲染

## 阶段 1 · 样式与 UI 基座

- [ ] 1.1 接入 Tailwind 4 + 处理与 antd 的 preflight 冲突（`src/styles/index.css`）
- [ ] 1.2 安装 antd、`@ant-design/icons`、dayjs
- [ ] 1.3 `App` 挂 `ConfigProvider`（主题 token + zh-CN locale）

## 阶段 2 · 引入 Demo（每框架一个最小示例）

- [ ] 2.1 React 组件
- [ ] 2.2 Tailwind 布局
- [ ] 2.3 antd 组件
- [ ] 2.4 react-router 跳转
- [ ] 2.5 zustand store
- [ ] 2.6 axios 请求

## 阶段 3 · 页面结构骨架

- [ ] 3.1 `src/layouts/BasicLayout.tsx`（侧边栏 + 顶栏 + 内容区）
- [ ] 3.2 页面占位：dashboard / member / order / settings / login / not-found
- [ ] 3.3 路由表 `src/router/index.tsx`（createBrowserRouter + 懒加载 + 404 + errorElement）
- [ ] 3.4 `ErrorBoundary` + 路由守卫骨架 `src/router/guard.tsx`

## 阶段 4 · 网络请求层

- [ ] 4.1 `src/api/request.ts`：axios 实例 + token/响应拦截器 + 错误提示
- [ ] 4.2 `src/api/types.ts`：`ApiResponse<T>` / `PageResult<T>`
- [ ] 4.3 `src/api/modules/member.ts`：示例业务接口
- [ ] 4.4 `.env` / `.env.example`（`VITE_API_BASE_URL`）+ 验证 proxy

## 阶段 5 · 收尾与沉淀

- [ ] 5.1 Vitest 配置 + 示例测试（`pnpm exec vp test` 通过）
- [ ] 5.2 更新 README / AGENTS；`vp check` 与 `vp test` 全绿
- [x] 5.3 把"分阶段开发 + 更新文档"沉淀为技能（已完成：`.trae/skills/plan-driven-development`）

---

## 当前状态

- 计划待用户确认；确认后按指定步骤执行。
- **待确认决策**：依赖安装命令曾被沙箱拦截（`~/Library/pnpm/_tmp_*`）；是否放行该路径，或改用 `pnpm exec` 重试，需用户确认后再执行阶段 0.1。
- 阶段 0.1 已部分执行并**确认保留**：`package.json` 已加 react/react-dom/react-router/antd/axios/zustand（catalog:），catalog 已补全。仍缺：`@types/react`、`@types/react-dom`、`@vitejs/plugin-react`、`@tailwindcss/vite`、`@ant-design/icons`、`dayjs`（阶段 0.1/1.2 补装）。
