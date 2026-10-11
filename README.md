# fitness-room-react

健身房会员办卡订单管理模块（前端）。

## 技术栈

React 19 · TypeScript 6 · Vite+ 1.1 · react-router 8（Data Mode）· Ant Design 6 · axios · zustand 5 · Tailwind CSS 4。包管理器为 **pnpm**。

## 快速开始

```bash
pnpm install
pnpm dev        # 本地开发（默认 http://localhost:5173）
pnpm build      # 构建（tsc && vp build）
pnpm test       # 运行测试（Vitest）
pnpm exec vp check   # 格式化 + lint + 类型检查
```

克隆后如恢复 AI 技能，见文末「AI 技能与 MCP」。

## 环境变量

复制 `.env.example` 为 `.env`（已被 `.gitignore` 忽略）：

| 变量                    | 说明                                                           |
| ----------------------- | -------------------------------------------------------------- |
| `VITE_API_BASE_URL`     | 接口基础路径；默认同域 `/api`，可填绝对地址                    |
| `VITE_API_PROXY_TARGET` | 开发代理目标；`vite dev server` 把 `/api` 转发到这里，避免跨域 |

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

架构与编码规范详见 [AGENTS.md](./AGENTS.md) 与技能 `.trae/skills/react-app-architecture/`。

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
