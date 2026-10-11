# E2E 端测 + GitHub Actions CI · 落地计划

**目标**：把「浏览器端到端走查」固化进仓库 —— 用 Playwright 把订单模块的 11 步走查落成可重复执行的 E2E 用例，本地一条命令可跑，并接入 GitHub Actions 与 `vp check`/`vp test` 一起作为合并门槛。
**技术栈**：Vite+（`vp` CLI）+ Vitest（`vp test`，单测）+ Playwright Test（E2E，新增）；包管理器 pnpm。
**当前缺口**：无 E2E 依赖/配置/用例；无任何 CI 配置；`test.include` 仅 `src/**`，无浏览器环境。
**关键决策**：✅ 已与用户确认（见下）。
**执行约定**：本文件仅为计划；**由用户指定步骤后再执行**，每完成一步勾选 `- [ ]` 并更新「当前状态」。

---

## 已定决策（用户已确认）

1. **E2E runner**：Playwright Test（`@playwright/test`）。
2. **范围**：仅补 E2E，不动现有单测与组件测试（不引入 jsdom/@testing-library）。
3. **被测服务**：dev server —— Playwright `webServer` 自动起 `vp dev`（**固定端口 + strictPort**，避免 5173/5174 漂移）。
4. **CI 平台**：GitHub Actions，用 Vite+ 官方 `voidzero-dev/setup-vp`。
5. **不依赖后端**：沿用默认 `VITE_USE_MOCK=true`，E2E 全程走 mock（内存态，刷新即重置 → 用例需自洽、不跨用例共享数据）。

## 涉及文件

- 改：`pnpm-workspace.yaml`（catalog 登记 Playwright）、`package.json`（devDependency + scripts）、`.gitignore`、`tsconfig.json`（纳入 `e2e` 类型检查）
- 增：`playwright.config.ts`、`e2e/auth.setup.ts`、`e2e/pages/order-list.page.ts`、`e2e/order-list.spec.ts`、`e2e/order-renew-cancel.spec.ts`、`e2e/order-new.spec.ts`、`.github/workflows/ci.yml`

## 需求 → 实现对照

| 要达成的能力                   | 落点                                                                       |
| ------------------------------ | -------------------------------------------------------------------------- |
| 本地一条命令跑端测             | `package.json` scripts `e2e` / `e2e:ui`；`playwright.config.ts`            |
| 端测自动起服务、免手动开 dev   | `playwright.config.ts` 的 `webServer`（`vp dev` + strictPort）             |
| 登录态复用（避免每例重复登录） | `e2e/auth.setup.ts` 产出 `playwright/.auth/user.json`，`storageState` 引用 |
| 复用这次 11 步走查作为用例     | `e2e/*.spec.ts`（列表/筛选/搜索/续卡/撤单/新建）                           |
| CI 与 check/test 同门槛        | `.github/workflows/ci.yml`：`setup-vp` → `check`/`test` → 装浏览器 → `e2e` |

---

## 阶段 0 · 依赖与基础配置

- [x] 0.1 `pnpm-workspace.yaml` catalog 增加 `@playwright/test`（与现有依赖同风格）
- [x] 0.2 `package.json`：devDependency 引 `catalog:@playwright/test`；scripts 增 `"e2e": "playwright test"`、`"e2e:ui": "playwright test --ui"`（`pnpm test` 仍只跑单测，互不影响）
- [x] 0.3 `playwright.config.ts`：`testDir: "e2e"`，`baseURL: http://localhost:5173`，`webServer: { command: "vp dev --port 5173 --strictPort", url, reuseExistingServer: !process.env.CI }`，projects 收 chromium；`use.storageState` 指向 setup 产物；reporters `html` + `list`
- [x] 0.4 `.gitignore` 增 `test-results/`、`playwright-report/`、`playwright/.auth/`
- [x] 0.5 `tsconfig.json` 的 `include` 增 `"e2e"`（让 `tsc`/`vp check` 覆盖端测代码；若 typeAware lint 对 e2e 误报，改为 `e2e` 独立 tsconfig 并在 lint 中放行）

## 阶段 1 · 认证与页面辅助

- [x] 1.1 `e2e/auth.setup.ts`：访问 `/login` → 填任意账密（如 admin/123456）→ 落 `storageState` 到 `playwright/.auth/user.json`
- [x] 1.2 `playwright.config.ts` 配 setup project，业务用例依赖其产物（未登录访问自动跳 `/login` 已由路由守卫保证）
- [x] 1.3 `e2e/pages/order-list.page.ts`：轻量 Page Object —— 封装 Tab 切换、搜索、勾选行、批量续卡/撤单、读行数据等选择器与动作，避免选择器散落在各 spec

## 阶段 2 · 用例（复用 11 步走查）

- [x] 2.1 列表基础：5 个 Tab 及顺序、7 列表头、默认创建时间倒序（首行 `20261011001`）、状态 Tag、操作列仅「已到期」行有「续卡」
- [x] 2.2 金额格式：`4,800.00` 千分位；金额 0 与 null 均显示 `0.00`
- [x] 2.3 筛选与搜索：切 Tab 回第 1 页（断言 URL `tab=expired&page=1`）；订单号精确匹配、姓名模糊匹配（张三 → 张三 + 张三丰）
- [x] 2.4 批量续卡：选中含不合格订单 → 警告列出订单号；仅选「已到期」→ 填 5 年，应付 `4,800.00`（8 折），提交后年限累加且状态转「待审核」
- [x] 2.5 一键撤单：选中「待制卡/待寄卡」→ 二次确认列出订单号 → 确认后状态转「已取消」；含不合格订单时给出提示
- [x] 2.6 行内续卡：仅「已到期」行显示「续卡」按钮并可复用弹窗提交
- [x] 2.7 新建订单：空表单校验报错；填写后办卡费用只读联动 `2,400.00 元`；提交成功提示并回列表且新单置顶
- [x] 2.8 用例自洽：每个 spec 以 `goto("/orders")` 起手，不依赖其它用例的写操作（mock 内存态、刷新即重置）

## 阶段 3 · GitHub Actions CI

- [x] 3.1 `.github/workflows/ci.yml`：`on: [push, pull_request]`；job 用 `voidzero-dev/setup-vp`（Node 24、`cache: true`）
- [x] 3.2 步骤：`vp check` → `vp test` → `pnpm exec playwright install --with-deps chromium` → `pnpm e2e`（webServer 自动起 `vp dev`）
- [x] 3.3 失败时上传 `playwright-report/` 作为 artifact，便于定位

## 阶段 4 · 校验

- [ ] 4.1 本地 `pnpm exec playwright install chromium` 后跑 `pnpm e2e` 全绿（**本地浏览器下载受阻，改为直接推 GitHub 由 CI 验证**）
- [x] 4.2 `pnpm exec vp check`、`pnpm exec vp test` 仍全绿（e2e 纳入类型检查后无新增告警）
- [x] 4.3 更新 `AGENTS.md` 常用命令（补 `pnpm e2e`）与 `skills-lock.json` 相关说明（如需；本次无需改 skills-lock.json）

---

## 当前状态

- 代码全部落地，`vp check` / `vp test` 本地全绿；本地 Chromium 下载受阻（网络），4.1 的 E2E 实跑改为推 GitHub 后由 CI 首跑验证（`pnpm e2e` 步骤 + 失败时上传 playwright-report artifact）。
- CI 已确认的风险点：`vp dev --port 5173 --strictPort` 为官方支持参数（Options are forwarded to Vite）。
- 执行备注（与计划的偏差）：
  - 2.3：mock 姓名池无「张三丰」，模糊匹配改用「张」→ 命中「张三 ×4 + 张伟 ×3（共 7 条）」，另断言「张三」仅命中 4 条。
  - 2.7：mock 种子基准时刻为 09:00，新单创建时间用真实时钟 —— 每天 09:00 前的窗口内新单不置顶（会不稳定），故「置顶」断言改为「按姓名搜索唯一命中 + 状态待审核」，代码中已注释说明。
  - 用例部分「按状态筛行」而非固定行号：mock 种子会洗牌，各状态行位置每次加载不同（如 inProgress 用 `pageSize=50` 全量展示后取「待审核/待制卡/待寄卡」行）。
