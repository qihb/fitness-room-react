import type { ApiResponse, PageResult } from "@/api/types";
import { request } from "@/api/request";
import type { Equipment, EquipmentListParams } from "../types/equipment";

/** 查询设备列表（分页），统一走项目唯一的 axios 实例。 */
export async function getEquipmentList(
  params: EquipmentListParams,
): Promise<PageResult<Equipment>> {
  const { data } = await request.get<ApiResponse<PageResult<Equipment>>>("/equipment", { params });
  return data.data;
}
