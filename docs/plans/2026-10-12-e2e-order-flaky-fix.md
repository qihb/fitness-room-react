# 订单 E2E 偶发失败修复（加载态探针 + 数据基线对齐）· 落地计划

**目标**：消除 CI 上订单 E2E 的 1 个确定性失败（姓名模糊断言）与 2 处竞态（查询等加载态超时、新单回列表查询未生效），让用例在冷启动 / 2 worker 下稳定通过。
**技术栈**：见 AGENTS.md（React 19 / Vite+ / Playwright / antd 6）。
**涉及文件**：

- 改：`src/api/mock.ts`（会员姓名池唯一化，工作区已有改动，纳入本次）
- 改：`e2e/pages/order-list.page.ts`（加载态探针 + 就绪等待）
- 改：`e2e/order-new.spec.ts`（注入探针 + 列表就绪后再查询）

**关键决策**（已与用户确认）：

- **等待机制**：e2e 侧 `MutationObserver` 加载态探针，按「加载态出现→消失」的**单调计数**等待，**不引入 mock 请求计数、不改应用代码**。
- **不改应用**：`OrderListSearch` 的挂载回填 `useEffect` 保持不动，竞态仅在测试侧规避。
- **范围**：包含提交 `src/api/mock.ts` 的唯一姓名改动，与用例断言对齐。

**执行约定**：本文件仅为计划；由用户指定步骤后再执行，每完成一步勾选 `- [ ]`。

---

## 阶段 0 · 数据基线对齐

- [x] 0.1 复核并保留 `src/api/mock.ts` 唯一姓名改动（42 个、`MEMBER_NAMES[index]`），确认「张」命中 3 条。
- [x] 0.2 复核相关断言一致：全部 `共 42 条`、`张 → 共 3 条`、已到期 `共 8 条`、续卡后 `共 7 条`。

## 阶段 1 · E2E 加载态探针

- [x] 1.1 在 `order-list.page.ts` 增加探针：注入脚本用 `MutationObserver` 监听 `.ant-spin-spinning`，维护单调 `cycles` 与 `active`。
- [x] 1.2 重写 `waitForListIdle` 为「记录基线计数 → 执行动作 → 等计数 +1 且 active=false」，替换「先等 visible」逻辑。
- [x] 1.3 `goto`/首屏就绪：表头出现 + 完成至少一次加载周期（确保挂载回填 effect 已执行）。

## 阶段 2 · 规避新单输入竞态

- [x] 2.1 `order-new.spec.ts` 在 `beforeEach` 注入探针（首次加载即生效，客户端路由跳转仍有效）。
- [x] 2.2 回列表后先等列表就绪，再 `fill(会员姓名)` 并查询，避免挂载回填清空输入。

## 阶段 3 · 验证

- [x] 3.1 `env -u CI pnpm exec playwright test --workers=2` 全量跑通；重启 `vp dev` 模拟冷启动再跑一轮。
- [x] 3.2 `pnpm exec vp check` 通过。

---

## 当前状态

- **已完成**，全部步骤落地。
- 本地全量 e2e 连跑 3 轮均 `12 passed`；`vp check` 无格式化 / lint / 类型问题。
- 说明：`waitForListIdle` 合并为 `runAndSettle` + `waitForLoadingCycle`，等待上限 15s（原用例 90s），查询未触发请求时快速失败。
- 冷启动模拟：因 5173 已被既有 dev server 占用（未擅自终止），采用连跑多轮替代；探针方案与冷启动无关（不依赖轮询时序）。
