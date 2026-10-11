# fitness-room-react

健身房会员办卡订单管理模块

## AI 技能与 MCP（项目级）

本项目为多人协作，技能与 MCP 一律**项目级固化、随仓库分发**，保证全员环境一致。

### 技能（`.trae/skills/`）

| 技能                                                             | 用途                                                                   |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `react-app-architecture`                                         | 本项目架构规范（feature 分层 / API 层 / 状态 / 错误处理 / 权限），自建 |
| `plan-driven-development`                                        | 开发协作流程（先计划后编码），自建                                     |
| `antd`                                                           | Ant Design 官方技能                                                    |
| `react-router`                                                   | React Router 官方技能（四种模式）                                      |
| `vercel-react-best-practices`                                    | React 性能规范                                                         |
| `tailwind-design-system`                                         | Tailwind v4 写法（CSS-first）                                          |
| `typescript-advanced-types`                                      | TypeScript 高级类型规范                                                |
| `tdd`                                                            | 测试驱动开发流程                                                       |
| `baseline-ui` / `fixing-accessibility` / `web-design-guidelines` | UI 打磨 / 无障碍 / 设计审查                                            |
| `find-skills`                                                    | 元技能（查找与安装技能）                                               |

> 外部来源技能记录在 `skills-lock.json`（`react-app-architecture`、`plan-driven-development` 为自建，不入锁）。

**团队一键恢复**（clone 后执行，读 `skills-lock.json`）：

```bash
npx skills experimental_install
```

### MCP（`.trae/mcp.json`）

包含 Ant Design 官方 MCP（`npx -y @ant-design/cli mcp`）。

启用：Trae `设置 > MCP` → 打开「启用项目级 MCP」。
