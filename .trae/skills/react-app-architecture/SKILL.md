---
name: react-app-architecture
description: fitness-room-react 的前端架构规范（bulletproof-react 裁剪版）。当新增/重构功能、决定文件放哪、设计 API 层或状态、处理错误与权限、审查目录分层时使用。触发词：架构、分层、features、目录结构、API 层、状态管理、错误处理、errorElement、权限。
---

# React 应用架构（fitness-room-react）

本项目架构规范，源自 `alan2207/bulletproof-react` 的 `docs/`，**已裁剪**为本项目栈：React 19 + Vite+ + react-router 8（`createBrowserRouter`）+ antd 6 + axios + zustand 5 + Tailwind 4 + TS 6。

> 规范来源：仓库根 `AGENTS.md`（技术栈 / 目录约定 / 编码规范）为最高优先。本技能是其**展开细则**，冲突时以 `AGENTS.md` 为准。

## 核心原则

**按「功能（feature）」而非「文件类型」组织代码。** 大多数复杂度应封装在 feature 内；跨 feature 复用才上提到 `components/`、`hooks/`、`lib/`。

## 目录结构

```
src/
  app/                 # 应用级配置：路由、Provider、入口
    router.tsx         # createBrowserRouter 路由定义
    provider.tsx       # ConfigProvider 等全局 Provider 装配
  assets/              # 静态资源
  components/          # 跨 feature 复用的通用组件
  config/              # 全局配置常量、环境变量读取
  features/<feature>/  # 按业务领域划分（如 member、order、card）
    api/               # 该 feature 的请求声明与 hooks
    components/        # 该 feature 专用组件
    hooks/             # 该 feature 专用 hooks
    stores/            # 该 feature 的 zustand store（需要时）
    types/             # 该 feature 的类型
    utils/             # 该 feature 工具
    index.ts           # 公共 API（唯一对外出口）
  hooks/               # 跨 feature 复用的 hooks
  lib/                 # 与业务无关的工具/客户端（含 request.ts 的再导出）
  pages/               # 页面：组合 features 与 components
  router/              # 路由集中定义（与 app/router.tsx 配套）
  store/               # 跨 feature 的全局 store（如 auth）
  types/               # 跨 feature 的共享类型
  utils/               # 跨 feature 的共享工具
```

- **页面放 `pages/`，业务逻辑放 `features/`**：页面只做「组装 + 布局」，不放业务实现。
- 路由统一走 `src/router/` 的 `createBrowserRouter`（本项目约定），页面组件在 `pages/` 内实现。

## 边界铁律（最重要）

1. **禁止跨 feature 深层导入**：外部只能 `import { X } from '@/features/member'`（走 `index.ts`），**禁止** `@/features/member/components/...`、`@/features/member/api/...` 等内部路径。
2. 每个 feature 的 `index.ts` 是它的**公共 API**：只导出希望外部使用的内容；内部实现可自由重构而不影响外部。
3. **单向依赖**：`pages` → `features` → `components/hooks/lib`。feature **不得**反向依赖 `pages`，feature 之间**不得**互相深层引用（需要协作时上提到 `components/`/`hooks/`，或经对方 `index.ts`）。
4. **禁止 barrel 滥用**：`index.ts` 只做 feature 出口；不要用大 barrel 聚合全项目（破坏 tree-shaking）。
5. 内部导入可加 `_` 前缀区分（如 `features/member/_components/`）以强调「私有、切勿外部导入」。

## API 层（axios）

- **唯一实例**：`src/api/request.ts` 是全项目唯一 axios 实例与拦截器；**禁止在组件/feature 内 `new axios` 或 `axios.create`**。
- **请求声明集中**：每个 feature 在 `features/<feature>/api/` 内声明该领域的请求函数与查询 hooks，component 不直接拼 URL。
- **响应解包**：拦截器统一解包后端结构（`{ code, data, message }` 之类）为 `data`，业务错误统一抛出，避免每处判断。
- **类型化**：请求函数入参/出参显式标注类型（参见 `typescript-advanced-types` 技能）。

## 状态管理（zustand + URL + 组件）

按「状态归属」分区，就近放置，避免一股脑塞全局：

| 状态类型        | 放置位置                   | 说明                                              |
| --------------- | -------------------------- | ------------------------------------------------- |
| 组件状态        | `useState` / `useReducer`  | 只被单个组件用到的 UI 状态                        |
| 表单状态        | AntD `Form`                | 用 antd Form 托管，**不要**手写受控 state 复制    |
| 应用状态        | zustand                    | 跨组件/跨路由共享的客户端状态（登录态、草稿等）   |
| 服务端缓存/数据 | zustand（或就近请求）      | 本项目**不用 react-query**，改用 zustand 承接缓存 |
| URL 状态        | react-router search params | 分页、筛选、排序等**可分享/可后退**的状态放 URL   |

- 全局状态用 zustand，**避免跨层级层层透传 props**。
- 服务端数据缓存/失效在 zustand 中显式管理（本项目无 react-query，勿臆造 `useQuery`）。

## 错误处理

- **两类错误**分治：
  - **预期错误**（校验失败、业务码）：在提交处就地处理，用 antd `message` / `Alert` 呈现，不抛出。
  - **非预期错误**（异常、崩溃）：交给 **ErrorBoundary** 兜底。
- **多层 ErrorBoundary**：应用根部一层兜底；**每个路由层级**用 `createBrowserRouter` 的 `errorElement` 提供局部兜底，避免单页崩溃拖垮整站。
- 网络/HTTP 错误在 axios 拦截器统一分流（如 401 跳登录、5xx 提示），避免每处重复判断。

## 安全

- **不在前端存敏感凭证**：鉴权统一用 **Bearer Token**（请求头 `Authorization: Bearer <token>`，**不使用 Cookie**）；token 落 localStorage 等前端存储时需评估 XSS 风险。
- **防 XSS**：默认依赖 React 转义，**禁止**对不可信内容使用 `dangerouslySetInnerHTML`；确需富文本则先净化。
- **越权防护**：敏感操作以**后端鉴权为准**，前端权限控制只做体验优化（按钮隐藏/禁用），不作为安全边界。
- **权限模型**：采用 **PBAC（基于权限点）** 优于硬编码 RBAC；集中定义权限点，用统一的 `useAuthorization`/`<Authorized>` 判断（放 `components/` 或全局 hooks）。

## 项目规范

- **命名**：文件与目录用 **kebab-case**；组件用 PascalCase 导出。
- **别名**：统一用 `@/*` 指代 `src/*`（需在 tsconfig + Vite 配置别名；当前若未配置，先补齐再用）。
- **格式化 / Lint / 类型**：由 Vite+ 统一（Oxfmt / Oxlint / tsc），入口是 `pnpm exec vp check`；**不引入** ESLint/Prettier/Husky 的独立配置。
- **样式**：Tailwind 管布局、间距、配色；antd 管交互组件；antd 主题经 `ConfigProvider` 配置，**禁止内联 `style`、禁止覆盖 antd 内部 class**。
- **导入顺序**：内置 → 第三方 → `@/` 别名 → 相对路径；同组内按字母序。

## 测试

- **单元 / 组件**：Vitest + Testing Library；测试与源码就近（`*.test.ts(x)`）。
- **端到端**：Playwright。
- **API mock**：MSW（拦截网络请求），使测试不依赖真实后端。
- 先写测试锁定行为（参见 `tdd` 技能），再实现。

## 性能

- **路由级代码分割**：`createBrowserRouter` 中用 `lazy` 按路由懒加载页面。
- **状态就近**：状态放在「最小需要它的层级」，减少无谓重渲染。
- **组合优于配置**：用 `children` / 组合而非大量布尔 props 传递。
- 更细的 React 优化规则见 `vercel-react-best-practices` 技能（仅取其 React 部分，忽略 Next.js/RSC/SSR 条目）。

## 落地检查清单（新增 feature 时）

- [ ] 在 `src/features/<name>/` 下建目录，按需含 `api/ components/ hooks/ stores/ types/ utils/`
- [ ] 提供 `index.ts`，仅导出公共 API
- [ ] 外部一律 `import { ... } from '@/features/<name>'`
- [ ] 页面放 `pages/`，只做组装
- [ ] 请求走 `src/api/request.ts` 的实例
- [ ] 需要 URL 状态（分页/筛选）的放 search params
- [ ] 路由在 `src/router/` 注册，配 `errorElement`
- [ ] `pnpm exec vp check` 通过
