/** 后端统一响应结构。 */
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

/** 分页数据的通用结构。 */
export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}
