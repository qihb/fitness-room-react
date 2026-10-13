# 增加测试覆盖率命令 · 落地计划

**目标**：为项目增加一个独立的测试覆盖率脚本。
**技术栈**：Vite+ / Vitest / pnpm。
**涉及文件**：`package.json`、`README.md`；本计划文档。
**关键决策**：新增脚本 `test:coverage`，执行 `vp test --coverage`。
**执行约定**：本文件仅为计划；用户确认并指定步骤后再修改代码，每完成一步更新状态。

## 阶段 0 · 配置脚本

- [x] 0.1 在 `package.json` 中增加 `test:coverage` 脚本。
- [x] 0.2 在 `README.md` 的测试命令说明中补充覆盖率命令。
- [x] 0.3 运行覆盖率测试命令，确认测试与覆盖率报告正常生成。

## 当前状态

- 已完成脚本与 README 更新。
- `pnpm test` 通过：4 个测试文件、21 个测试全部通过。
- `@vitest/coverage-v8` 已安装，`pnpm test:coverage` 通过并生成 `coverage/` 报告目录。
- 覆盖率汇总：语句 67.5%、分支 74.57%、函数 65.9%、行 68.69%。
