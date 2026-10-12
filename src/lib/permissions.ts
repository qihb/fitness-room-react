/**
 * 权限点目录（PBAC，基于权限点）。集中定义，供 store（用户权限）与页面（判断）共同引用。
 * 前端权限只做体验控制（按钮显隐），**越权以服务端鉴权为准**，不作为安全边界。
 */
export const PERMISSION = {
  /** 订单导出：按列表 Tab（状态维度）逐项授权，由业务方在权限配置中开通。 */
  ORDER_EXPORT_ALL: "order:export:all",
  ORDER_EXPORT_IN_PROGRESS: "order:export:inProgress",
  ORDER_EXPORT_EXPIRED: "order:export:expired",
  ORDER_EXPORT_COMPLETED: "order:export:completed",
  ORDER_EXPORT_CANCELLED: "order:export:cancelled",
  /** 设备管理：新增 / 编辑 / 删除，分别独立授权。 */
  EQUIPMENT_CREATE: "equipment:create",
  EQUIPMENT_UPDATE: "equipment:update",
  EQUIPMENT_DELETE: "equipment:delete",
} as const;

/**
 * mock 登录用户的默认权限：业务方仅授予「已完成」Tab 的导出权限，
 * 其余状态待业务方自行开通（真实项目应由登录接口返回权限点）。
 * 设备管理三项默认全授予，便于本地走查；去掉任一权限点即可验证对应入口隐藏。
 */
export const MOCK_USER_PERMISSIONS: string[] = [
  PERMISSION.ORDER_EXPORT_COMPLETED,
  PERMISSION.ORDER_EXPORT_ALL,
  PERMISSION.EQUIPMENT_CREATE,
  PERMISSION.EQUIPMENT_UPDATE,
  PERMISSION.EQUIPMENT_DELETE,
];
