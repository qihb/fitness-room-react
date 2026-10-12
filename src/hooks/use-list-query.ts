import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import type { PageResult } from "@/api/types";

/**
 * 列表查询通用 hook：把「URL search params ⇄ 查询条件 ⇄ 请求」这条链路收敛到一处，
 * 供后台各类 table 列表页复用（分页、筛选、排序、手动重载）。
 *
 * 约定：
 * - **URL 是唯一事实源**：筛选/分页都读写 search params，浏览器前进/后退可还原、链接可分享。
 * - **配置需稳定引用**：`fetcher` / `fields` / `extraParams` / `pageSizeOptions` 必须在组件外声明
 *   （模块级常量或模块级函数），否则每次渲染都是新引用，会被判定为「配置变化」而重复请求。
 * - **状态语义**：切条件的瞬间返回 `loading: true`（不展示旧数据）；过期响应不会覆盖当前结果。
 *
 * @example
 * ```tsx
 * // 组件外声明，保证引用稳定
 * const FIELDS = [{ key: "status", defaultValue: "all", options: ["all", "done"] }];
 * const EXTRA_PARAMS = { sort: "createdAt", order: "desc" } as const;
 *
 * const { data, total, loading, error, params, setParams, resetParams, reload } =
 *   useListQuery<Item, ItemListParams>({
 *     fetcher: getItems,          // 模块级导入的请求函数
 *     fields: FIELDS,             // 模块级常量
 *     extraParams: EXTRA_PARAMS,  // 模块级常量
 *   });
 *
 * setParams({ status: "done", page: 1 }); // 改条件：合并写 URL，空值删除该键
 * resetParams(["status"]);                // 重置指定筛选并回到第 1 页
 * reload();                               // 增删改成功后手动重载
 * ```
 */

/** 默认每页条数可选项。 */
export const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50];
/** 默认每页条数。 */
export const DEFAULT_PAGE_SIZE = 10;

/** 单个筛选字段声明：URL 参数名同时作为请求参数名。 */
export interface ListQueryField {
  key: string;
  /** 读取时兜底值；未声明时按空字符串兜底（视为「无此筛选」）。 */
  defaultValue?: string;
  /** 白名单校验，不命中则回落 defaultValue；不传表示不校验。 */
  options?: readonly string[];
}

/**
 * 列表查询配置。**除 URL 外，各项都必须为稳定引用**（模块级常量 / 模块级函数），
 * 否则每次渲染都会视为新配置而重复请求。
 */
export interface UseListQueryOptions<T, P> {
  /** 查询函数（feature 的 api），如模块级导入的 `getOrders`。 */
  fetcher: (params: P) => Promise<PageResult<T>>;
  /** 筛选条件字段声明（分页字段之外的），如模块级常量。 */
  fields?: readonly ListQueryField[];
  /** 固定附加参数，如 `{ sort: "createdAt", order: "desc" }`，如模块级常量。 */
  extraParams?: Partial<Omit<P, "page" | "pageSize">>;
  /** 每页条数可选项，默认 [10, 20, 50]。 */
  pageSizeOptions?: readonly number[];
  /** 默认每页条数，默认 10。 */
  defaultPageSize?: number;
}

export interface UseListQueryResult<T, P> {
  data: T[];
  total: number;
  loading: boolean;
  error: string | null;
  /** 当前查询参数（含 page/pageSize 与固定附加参数），导出等场景可直接复用。 */
  params: P;
  /** 合并写 URL：null / undefined / "" 删除该键。 */
  setParams: (next: Record<string, string | number | null | undefined>) => void;
  /** 重置指定筛选键（删除参数、回落默认值）并回到第 1 页。 */
  resetParams: (keys: readonly string[]) => void;
  /** 手动重载（增删改成功后）。 */
  reload: () => void;
}

export interface ParsedListQuery {
  page: number;
  pageSize: number;
  /** 已按白名单兜底的筛选条件：字段名 → 取值。 */
  conditions: Record<string, string>;
}

/**
 * 从 URL search params 解析查询条件：`page` 取正整数（否则 1），
 * `pageSize` 取白名单内取值（否则默认值），筛选字段按声明做白名单兜底。
 */
export function parseListQuery(
  searchParams: URLSearchParams,
  config: {
    fields?: readonly ListQueryField[];
    pageSizeOptions?: readonly number[];
    defaultPageSize?: number;
  } = {},
): ParsedListQuery {
  const pageSizeOptions = config.pageSizeOptions ?? DEFAULT_PAGE_SIZE_OPTIONS;
  const defaultPageSize = config.defaultPageSize ?? DEFAULT_PAGE_SIZE;

  const pageParam = Number(searchParams.get("page") ?? "");
  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;

  const pageSizeParam = Number(searchParams.get("pageSize") ?? "");
  const pageSize = pageSizeOptions.includes(pageSizeParam) ? pageSizeParam : defaultPageSize;

  const conditions: Record<string, string> = {};
  (config.fields ?? []).forEach((field) => {
    const raw = searchParams.get(field.key) ?? "";
    const matched = field.options === undefined || field.options.includes(raw);
    conditions[field.key] = matched ? raw : (field.defaultValue ?? "");
  });

  return { page, pageSize, conditions };
}

/** 以现有 search params 为基准合并写入：空值删除该键，其余转字符串写入。 */
export function buildListQueryUpdate(
  current: URLSearchParams,
  next: Record<string, string | number | null | undefined>,
): URLSearchParams {
  const params = new URLSearchParams(current);
  Object.entries(next).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }
  });
  return params;
}

/** 组装请求参数：分页 + 筛选条件 + 固定附加参数。 */
export function buildListQueryParams<P>(parsed: ParsedListQuery, extraParams?: object): P {
  return {
    page: parsed.page,
    pageSize: parsed.pageSize,
    ...parsed.conditions,
    ...extraParams,
  } as P;
}

/**
 * 列表查询通用 hook 主体（用途与用法见文件头部说明）。
 * 切条件瞬间 `loading: true` 由「查询条件指纹」保证；过期响应不覆盖当前结果由 `alive` 标志保证。
 */
export function useListQuery<T, P>(options: UseListQueryOptions<T, P>): UseListQueryResult<T, P> {
  const { fetcher, fields, extraParams, pageSizeOptions, defaultPageSize } = options;
  const [searchParams, setSearchParams] = useSearchParams();
  const [reloadToken, setReloadToken] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    data: T[];
    total: number;
    error: string | null;
  } | null>(null);

  const parsed = parseListQuery(searchParams, { fields, pageSizeOptions, defaultPageSize });
  // 查询条件指纹：命中即视为「已加载」，避免切条件瞬间展示旧数据。
  const queryKey = `${searchParams.toString()}|${reloadToken}`;

  useEffect(() => {
    let alive = true;
    const current = parseListQuery(searchParams, { fields, pageSizeOptions, defaultPageSize });
    fetcher(buildListQueryParams<P>(current, extraParams))
      .then((pageResult) => {
        if (alive) {
          setResult({ key: queryKey, data: pageResult.list, total: pageResult.total, error: null });
        }
      })
      .catch((cause: unknown) => {
        if (alive) {
          setResult({
            key: queryKey,
            data: [],
            total: 0,
            error: cause instanceof Error ? cause.message : "加载失败",
          });
        }
      });
    return () => {
      alive = false;
    };
  }, [
    searchParams,
    reloadToken,
    queryKey,
    fetcher,
    fields,
    extraParams,
    pageSizeOptions,
    defaultPageSize,
  ]);

  const setParams = (next: Record<string, string | number | null | undefined>) => {
    setSearchParams((prev) => buildListQueryUpdate(prev, next));
  };

  const resetParams = (keys: readonly string[]) => {
    const next: Record<string, null | string> = { page: "1" };
    keys.forEach((key) => {
      next[key] = null;
    });
    setSearchParams((prev) => buildListQueryUpdate(prev, next));
  };

  const reload = () => {
    setReloadToken((token) => token + 1);
  };

  // 仅采用与当前查询匹配的结果，切条件瞬间展示 loading 而非旧数据。
  const settled = result?.key === queryKey ? result : null;

  return {
    data: settled?.data ?? [],
    total: settled?.total ?? 0,
    loading: settled === null,
    error: settled?.error ?? null,
    params: buildListQueryParams<P>(parsed, extraParams),
    setParams,
    resetParams,
    reload,
  };
}
