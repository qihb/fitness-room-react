# GitHub Pages 自动部署 · 落地计划

**目标**：用 GitHub Actions 把前端构建产物自动发布到 GitHub Pages，访问地址 `https://qihb.github.io/fitness-room-react/`，部署后继续走前端 mock 可直接演示。

**技术栈**：见 AGENTS.md（Vite+ / React 19 / pnpm / GitHub Actions）。

**涉及文件**：

| 动作 | 文件                                                |
| ---- | --------------------------------------------------- |
| 修改 | `vite.config.ts`（新增 `base`，支持子路径）         |
| 新增 | `.github/workflows/deploy-pages.yml`（构建 + 发布） |
| 修改 | `README.md`（补充部署说明，可选步骤）               |

**关键决策**：

1. **部署形态**：GitHub Pages 项目页，子路径 `/fitness-room-react/`（仓库 `qihb/fitness-room-react`）。
2. **子路径 base**：构建时经环境变量注入 `base=/fitness-room-react/`，本地开发仍为 `/`（不改本地体验）。
3. **SPA 回退**：构建后 `dist/index.html` 复制为 `dist/404.html`，保持现有 `createBrowserRouter` history 模式不变。
4. **数据来源**：构建时 `VITE_USE_MOCK=true`（纯静态演示，不依赖后端）。
5. **构建工具**：沿用现有 CI 的 `voidzero-dev/setup-vp`（按 devEngines 选 Node 24 + 自动 `vp install`）。
6. **发布方式**：`actions/configure-pages` + `upload-pages-artifact` + `deploy-pages`（官方当前推荐，产物不落到 `gh-pages` 分支）。

**执行约定**：本文件仅为计划；由用户指定步骤后再执行，每完成一步勾选 `- [ ]`。

---

## 阶段 1 · 构建支持子路径

- [x] 1.1 `vite.config.ts` 增加 `base`：读 `process.env.VITE_BASE_PATH`，缺省为 `/`（本地不受影响）。
- [x] 1.2 本地验证：带变量构建产物资源前缀为 `/fitness-room-react/`，默认构建仍为 `/`，均已核对。

## 阶段 2 · 新增部署 workflow

- [x] 2.1 新增 `.github/workflows/deploy-pages.yml`：
  - 触发：`push` 到 `main` + `workflow_dispatch`（手动重发）。
  - 权限：`contents: read`、`pages: write`、`id-token: write`；`concurrency` 串行。
  - 步骤：checkout → `setup-vp` → `vp build`（`VITE_BASE_PATH=/fitness-room-react/`、`VITE_USE_MOCK=true`）→ 复制 `dist/index.html` 为 `dist/404.html` → `configure-pages` → `upload-pages-artifact`（`path: dist`）→ `deploy-pages`（`environment: github-pages`）。
- [x] 2.2 本地语法自检：YAML 字段与缩进已人工核对；action 版本取官方当前推荐（`configure-pages@v5` / `upload-pages-artifact@v4` / `deploy-pages@v4`），实际校验交由推送后的 Actions 运行。

## 阶段 3 · 仓库侧开启 Pages 并首次发布

- [ ] 3.1 由你操作：仓库 `Settings → Pages → Build and deployment → Source` 选 **GitHub Actions**。
- [ ] 3.2 提交并推送 `main`，触发 workflow；确认 Actions 绿、`https://qihb.github.io/fitness-room-react/` 可打开。
- [ ] 3.3 走查站点：登录页 → 订单列表 → 设备管理；直接访问/刷新 `/fitness-room-react/orders` 不 404；控制台无资源 404。

## 阶段 4（可选）· 文档补充

- [x] 4.1 `README.md` 增加「部署」小节：访问地址、触发方式、`VITE_BASE_PATH` 说明、Pages 需开 GitHub Actions 源。

---

## 当前状态

- 已确认：Pages 项目页、前端 mock、构建工具沿用 setup-vp。
- 路由回退按推荐方案（404.html 复制），保持 BrowserRouter 不变。
- 已完成阶段 1 / 2 / 4；`pnpm exec vp check` 通过（0 error，仅存量 `src/api/mock.ts` 复杂度 warn）。
- 待办：3.1 由你在仓库 `Settings → Pages` 选 GitHub Actions 源；3.2 提交并推送 `main` 触发首次发布；3.3 线上走查。
