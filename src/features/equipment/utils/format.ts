import { EQUIPMENT_STATUS_TEXT } from "../constants";
import type { EquipmentStatus } from "../types/equipment";

/** 设备状态 → 展示文案。 */
export function formatEquipmentStatus(status: EquipmentStatus): string {
  return EQUIPMENT_STATUS_TEXT[status];
}

/**
 * 是否可删除：仅「闲置」「已报废」设备可直接删除；
 * 「在用」「维护中」需先调整状态，避免误删在用设备。
 */
export function isDeletable(status: EquipmentStatus): boolean {
  return status === "idle" || status === "scrapped";
}
