import type { ApiResponse } from "@/api/types";
import { request } from "@/api/request";
import type { Equipment, UpdateEquipmentInput } from "../types/equipment";

/** 更新设备信息（按设备编号定位）。 */
export async function updateEquipment(input: UpdateEquipmentInput): Promise<Equipment> {
  const { data } = await request.post<ApiResponse<Equipment>>("/equipment/update", input);
  return data.data;
}
