import type { ApiResponse } from "@/api/types";
import { request } from "@/api/request";
import type { Equipment } from "../types/equipment";

/** 批量删除入参：仅「闲置」「已报废」设备可删，由接口层兜底校验。 */
export interface DeleteEquipmentInput {
  equipmentNos: string[];
}

/** 批量删除设备（单条亦复用此接口）。 */
export async function deleteEquipment(input: DeleteEquipmentInput): Promise<Equipment[]> {
  const { data } = await request.post<ApiResponse<Equipment[]>>("/equipment/delete", input);
  return data.data;
}
