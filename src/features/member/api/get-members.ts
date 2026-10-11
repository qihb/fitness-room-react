import { request } from "../../../api/request";
import type { Member, MemberListParams } from "../types/member";

/** 查询会员列表，统一走项目唯一的 axios 实例。 */
export async function getMembers(params: MemberListParams): Promise<Member[]> {
  const { data } = await request.get<{ data: Member[] }>("/members", { params });
  return data.data;
}
