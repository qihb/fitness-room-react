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
pnpm e2e        # E2E 测试（Playwright；首次需 pnpm exec playwright install chromium）
pnpm exec vp check   # 格式化 + lint + 类型检查
pnpm depcruise  # 依赖关系门禁（循环 / 孤立 / 分层）
pnpm cpd        # 重复率门禁（jscpd）
pnpm lhci       # 浏览器性能门禁（Lighthouse CI，需先 pnpm build）
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

## 订单导出（列表页）

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
