# AI 技能接入 · 落地计划

**目标**：把社区 AI 技能 + bulletproof-react 架构规范接入本项目，让后续 AI 开发「快、且在规范内」。
**技术栈**：见 AGENTS.md（React 19 / Vite+ / react-router 8 / antd 6 / axios / zustand 5 / Tailwind 4 / TS 6）。
**涉及文件**：`.trae/skills/*`（项目技能）、`skills-lock.json`（项目技能锁）、`AGENTS.md`、`docs/plans/*`。
**关键决策**：见「当前状态 → 待确认决策」。
**执行约定**：本文件仅为计划；**由用户指定步骤后再执行**，每完成一步勾选 `- [ ]`。

---

## 阶段 0 · 接入方式确认 ✅

- [x] 0.1 验证 `npx skills add` 能否识别 Trae → **识别得到**（`skills` v1.5.18 内置 Trae，agent 标识 `trae`），无需手动落 SKILL.md。
- [x] 0.2 定层级（**已修订**）：**全部项目级**（`./.trae/skills/` + 提交 `skills-lock.json`），便于团队共享。原「混合（通用→全局）」方案因队友拿不到全局技能而作废。

> 0.1 事实：`trae` → 项目 `.trae/skills/`、全局 `~/.trae/skills/`。**Project scope 会进仓库、随团队共享；Global scope 仅本机用户级**。项目级 `.trae/skills/` 已存在（已含项目定制版 `plan-driven-development`），本次全部技能统一装到此目录。

## 阶段 1 · 通用技能接入（项目级 `.trae/skills/`）

> **修订（2026-10-10，第二轮）**：原「删除重叠项」判据**有误**，已作废。事实：那些"重叠"来源全部是**用户级全局**——`~/.trae/plugins/trae-remote-official/...`（plugin）、`~/.trae/skills/`——**都不在仓库**，队友 clone 后拿不到，且 plugin 的启用/版本不受仓库控制。
> **本项目为多人协作，要求技能与 MCP 全员一致**，故**所有必需技能一律项目级固化**（进 `.trae/skills/` + `skills-lock.json`），不依赖任何全局配置。
> **正确判据：团队能否随仓库稳定复现**（而非「我本机是否已可用」）。

> **完成（2026-10-11）**：1.1–1.5 共 7 个技能已由用户**手动下载**落盘至 `.trae/skills/`，并生成 `skills-lock.json`（记录 7 个技能的来源仓库与 `computedHash`）。

- [x] 1.1 `vercel-labs/agent-skills@vercel-react-best-practices` — React/Next.js 性能规范（本项目无 Next.js，仅取 React 部分）。**项目级固化**：本机 plugin 版 `react-best-practices` 属用户级、不进仓库，不可依赖。
- [x] 1.2 `wshobson/agents@tailwind-design-system` — Tailwind v4 写法：仅取 CSS-first `@theme`/`@utility`/`@custom-variant`、v3→v4 迁移清单、响应式布局；忽略 shadcn/CVA 章节（与「antd 管交互」冲突）。
- [x] 1.3 `wshobson/agents@typescript-advanced-types` — TS 类型规范（高级类型 / 类型安全 / 内置工具类型 / 常见陷阱）。
- [x] 1.4 `mattpocock/skills@tdd` — TDD 流程（1.1M 安装 / 283K★；先确认接口与行为再编码，与 `plan-driven-development` 理念一致）。**项目级固化**：本机全局已装的同名技能不进仓库，不可依赖。
- [x] 1.5 `ibelick/ui-skills@baseline-ui` + `@fixing-accessibility` + `vercel-labs/agent-skills@web-design-guidelines` — UI 打磨（Tailwind 定向）/ 无障碍修复 / 设计与 a11y 广度审查。三者职责不同，**均项目级保留**（原「合并为 1 个」的收敛已作废）。

## 阶段 2 · 栈绑定技能接入（项目级 `.trae/skills/`）

- [ ] 2.1 `ant-design/ant-design-cli@antd` — antd 官方技能（skill 名 `antd`）+ **官方 MCP**（两者都配，见下方「2.1 说明」）。**栈绑定，最高价值。**
- [ ] 2.2 `remix-run/react-router@react-router` — 官方新技能，覆盖 Framework / Data / Declarative / RSC 四种模式，对应本项目 `createBrowserRouter`（取代已归档的 `remix-run/agent-skills@react-router-data-mode`）。**栈绑定。**
- [ ] 2.3 `vercel-labs/skills@find-skills` — 元技能（找/装技能）。**项目级保留**，以对齐团队环境。

> **2.1 说明**：官方 skill 与 MCP 是两件事。
>
> - Skill：`npx skills add ant-design/ant-design-cli --skill antd -a trae -y`（仓库 `ant-design/ant-design-cli`，仅 1 个技能 `antd`）。
> - MCP：`@ant-design/cli`（npm 包，v6.3.5+）提供 8 工具/2 提示词，需在 Trae 的 MCP 配置里加：`{"command":"npx","args":["-y","@ant-design/cli","mcp"]}`。

## MCP 一致性（新增 · 待确认）

- **现状**：项目 `.trae/` 下只有 `skills/`，**无任何 MCP 配置文件，也无 `skills-lock.json`**。MCP 通常为用户级配置、不在仓库。
- **风险**：技能可随 `skills-lock.json` 复现，但 **MCP 无法由仓库保证一致** → 队友可能少了 antd MCP。
- **待确认**：Trae 是否支持**项目级 MCP 配置**（可进仓库）？若支持 → 落库；若不支持 → 至少在 `AGENTS.md`/README 固化「必装 MCP 清单 + `@ant-design/cli` 参数」，作为人工同步步骤。

## 阶段 3 · bulletproof-react 规范接入

- ⚠️ **非技能包**：来源为 GitHub 仓库 `alan2207/bulletproof-react`（其 `docs/`），无对应 `skills` 包，需自行裁剪落地。
- [ ] 3.1 阅读其 docs：Project Structure / API Layer / State Management / Error Handling / Security / Project Standards
- [ ] 3.2 裁剪为本项目版（去 react-query / Next.js，对齐 axios + zustand + antd + Tailwind）
- [ ] 3.3 落成 **项目技能** `react-app-architecture`（✅ 已定：形态 A），并与 `AGENTS.md` 联动

---

## 技术选型对照表（真实包名）

| 步骤 | 原计划名                                        | 真实包 / 技能                                                                                              | 状态                        |
| ---- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------- |
| 1.1  | vercel-react-best-practices                     | `vercel-labs/agent-skills@vercel-react-best-practices`                                                     | ✅ 已定（项目级固化）       |
| 1.2  | tailwind-best-practices                         | `wshobson/agents@tailwind-design-system`                                                                   | ✅ 已定                     |
| 1.3  | typescript-pro                                  | `wshobson/agents@typescript-advanced-types`                                                                | ✅ 已定                     |
| 1.4  | test-driven-development                         | `mattpocock/skills@tdd`（原 `obra/superpowers@test-driven-development`）                                   | ✅ 已定（项目级固化）       |
| 1.5  | ui-skills（baseline-ui / fixing-accessibility） | `ibelick/ui-skills@baseline-ui`、`@fixing-accessibility`、`vercel-labs/agent-skills@web-design-guidelines` | ✅ 已定（三个均保留）       |
| 2.1  | ant-design-cli                                  | skill `ant-design/ant-design-cli@antd`；MCP `@ant-design/cli`                                              | ✅ 已定（skill + MCP 都配） |
| 2.2  | react-router-data-mode                          | `remix-run/react-router@react-router`（原 `remix-run/agent-skills@react-router-data-mode`，该仓库已归档）  | ✅ 已改                     |
| 2.3  | find-skills                                     | `vercel-labs/skills@find-skills`                                                                           | ✅ 已定（项目级保留）       |
| 3.x  | bulletproof-react                               | 非技能包（仓库 `alan2207/bulletproof-react`）                                                              | ⚠️ 需裁剪落地               |

**安装命令模板**（统一项目级，均加 `-a trae`）

```bash
# 安装单个技能
npx skills add <owner/repo> --skill <skill> -a trae -y
# 团队成员克隆后一键恢复（读 skills-lock.json）
npx skills experimental_install
```

> **团队共享机制**：项目级安装会在仓库根生成 `skills-lock.json`，**需一并提交**；队友 clone 后执行 `npx skills experimental_install` 即可恢复全部技能。`.trae/skills/` 采用 canonical 副本 + 各 agent 目录软链的方式落盘。

## 选型核实（安装量 / Star，2026-10-10）

> 数据源：`npx skills find`（安装量）、GitHub API（Star / 最近推送 / License / 归档状态）。

| 步骤 | 包                                                        | 安装量        | 仓库 Star | License | 备注                                                 |
| ---- | --------------------------------------------------------- | ------------- | --------- | ------- | ---------------------------------------------------- |
| 1.1  | `vercel-labs/agent-skills@vercel-react-best-practices`    | 784.6K        | 32.1K     | ⚠️ 无   | React 类第一，Vercel 官方；含 Next.js/RSC 条目需裁剪 |
| 1.2  | `wshobson/agents@tailwind-design-system`                  | 67.9K         | 40.3K     | MIT     | Tailwind 类采用度第一；贴合度需裁剪                  |
| 1.3  | `wshobson/agents@typescript-advanced-types`               | 85.5K         | 40.3K     | MIT     | TS 类型类第一                                        |
| 1.4  | `mattpocock/skills@tdd`                                   | 1.1M          | 283.4K    | MIT     | TDD 类第一（原 obra 版 57.7K）                       |
| 1.5  | `ibelick/ui-skills@baseline-ui` / `@fixing-accessibility` | 22.0K / 19.9K | 9.6K      | MIT     | Tailwind 定向，贴合                                  |
| 1.5  | `vercel-labs/agent-skills@web-design-guidelines`          | 716.9K        | 32.1K     | ⚠️ 无   | UI+a11y+UX 广度审查，Vercel 官方                     |
| 2.1  | `ant-design/ant-design-cli@antd`                          | —             | 260       | MIT     | antd 官方，较新                                      |
| 2.2  | `remix-run/react-router@react-router`                     | —             | 56.6K     | MIT     | 官方主仓库，活跃；取代已归档的 agent-skills          |
| 2.3  | `vercel-labs/skills@find-skills`                          | —             | 33.6K     | MIT     | 元技能                                               |

**风险提示**：`vercel-labs/agent-skills` 仓库 **无 License**（GitHub API `license: null`），商用前需自行确认授权。

## 阶段 4 · 验证与沉淀

- [ ] 4.1 逐个验证技能可被识别 / 按需触发
- [ ] 4.2 用一个真实小需求验证「AI 按规范产出」
- [ ] 4.3 更新 `AGENTS.md` / README，勾选本计划
- [ ] 4.4 提交 `skills-lock.json` + 在 README 写明团队恢复命令（`npx skills experimental_install`）

---

## 待执行清单（全部项目级固化，2026-10-10）

| #   | 技能 / 产物                                                                                | 类型     | 固化理由                         |
| --- | ------------------------------------------------------------------------------------------ | -------- | -------------------------------- |
| 1.1 | `vercel-labs/agent-skills@vercel-react-best-practices`                                     | 通用     | 全局 plugin 版不进仓库，须固化   |
| 1.2 | `wshobson/agents@tailwind-design-system`（裁剪）                                           | 通用     | Tailwind v4 写法，仓库内无替代   |
| 1.3 | `wshobson/agents@typescript-advanced-types`                                                | 通用     | TS 高级类型规范                  |
| 1.4 | `mattpocock/skills@tdd`                                                                    | 通用     | 本机全局同名技能不进仓库，须固化 |
| 1.5 | `ibelick@baseline-ui`、`ibelick@fixing-accessibility`、`vercel-labs@web-design-guidelines` | 通用     | 三者职责不同，均需全员一致       |
| 2.1 | `ant-design/ant-design-cli@antd` + MCP                                                     | 栈绑定   | antd 官方，最高价值              |
| 2.2 | `remix-run/react-router@react-router`                                                      | 栈绑定   | 对应 `createBrowserRouter`       |
| 2.3 | `vercel-labs/skills@find-skills`                                                           | 元技能   | 对齐团队环境                     |
| 3.x | `react-app-architecture`（自建项目技能）                                                   | 项目独有 | bulletproof-react 裁剪版         |

**无删除项**（原收敛已作废）。
**常驻开销**：9 个技能描述常驻（≈几百 token~1K），被触发时才读正文；相比"团队不一致"的代价可忽略。
**附带待办**：MCP 一致性 → 见「MCP 一致性」小节，需确认 Trae 是否支持项目级 MCP 配置。

---

## 当前状态

- 阶段 0 已确认完成；清单**修订为「全部项目级固化」**（原"收敛删除"方案作废）。
- **阶段 1 已完成（2026-10-11）**：1.1–1.5 共 7 个技能已手动下载至 `.trae/skills/`，`skills-lock.json` 已生成。已落盘目录：`vercel-react-best-practices`、`tailwind-design-system`、`typescript-advanced-types`、`tdd`、`baseline-ui`、`fixing-accessibility`、`web-design-guidelines`。
- **阶段 2–3 待用户指定步骤后执行**。

## 待确认决策（均已确认）

1. ~~**安装层级**~~ ✅ **全部项目级**（`./.trae/skills/` + 提交 `skills-lock.json`），团队共享。
2. ~~**bulletproof-react 形态**~~ ✅ **A** 项目技能 `react-app-architecture`（并联动 `AGENTS.md`）。
3. ~~**TS 类型规范**~~ ✅ **A** `wshobson/agents@typescript-advanced-types`。
4. ~~**antd MCP**~~ ✅ **是**，skill + MCP 都配。
5. ~~**安装方式**~~ ✅ 官方 `npx skills add ... -a trae`（项目级，不加 `-g`）。
6. ~~**1.2 贴合度**~~ ✅ 保持 `wshobson@tailwind-design-system`，但只取其 v4 CSS-first 写法部分。
7. ~~**1.4 TDD 竞品**~~ ✅ 改用 `mattpocock/skills@tdd`（1.1M）；项目级固化。
8. ~~**1.5 补充**~~ ✅ 新增 `vercel-labs/agent-skills@web-design-guidelines`。
9. ~~**2.2 归档仓库**~~ ✅ 改用官方新技能 `remix-run/react-router@react-router`（56.6K★，活跃）。
10. ~~**清单取舍判据**~~ ✅ **以「团队能否随仓库稳定复现」为准**：全部必需技能项目级固化，不依赖任何全局配置。
11. **MCP 一致性** ⏳ 待确认：Trae 是否有项目级 MCP 配置可落库。

## 下一步

- 阶段 1 已完成并随本次提交入库（技能目录 + `skills-lock.json`）。
- **待用户指定后续步骤**（如「执行 2.1 2.2 2.3」或「做阶段 3」）；并请确认 Trae 的项目级 MCP 机制。
