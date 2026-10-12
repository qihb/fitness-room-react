import type { EquipmentStatus } from "./types/equipment";

/** 列表页每页条数可选项。 */
export const PAGE_SIZE_OPTIONS = [10, 20, 50];

/** 列表页默认每页条数。 */
export const DEFAULT_PAGE_SIZE = 10;

/** 设备状态全集（用于筛选白名单）。 */
export const EQUIPMENT_STATUS_VALUES = ["inUse", "idle", "maintenance", "scrapped"] as const;

/** 设备类型候选项。 */
export const EQUIPMENT_TYPE_OPTIONS = [
  "跑步机",
  "椭圆机",
  "动感单车",
  "划船机",
  "哑铃",
  "综合训练器",
] as const;

/** 状态 → 展示文案。 */
export const EQUIPMENT_STATUS_TEXT: Record<EquipmentStatus, string> = {
  inUse: "在用",
  idle: "闲置",
  maintenance: "维护中",
  scrapped: "已报废",
};

/** 状态 → Tag 颜色。 */
export const EQUIPMENT_STATUS_COLOR: Record<EquipmentStatus, string> = {
  inUse: "green",
  idle: "default",
  maintenance: "gold",
  scrapped: "red",
};

/** 状态筛选项（下拉用）。 */
export const EQUIPMENT_STATUS_OPTIONS: { value: EquipmentStatus; label: string }[] =
  EQUIPMENT_STATUS_VALUES.map((value) => ({ value, label: EQUIPMENT_STATUS_TEXT[value] }));
