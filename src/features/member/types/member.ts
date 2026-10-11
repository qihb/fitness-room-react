/** 会员领域实体。 */
export interface Member {
  id: string;
  name: string;
  phone: string;
  status: "active" | "expired";
}

/** 会员列表查询参数。 */
export interface MemberListParams {
  page: number;
  pageSize: number;
}
