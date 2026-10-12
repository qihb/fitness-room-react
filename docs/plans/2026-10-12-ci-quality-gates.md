# CI 质量门禁扩展 · 落地计划

**目标**：在现有 CI（`vp check` + `vp test` + Playwright E2E）之上，补 4 道门禁：① Oxlint 复杂度/规模规则 ② dependency-cruiser 依赖关系（循环 + 孤立 + 分层）③ jscpd 重复率 ④ @lhci/cli 浏览器性能。
**技术栈**：Vite+（`vp`，内置 Oxlint/Oxfmt/Vitest）、dependency-cruiser、jscpd、@lhci/cli、GitHub Actions（`voidzero-dev/setup-vp`）、pnpm。
**执行约定**：本文件仅为计划；**由用户指定步骤后再执行**，每完成一步勾选 `- [ ]` 并更新「当前状态」。

## 已定选型（用户已确认）

| 需求点                                     | 选型                   | 理由                                          |
| ------------------------------------------ | ---------------------- | --------------------------------------------- |
| 复杂度 / 嵌套 / 参数 / 文件行数 / 函数行数 | **Oxlint 内置规则**    | 复用现有 `vp check`，零新增依赖               |
| 依赖关系 / 循环依赖 / 孤立模块             | **dependency-cruiser** | 一个工具覆盖循环 + orphan + 分层守卫          |
| 代码重复率                                 | **jscpd**              | 行业标准，支持阈值卡 CI                       |
| 浏览器性能检测                             | **@lhci/cli**          | Google 官方 Lighthouse CI，可断言阈值阻断合并 |

## 涉及文件

- 改：`vite.config.ts`（`lint.rules` 增复杂度规则）、`pnpm-workspace.yaml`（catalog 登记 3 个 devDep）、`package.json`（devDependencies + scripts）、`.github/workflows/ci.yml`（新增步骤/独立 job）、`.gitignore`（报告产物）、`AGENTS.md`（常用命令）、`src/api/request.ts` 与 `src/router/index.tsx`（断环改造，见阶段 1 备注）
- 增：`.dependency-cruiser.cjs`、`.jscpd.json`、`.lighthouserc.cjs`、`scripts/lhci-auth.cjs`、`src/lib/navigation.ts`（导航桥）、本计划文件

## 关键决策（待确认，先给建议默认值）

1. **Oxlint 阈值**：`complexity` 15、`max-depth` 4、`max-nested-callbacks` 4、`max-params` 4、`max-lines` 300/文件、`max-lines-per-function` 80（跳过空行/注释）、`max-statements` 30。**首轮先 `warn` 摸底存量超标量**，用户确认后再统一收紧为 `error`。
2. **孤立模块严重级别**：`no-orphans` 先 `warn`（入口 `main.tsx`、`*.test.ts`、`e2e/**` 为合法"无人引用"，需排除），其余分层规则 `error`。
3. **jscpd 阈值**：先 `threshold: 8`（%），`min-tokens: 50`，忽略 `**/*.test.ts(x)`、`e2e/**`、`src/api/mock.ts`。
4. **Lighthouse 范围与阈值**：测登录后的 `/orders`（非只测登录页），需鉴权脚本；先 `categories:performance ≥ 0.8`、`LCP ≤ 4000ms`、`CLS ≤ 0.1` 且 **先 `warn`**（dashboard 首屏 + mock 波动大），跑稳后再转 `error`。
5. **CI 形态**：depcruise / jscpd 并入现有 `ci` job；Lighthouse 单列 job（耗时且依赖 Chrome），互不阻塞。

---

## 阶段 0 · 复杂度与规模（Oxlint）

- [x] 0.1 `vite.config.ts` 的 `lint.rules` 增：`complexity`、`max-depth`、`max-nested-callbacks`、`max-params`、`max-lines`、`max-lines-per-function`、`max-statements`（先 `warn`）
- [x] 0.2 跑 `pnpm exec vp check` 摸底告警分布，形成"超标清单"，与用户确认是**修**还是**先放 warn**
  - 存量 8 条（均 warn）：`src/api/mock.ts`（complexity 29/15、max-statements 33/30、max-lines 512/300）、`src/pages/order/index.tsx`（函数 120/80）、`src/pages/equipment/index.tsx`（113/80）、`src/features/equipment/components/equipment-form-modal.tsx`（105/80）、`src/features/order/hooks/use-order-actions.ts`（89/80）、`src/layouts/basic-layout.tsx`（89/80）
- [ ] 0.3 按确认结果定稿（必要时把无争议项转 `error`）——**待用户拍板：修 or 保持 warn**

## 阶段 1 · 依赖关系（dependency-cruiser）

- [x] 1.1 `pnpm-workspace.yaml` catalog + `package.json` 登记 `dependency-cruiser`（**升到 18.x**：16/17 的 TS 支持上界 `<6.0.0`，与本项目 TS 6 冲突，会致 `@/*` 别名解析失效；18.x 需 Node ≥22）
- [x] 1.2 新增 `.dependency-cruiser.cjs`：`no-circular`（**error**）、`no-orphans`（**warn**，排除入口/测试/`.d.ts`；`includeOnly: ^src`）、分层守卫 3 条（**error**）
- [x] 1.3 `package.json` scripts：`"depcruise": "depcruise --config .dependency-cruiser.cjs \"src/**/*.{ts,tsx}\""`
- [x] 1.4 本地 `pnpm depcruise` 跑通：`✔ no dependency violations found (58 modules, 134 dependencies)`
  - 备注①：开启 `tsPreCompilationDeps: true`，否则 type-only 依赖不入图，`types/*.ts` 会被误报为孤儿
  - 备注②：检出真实环 `request.ts → router → pages → features → api → request.ts`。dc 无法用配置干净排除"含懒加载边的环"，故按用户决策**引入无依赖导航桥** `src/lib/navigation.ts` 断环：`request.ts` 改依赖 `@/lib/navigation`，`router` 创建后 `registerNavigator` 注入 `navigate`

## 阶段 2 · 重复率（jscpd）

- [x] 2.1 catalog + `package.json` 登记 `jscpd`
- [x] 2.2 新增 `.jscpd.json`：`threshold: 8`、`min-tokens: 50`、`reporters: ["console","html"]`、`ignore`（test/mock/node_modules/dist）
- [x] 2.3 `package.json` scripts：`"cpd": "jscpd src"`
- [x] 2.4 本地 `pnpm cpd` 跑通：当前重复率 **1.77%**（50 行 / 2 处克隆），远低于阈值

## 阶段 3 · 浏览器性能（@lhci/cli）

- [x] 3.1 catalog + `package.json` 登记 `@lhci/cli`
- [x] 3.2 新增 `.lighthouserc.cjs`：`startServerCommand` 起 `pnpm preview`，`url: ["http://localhost:4173/orders"]`，`numberOfRuns: 3`，断言全 `warn`
- [x] 3.3 新增 `scripts/lhci-auth.cjs`：Puppeteer 脚本，写登录态并走一遍登录，进入 `/orders`
- [x] 3.4 `package.json` scripts：`"lhci": "lhci autorun"`
- [x] 3.5 本地 `pnpm build && pnpm lhci` 跑通：3 次跑分，`finalUrl` = `/orders`（鉴权生效）；性能 0.76（warn）
  - 备注①：就绪模式原用 `Local:`，但 vp 彩色输出为 `\x1b[1mLocal\x1b[22m:`（转义码拆开），改用无色的 `http://localhost`
  - 备注②：本机无 Chrome，本地验证临时以 `CHROME_PATH`/`PUPPETEER_EXECUTABLE_PATH` 指向 Playwright 的 Chromium；CI 由 workflow 解析系统 Chrome

## 阶段 4 · 接入 GitHub Actions

- [x] 4.1 `ci` job 增步骤：`pnpm depcruise`、`pnpm cpd`（在 `vp check` 之后）
- [x] 4.2 新增 `lighthouse` job：`setup-vp` → `pnpm build` → 解析 Chrome 路径 → `pnpm lhci`；失败上传 `.lighthouseci/` 报告
- [ ] 4.3 推分支由 CI 首跑验证；失败时定位并加固——**待用户推送分支后验证**

## 阶段 5 · 收尾与校验

- [x] 5.1 `.gitignore` 忽略 `.jscpd/`、`.lighthouseci/`
- [x] 5.2 `AGENTS.md` 常用命令补 `pnpm depcruise` / `pnpm cpd` / `pnpm lhci`
- [x] 5.3 `pnpm exec vp check`（0 error / 8 warn）、`pnpm exec vp test`（21 passed）仍全绿

---

## 当前状态

- 四道门禁均已落地并本地跑通：depcruise（0 violation）、cpd（1.77%）、lhci（跑通，性能 warn）、Oxlint 复杂度（8 warn）。
- 关键决策 1–5 已按"先宽后紧"落地（复杂度/no-orphans/Lighthouse 均为 `warn`；循环与分层为 `error`）。
- **待办**：① 阶段 0.3 —— 存量 8 条复杂度告警「修 or 保持 warn」，待拍板；② 阶段 4.3 —— 推送分支触发 CI 首跑验证；③ 可选：为 `package.json` 补 `engines.node >= 22`（depcruise 18 硬性要求）。
- 依赖关系门禁顺带修复了真实架构环（`request.ts` 直接依赖 router），已按用户决策改为导航桥解耦。
