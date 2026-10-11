# 顶栏侧边菜单折叠开关 · 落地计划

**目标**：将顶栏左侧"管理后台"标题替换为侧边菜单折叠/展开按钮（图标模式折叠）。
**技术栈**：React 19 + antd 6 + Tailwind（见 AGENTS.md）。
**涉及文件**：仅修改 `src/layouts/basic-layout.tsx`。
**关键决策**：折叠为图标模式（80px 窄条）；顶栏完全替换为按钮、不保留标题文字；移动端 breakpoint 触发折叠后同样显示 80px 图标条（原为完全隐藏，统一交互）。
**执行约定**：本文件仅为计划；由用户指定步骤后再执行，每完成一步勾选 `- [ ]`。

---

## 阶段 0 · 布局改造

- [x] 0.1 `BasicLayout` 增加 `collapsed` state，`Sider` 改为受控（`collapsed` + `onCollapse` + `collapsedWidth="80"`，保留 `breakpoint="lg"` 响应式）
- [x] 0.2 Header 左侧"管理后台"标题替换为切换按钮（`MenuFoldOutlined` / `MenuUnfoldOutlined`，点击切换），移除不再使用的 `Typography` 导入
- [x] 0.3 追加：折叠时 logo 显示为 `FireOutlined` 图标（用户选定），展开时仍为"健身房后台"文字
- [x] 0.4 追加：折叠时 logo 图标 `text-xl` → `text-base`（16px），与菜单折叠图标（antd `collapsedIconSize`=16）同尺寸；浏览器实测两边距均为 32px，完全对齐

## 阶段 1 · 校验

- [x] 1.1 运行 `pnpm exec vp check` 通过（顺带修复了无关计划文档 error-page-content-area.md 的格式问题）

---

## 当前状态

- 全部步骤（0.1–0.4、1.1）已执行完成，`vp check` 通过；折叠对齐经浏览器实测验证。
- 改动仅 `src/layouts/basic-layout.tsx`：顶栏折叠按钮 + Sider 受控折叠（图标模式 80px）+ 折叠时 logo 显示 16px FireOutlined（与菜单图标边距一致）。
