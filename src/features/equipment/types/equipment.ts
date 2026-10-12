/** 设备状态：覆盖设备台账的完整生命周期。 */
export type EquipmentStatus =
  | "inUse" // 在用
  | "idle" // 闲置
  | "maintenance" // 维护中
  | "scrapped"; // 已报废

/** 设备领域实体。 */
export interface Equipment {
  /** 设备编号，全局唯一（表格 rowKey）。 */
  equipmentNo: string;
  name: string;
  type: string;
  status: EquipmentStatus;
  /** 存放位置。 */
  location: string;
  /** 购入日期（YYYY-MM-DD）。 */
  purchasedAt: string;
}

/** 设备列表查询参数。 */
export interface EquipmentListParams {
  page: number;
  pageSize: number;
  /** 设备名称，模糊匹配。 */
  keyword?: string;
  status?: EquipmentStatus;
  type?: string;
  sort?: "purchasedAt";
  order?: "asc" | "desc";
}

/** 新增设备入参（设备编号由服务端生成）。 */
export interface CreateEquipmentInput {
  name: string;
  type: string;
  status: EquipmentStatus;
  location: string;
  purchasedAt: string;
}

/** 更新设备入参。 */
export interface UpdateEquipmentInput extends CreateEquipmentInput {
  equipmentNo: string;
}
