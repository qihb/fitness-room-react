# 表单控件宽度对齐 · 落地计划

**目标**：让「新建订单 → 购卡年限」与「设备管理 → 查询条件 状态 / 类型」的控件宽度，和当前业务其他同类控件一致。

**技术栈**：见 AGENTS.md（Ant Design 6 / Tailwind 4 / Vite+ / pnpm）。

**涉及文件**：`src/pages/order/new.tsx`、`src/features/equipment/components/equipment-list-search.tsx`（可能含 `src/pages/...` 无）。

**执行约定**：本文件仅为计划；由用户指定步骤后再执行，每完成一步勾选 `- [ ]`。

---

## 根因（已实测确认）

- `src/styles/index.css` 把 Tailwind utilities 归入 `@layer utilities`，而 **antd 组件样式是运行时注入、未分层**；同优先级下「未分层样式」胜出，故 **Tailwind 的宽度类在 antd 组件上不生效**。
- 实测（dev，登录后）：
  - 新建订单：`购卡年限`（InputNumber，带 `w-full`）实际 **90px**，同表单其他框 **448px**。
  - 设备管理：`状态`（`w-32`）/ `类型`（`w-36`）实际均为 **71px**，同排 `设备名称`（Input）为 **196px**。
- 结论：`w-full` / `w-32` / `w-36` 被 antd 自身宽度规则覆盖 → 需让类名生效（用 Tailwind 重要修饰符 `w-xx!`）。

## 方案

1. **新建订单 `购卡年限`**：`InputNumber` 由 `w-full` → `w-full!`，与「会员姓名 / 手机号 / 办卡费用」等同宽（448px）。
2. **设备管理 查询条件 `状态` / `类型`**：Select 宽度改为与 `设备名称` 一致（实测 196px → `w-49!`）。

## 关键决策（需用户拍板）

- **A（推荐）**：仅加长两个下拉到与 `设备名称` 等宽（196px），`设备名称` 不动。
- **B**：三个查询框统一为同一显式宽度（如 `w-48!` = 192px），视觉完全等宽（`设备名称` 由 196 → 192px，肉眼无差）。

## 附带发现（本次不动，待用户决定）

- `src/features/order/components/renew-order-modal.tsx` 的「续卡年限」是同类问题（InputNumber 默认 90px，非满宽）。本次需求未提及，默认不改。

---

## 阶段 0 · 新建订单

- [x] 0.1 `src/pages/order/new.tsx`：`购卡年限` 的 `className="w-full"` → `w-full!`（实测 448px）
- [x] 0.2（追加，用户确认）`renew-order-modal.tsx`：`续卡年限` 同样 `w-full!`（实测 472px）

## 阶段 1 · 设备管理

- [x] 1.1 `equipment-list-search.tsx`：决策 A → `状态` / `类型` 均改 `w-49!`（实测 196px，与 `设备名称` 等宽）

## 阶段 2 · 校验

- [x] 2.1 `pnpm exec vp check` 全绿（90 文件格式化 / 63 文件零告警）
- [x] 2.2 浏览器实测：三处控件均与同业务其他框等宽

---

## 当前状态

- **全部完成**。决策：A（仅加长两个下拉）+ 一并修复续卡年限。
- 实测宽度：新建订单各框 448px（购卡年限同宽）；设备管理三框均 196px；续卡弹窗 472px。
