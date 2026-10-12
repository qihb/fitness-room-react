import type { ApiResponse } from "@/api/types";
import { request } from "@/api/request";
import type { CreateEquipmentInput, Equipment } from "../types/equipment";

/** 新增设备；设备编号由服务端生成。 */
export async function createEquipment(input: CreateEquipmentInput): Promise<Equipment> {
  const { data } = await request.post<ApiResponse<Equipment>>("/equipment", input);
  return data.data;
}
