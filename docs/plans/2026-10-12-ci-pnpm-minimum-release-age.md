# CI 供应链门禁（minimumReleaseAge）失败 · 落地计划

**目标**：修复 CI 安装依赖时报 `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`——把两个落在 pnpm 24h 新包冷却窗口内的依赖降到窗口外的版本，使 CI 能正常安装。
**技术栈**：见 AGENTS.md（pnpm / Vite+ / GitHub Actions）。
**涉及文件**：改 `pnpm-workspace.yaml`、重建 `pnpm-lock.yaml`。
**关键决策**：① `ip-address` 是传递依赖，采用「重解析自然降级」还是「`overrides` 显式钉版本」；② 本任务会改动 `pnpm-lock.yaml`（仓库边界写明"不要修改"），需确认放行。
**执行约定**：本文件仅为计划；由用户指定步骤后再执行，每完成一步勾选 `- [ ]` 并更新「当前状态」。

---

## 背景（已定位）

- CI 用 pnpm **12.10.1**（`devEngines` 指定，`setup-vp` 下载）；**pnpm 11 起 `minimumReleaseAge` 默认 1440 分钟**，安装时逐条校验 lockfile 内每个包的发布时间。
- 本地 `pnpm` CLI 是 10.10.0（默认 0，无门禁），故 lockfile 里锁进了 2 个"太新"的版本：

| 包                   | 版本   | 发布 (UTC)       | 来源                                                                                                             |
| -------------------- | ------ | ---------------- | ---------------------------------------------------------------------------------------------------------------- |
| `dependency-cruiser` | 18.6.0 | 2026-10-11 19:35 | catalog `^18.6.0`（直接 devDep）                                                                                 |
| `ip-address`         | 10.7.4 | 2026-10-11 19:34 | 传递：`@lhci/cli` / `@puppeteer/browsers` → `proxy-agent` → `socks-proxy-agent` → `socks` → `ip-address@^10.1.1` |

- CI 安装时间 ≈ 2026-10-12 07:44 UTC，冷却下限 = 07:44 − 24h，两包晚约 12h → 被拒。
- 合规旧版本均存在：`dependency-cruiser@18.5.0`（09-30）、`ip-address@10.7.3`（10-01）。
- **本地已可复现**：`pnpm exec vp install` 会走 Vite+ 自带 pnpm 12，报同一错误（`Verifying lockfile against supply-chain policies`）。

## 阶段 1 · 调整版本声明

- [x] 1.1 `pnpm-workspace.yaml` catalog：`dependency-cruiser: ^18.6.0` → `^18.5.0`
- [x] 1.2 记录 lockfile 现状（`git diff --stat pnpm-lock.yaml` 基线），确认下一步 diff 可控
- [x] 1.3 确认 `ip-address` 的处理方式（用户拍板：**重解析自然降级**，不加 overrides）

## 阶段 2 · 重建 lockfile（门禁生效）

- [x] 2.1 在 pnpm 12 门禁下重解析（实际用 `vp env exec --node 24.21.0 --package-manager pnpm@12.10.1 pnpm update dependency-cruiser ip-address`；「删除 lockfile 后 `vp install`」会退化成 pnpm stub，故改用 `update` 重解析）
- [x] 2.2 核对 diff：**漂移超出预期**，已停下确认，用户选择「接受重解析结果」。diff 构成见下方「当前状态」

## 阶段 3 · 校验

- [x] 3.1 `pnpm exec vp install` 通过（`Already up to date`，走 pnpm v12.10.1，无 minimumReleaseAge 违规）
- [x] 3.2 `pnpm exec vp check`（0 errors） / `pnpm exec vp test`（4 文件 21 用例全绿）
- [ ] 3.3 提交并推送触发 CI，确认安装步骤通过（待用户指定）

---

## 当前状态

- 阶段 1–2 已完成，阶段 3.1/3.2 已通过；**3.3（提交推送）待用户指定**。
- 变更文件：`pnpm-workspace.yaml`（catalog dc → `^18.5.0`）、`pnpm-lock.yaml`（重解析）。
- lockfile diff 构成（约 397 行）：
  1. **预期降级**：`dependency-cruiser` 18.6.0→18.5.0、`ip-address` 10.7.4→10.7.3；
  2. **dc 子依赖连带**：`acorn` 8.19.0→8.18.0、`ignore` 7.0.12→7.0.11（dc 直接依赖二者）；
  3. **pnpm 12 格式归一**：约 28 个包补 `(supports-color@7.2.0)` peer 后缀、`@vitest/ui` 后缀归一（功能等价）；
  4. **pnpm 自身锁段**：文件头新增 `packageManagerDependencies: pnpm@12.10.1` + 14 个 `@pnpm/exe.*` 平台包——实测去掉后 pnpm 12 `--frozen-lockfile` 报 `outdated`，是 `devEngines.packageManager.onFail: download` 的必需项，非文件损坏。
- 备注：本地 `pnpm` CLI（10.10.0）无门禁，重解析必须借助 pnpm 12（`vp env exec`），否则 `ip-address` 会再次解析到 10.7.4。
