// 页面层只做组装：经 feature 公共 API（index.ts）消费，禁止深层导入其内部路径。
import { getMembers } from "../../features/member";
import type { Member, MemberListParams } from "../../features/member";

export async function loadMembers(params: MemberListParams): Promise<Member[]> {
  return getMembers(params);
}
