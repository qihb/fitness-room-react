# 健身设备管理模块 · 落地计划

**目标**：新增 `equipment` feature，做成「列表（分页/搜索/状态筛选）+ 新增 / 编辑 / 行内删除 + 批量删除」的完整闭环；**全程零改动复用 4 个全局 hooks**，以此验证通用层抽象是否到位。
**技术栈**：见 AGENTS.md（React 19 / Vite+ / react-router 8 / antd 6 / axios / zustand 5 / Tailwind 4），pnpm。
**涉及文件**：见下方清单。
**执行约定**：本文件仅为计划；**由用户指定步骤后再执行**，每完成一步勾选 `- [ ]` 并更新「当前状态」。

---

## 全局 hooks 复用方案（本次核心）

| 全局 hook                                                                                                          | 复用方式                                                                                              | 是否需改动 hook  |
| ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- | ---------------- |
| [use-list-query.ts](file:///Users/qihaibing/Documents/Trae/fitness-room-react/src/hooks/use-list-query.ts)         | `fetcher: getEquipmentList` + 模块级 `LIST_QUERY_FIELDS`（keyword/status/type）+ 模块级 `extraParams` | 否，零改动       |
| [use-row-selection.ts](file:///Users/qihaibing/Documents/Trae/fitness-room-react/src/hooks/use-row-selection.ts)   | `getRowKey: (e) => e.equipmentNo`，跨页勾选 → 批量删除                                                | 否，零改动       |
| [use-table-scroll-y.ts](file:///Users/qihaibing/Documents/Trae/fitness-room-react/src/hooks/use-table-scroll-y.ts) | `ref` 挂表格外层伸缩容器，`scroll={{ y: scrollY }}`                                                   | 否，零改动       |
| [use-authorization.ts](file:///Users/qihaibing/Documents/Trae/fitness-room-react/src/hooks/use-authorization.ts)   | 新增设备权限点后判断「新增/编辑/删除」按钮显隐                                                        | 否，仅扩权限目录 |

> 结论：4 个 hook 全部**按调用约定直接接入**，不改 hook 内部实现。唯一新增的是权限点目录与 feature 自身的 api/组件。

## 需求 → 实现对照

| 需求                                                               | 落点                                                      |
| ------------------------------------------------------------------ | --------------------------------------------------------- |
| 列表分页（默认每页 10）、按购入日期倒序                            | `features/equipment/api/get-equipment-list.ts` + mock     |
| 搜索：设备名称模糊；筛选：状态、类型（白名单）                     | `components/equipment-list-search.tsx`，条件进 URL params |
| 列：设备编号 / 名称 / 类型 / 状态 Tag / 存放位置 / 购入日期 / 操作 | `components/equipment-columns.tsx`                        |
| 新增设备（编号由 mock 生成）                                       | `components/equipment-form-modal.tsx`（新增/编辑共用）    |
| 编辑设备（回填表单）                                               | 同上                                                      |
| 行内删除（二次确认）                                               | `hooks/use-equipment-actions.ts` + `Modal.confirm`        |
| 批量删除（跨页勾选）                                               | 工具栏按钮 + `useRowSelection`                            |
| 按钮权限显隐                                                       | `useAuthorization` + `lib/permissions.ts` 新增权限点      |

## 数据模型

- `EquipmentStatus`：`inUse` 在用 / `idle` 闲置 / `maintenance` 维护中 / `scrapped` 已报废
- `Equipment`：`equipmentNo`(唯一键/rowKey)、`name`、`type`、`status`、`location`、`purchasedAt`
- `EquipmentListParams`：`page`、`pageSize`、`keyword?`(名称模糊)、`status?`、`type?`、`sort?`、`order?`
- `CreateEquipmentInput` / `UpdateEquipmentInput`（更新含 `equipmentNo`）

## 涉及文件

- **增**（`src/features/equipment/`）：`types/equipment.ts`、`constants.ts`、`index.ts`、
  `api/get-equipment-list.ts`、`api/create-equipment.ts`、`api/update-equipment.ts`、`api/delete-equipment.ts`、
  `components/equipment-columns.tsx`、`components/equipment-list-search.tsx`、`components/equipment-form-modal.tsx`、
  `hooks/use-equipment-actions.ts`、`utils/format.ts`（+ `utils/format.test.ts`）
- **增**：`src/pages/equipment/index.tsx`
- **改**：`src/router/index.tsx`（加 `/equipment`）、`src/layouts/basic-layout.tsx`（加菜单项与面包屑）、
  `src/lib/permissions.ts`（加设备权限点）、`src/api/mock.ts`（加 `/equipment*` handler + 种子数据）

## 已定决策（用户已确认）

1. **功能范围**：列表 + 筛选 + 新增/编辑/删除 +「批量删除」。
2. **字段模型**：编号 / 名称 / 类型 / 状态 / 存放位置 / 购入日期。
3. **数据层**：扩展 `src/api/mock.ts`，支持 GET 列表与增删改，本地可完整走查。
4. **权限点**：新增 `EQUIPMENT_CREATE` / `EQUIPMENT_UPDATE` / `EQUIPMENT_DELETE`；`MOCK_USER_PERMISSIONS` 默认全授予（保证功能可走查），注释说明「去掉任一权限点即可验证按钮隐藏」。

## 关键决策

- **无**（上述 4 点已确认；钩子复用按上表零改动接入）。

---

## 阶段 0 · 领域模型与工具

- [x] 0.1 `types/equipment.ts`：`EquipmentStatus`、`Equipment`、`EquipmentListParams`、`CreateEquipmentInput`、`UpdateEquipmentInput`
- [x] 0.2 `constants.ts`：`EQUIPMENT_STATUS_TEXT` + `EQUIPMENT_STATUS_COLOR`、`EQUIPMENT_TYPE_OPTIONS`、`EQUIPMENT_STATUS_OPTIONS`、`PAGE_SIZE_OPTIONS`、`DEFAULT_PAGE_SIZE`
- [x] 0.3 `utils/format.ts`：`formatEquipmentStatus`、`isDeletable`（仅「闲置」「已报废」可删）；`utils/format.test.ts` 覆盖各状态

## 阶段 1 · API 层 + Mock

- [x] 1.1 `api/get-equipment-list.ts`（`GET /equipment`）、`create-equipment.ts`（`POST /equipment`）、`update-equipment.ts`（`POST /equipment/update`）、`delete-equipment.ts`（`POST /equipment/delete`，入参 `{ equipmentNos: string[] }`）
- [x] 1.2 `src/api/mock.ts`：种子数据 26 条（覆盖 4 状态 / 6 类型 / 5 位置）；GET 支持 名称模糊 + 状态/类型白名单 + 购入日期倒序 + 分页；POST 新增（`EQ` + 自增序号）、更新、删除（批量，含「在用/维护中」拒绝）；沿用 401 校验与 `delay`
- [x] 1.3 `index.ts` 汇总出口（类型 / 常量 / api 含 `DeleteEquipmentInput` / 组件 / hooks）

## 阶段 2 · 页面与路由

- [x] 2.1 `pages/equipment/index.tsx`：接 `useListQuery`（`fetcher/fields/extraParams` 均模块级常量）、`useRowSelection`、`useTableScrollY`、`useAuthorization`、`useEquipmentActions`；`Card` + 搜索 + 工具栏 + `Table`（结构对齐订单页）
- [x] 2.2 `components/equipment-list-search.tsx`：名称（模糊）+ 状态 + 类型筛选，查询/重置回第 1 页并清空选中
- [x] 2.3 `components/equipment-columns.tsx`：列定义 + 操作列（编辑/删除，按权限与可删状态显隐）
- [x] 2.4 `components/equipment-form-modal.tsx`：新增/编辑共用弹窗（名称/类型/状态/位置/购入日期，含校验；DatePicker + dayjs）
- [x] 2.5 `hooks/use-equipment-actions.ts`：新增/编辑弹窗开关、行内删除（confirm）、批量删除（校验可删资格 + confirm + 批后清选中 + reload）
- [x] 2.6 `router/index.tsx` 加 `/equipment` 懒加载路由；`basic-layout.tsx` 改「分支式」菜单高亮 + 面包屑（新增设备管理分支）

## 阶段 3 · 权限

- [x] 3.1 `lib/permissions.ts` 增 `EQUIPMENT_CREATE/UPDATE/DELETE`，加入 `MOCK_USER_PERMISSIONS`
- [x] 3.2 页面按 `useAuthorization` 控制新增/编辑/删除入口显隐

## 阶段 4 · 校验与走查

- [x] 4.1 `pnpm exec vp check` 全绿（63 文件零告警）+ `pnpm exec vp test` 21 passed
- [x] 4.2 浏览器走查（两轮，全部通过）：菜单高亮/面包屑；表头与「共 26 条」；名称/状态/类型/组合筛选均进 URL 且可后退还原；分页 page=2；新增后列表可见（EQ0027）；编辑回填与保存生效；行内删除与跨行批量删除生效
- [ ] 4.3（可选）`e2e/equipment-list.spec.ts`：覆盖列表加载与新增流程

---

## 当前状态

- **阶段 0→4（4.3 可选除外）全部完成**。
- 校验：`pnpm exec vp check` 全绿（63 文件）；`pnpm exec vp test` 4 文件 / 21 用例通过。
- 全局 hooks 复用结论：`useListQuery` / `useRowSelection` / `useTableScrollY` / `useAuthorization` **均零改动接入**，未修改任何 hook 内部实现；本次新增仅限 `features/equipment/` + 页面 + 权限点 + 路由/菜单 + mock。
- 走查关键点：筛选与分页状态全部落在 URL（`keyword`/`status`/`type`/`page`），浏览器后退可还原条件与结果；无控制台 error。
- 已知非阻断项：mock 数据存于内存，刷新页面即复位；`antd` 下拉为非原生 select，自动化需键盘交互（非缺陷）。
- 待办（未做，需用户指定）：4.3 e2e 用例。
