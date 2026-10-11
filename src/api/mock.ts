import { AxiosError, AxiosHeaders, getAdapter } from "axios";
import axios from "axios";
import dayjs from "dayjs";
import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from "axios";

/**
 * 零依赖 mock：用自定义 axios adapter 短路 `/orders*` 请求。
 * 未命中的请求回落到默认 adapter，保证后续接入真实接口时无需改动。
 * 仅在前端无后端的演示场景使用；由 `VITE_USE_MOCK` 开关控制。
 */

interface MockApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

type MockStatus =
  | "pendingAudit"
  | "pendingCard"
  | "pendingShip"
  | "expired"
  | "completed"
  | "cancelled";

interface MockOrder {
  orderNo: string;
  memberName: string;
  phone: string;
  years: number;
  amount: number | null;
  status: MockStatus;
  createdAt: string;
}

const PRICE_PER_YEAR = 1200;
const DISCOUNT_THRESHOLD_YEARS = 5;
const DISCOUNT_RATE = 0.8;
const MIN_YEARS = 1;
const MAX_YEARS = 10;

/** Tab → 覆盖的状态集合（与前端 constants 保持一致）。 */
const TAB_STATUS: Record<string, MockStatus[]> = {
  inProgress: ["pendingAudit", "pendingCard", "pendingShip"],
  expired: ["expired"],
  completed: ["completed"],
  cancelled: ["cancelled"],
};

/** 种子基准日：最新一条；其余按天递减，保证排序与分页稳定可复现。 */
const SEED_BASE_DATE = "2026-10-11 09:00";

/** 会员姓名池：故意保留少量重名，便于「姓名模糊搜索」演示。 */
const MEMBER_NAMES = [
  "张三",
  "李四",
  "王五",
  "赵六",
  "钱七",
  "孙八",
  "周九",
  "吴十",
  "郑十一",
  "王芳",
  "李娜",
  "张伟",
];

interface SeedSpec {
  status: MockStatus;
  years: number;
  /** 覆盖金额：用于构造 0 / null 边界样本；缺省按年限计价（≥5 年 8 折）。 */
  amount?: number | null;
}

/**
 * 种子规格：共 42 条（> 30），覆盖全部 6 种状态
 * 进行中 24（待审核/待制卡/待寄卡 各 8）、已到期 8、已完成 6、已取消 4。
 */
const SEED_SPECS: SeedSpec[] = [
  // 待审核 × 8
  { status: "pendingAudit", years: 1 },
  { status: "pendingAudit", years: 3 },
  { status: "pendingAudit", years: 5 },
  { status: "pendingAudit", years: 2 },
  { status: "pendingAudit", years: 1 },
  { status: "pendingAudit", years: 10 },
  { status: "pendingAudit", years: 4 },
  { status: "pendingAudit", years: 2 },
  // 待制卡 × 8
  { status: "pendingCard", years: 1 },
  { status: "pendingCard", years: 2 },
  { status: "pendingCard", years: 6 },
  { status: "pendingCard", years: 3 },
  { status: "pendingCard", years: 1 },
  { status: "pendingCard", years: 5 },
  { status: "pendingCard", years: 2 },
  { status: "pendingCard", years: 4 },
  // 待寄卡 × 8
  { status: "pendingShip", years: 1 },
  { status: "pendingShip", years: 7 },
  { status: "pendingShip", years: 2 },
  { status: "pendingShip", years: 3 },
  { status: "pendingShip", years: 1 },
  { status: "pendingShip", years: 5 },
  { status: "pendingShip", years: 2 },
  { status: "pendingShip", years: 4 },
  // 已到期 × 8（含 0 金额样本）
  { status: "expired", years: 1 },
  { status: "expired", years: 2, amount: 0 },
  { status: "expired", years: 3 },
  { status: "expired", years: 5 },
  { status: "expired", years: 1 },
  { status: "expired", years: 4 },
  { status: "expired", years: 2 },
  { status: "expired", years: 8 },
  // 已完成 × 6（含 null 金额样本）
  { status: "completed", years: 3, amount: null },
  { status: "completed", years: 1 },
  { status: "completed", years: 6 },
  { status: "completed", years: 2 },
  { status: "completed", years: 5 },
  { status: "completed", years: 1 },
  // 已取消 × 4
  { status: "cancelled", years: 2 },
  { status: "cancelled", years: 1 },
  { status: "cancelled", years: 3 },
  { status: "cancelled", years: 5 },
];

/** 按年限计价：≥ 5 年打 8 折。 */
function calcAmount(years: number): number {
  const base = years * PRICE_PER_YEAR;
  return years >= DISCOUNT_THRESHOLD_YEARS ? Math.round(base * DISCOUNT_RATE) : base;
}

/**
 * Fisher–Yates 洗牌：种子规格随机分布，避免各状态在列表中聚堆（每次刷新分布不同）。
 * 仅在模块初始化时执行一次，会话内数据不变，分页/排序仍稳定。
 */
function shuffle<T>(list: readonly T[]): T[] {
  const result = [...list];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** 种子数据：6 种状态全覆盖（洗牌随机分布），含 0 / null 金额与重名会员。 */
const seedOrders: MockOrder[] = shuffle(SEED_SPECS).map((spec, index) => {
  const date = dayjs(SEED_BASE_DATE).subtract(index, "day");
  return {
    orderNo: `${date.format("YYYYMMDD")}${String(index + 1).padStart(3, "0")}`,
    memberName: MEMBER_NAMES[index % MEMBER_NAMES.length],
    phone: `138${String(10000000 + index)}`,
    years: spec.years,
    amount: spec.amount === undefined ? calcAmount(spec.years) : spec.amount,
    status: spec.status,
    createdAt: date.format("YYYY-MM-DD HH:mm"),
  };
});

/** 内存态数据：写操作会直接改内存（刷新后重置）。 */
const orders: MockOrder[] = [...seedOrders];
let nextId = seedOrders.length + 1;

const fallbackAdapter = getAdapter(axios.defaults.adapter ?? ["xhr", "http", "fetch"]);

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function parseBody<T>(config: InternalAxiosRequestConfig): T {
  return (typeof config.data === "string" ? JSON.parse(config.data) : config.data) as T;
}

function respond<T>(
  config: InternalAxiosRequestConfig,
  body: MockApiResponse<T>,
  status = 200,
): AxiosResponse<MockApiResponse<T>> {
  return {
    data: body,
    status,
    statusText: status < 400 ? "OK" : "Error",
    headers: new AxiosHeaders({ "Content-Type": "application/json" }),
    config,
  };
}

/**
 * 抛出 AxiosError：自定义 adapter 直接 resolve 会绕过 axios 内置的 validateStatus，
 * 导致 4xx/5xx 被当作成功。这里显式抛错，交由响应拦截器的失败分支统一处理。
 */
function reject(config: InternalAxiosRequestConfig, message: string, status: number): never {
  throw new AxiosError(
    message,
    status >= 500 ? "ERR_BAD_RESPONSE" : "ERR_BAD_REQUEST",
    config,
    null,
    respond(config, { code: status, message, data: null }, status),
  );
}

/** 400 业务失败（如不满足续卡/撤单条件）。 */
function fail(config: InternalAxiosRequestConfig, message: string): never {
  reject(config, message, 400);
}

/** 401 未授权：供登录态失效流程联调。 */
function unauthorized(config: InternalAxiosRequestConfig): never {
  reject(config, "登录已过期", 401);
}

/** 读取请求头中的 Authorization（AxiosHeaders 用 get 取值最稳）。 */
function readAuthorization(config: InternalAxiosRequestConfig): string | undefined {
  const value = config.headers.get("Authorization");
  return typeof value === "string" ? value : undefined;
}

/** 单次导出条数上限：接口层兜底，超过直接拒绝（订单百万级，前端不支持全量导出）。 */
const EXPORT_MAX_ROWS = 500;

/** 列表 / 导出共用的过滤：Tab 状态 + 订单号精确 + 姓名模糊。 */
function filterOrders(params: {
  tab?: string;
  orderNo?: string;
  memberName?: string;
}): MockOrder[] {
  let list = [...orders];

  const statuses = params.tab ? TAB_STATUS[params.tab] : undefined;
  if (statuses) {
    list = list.filter((order) => statuses.includes(order.status));
  }
  if (params.orderNo) {
    list = list.filter((order) => order.orderNo === params.orderNo);
  }
  const keyword = params.memberName?.trim();
  if (keyword) {
    list = list.filter((order) => order.memberName.includes(keyword));
  }
  return list;
}

/**
 * GET /orders/export：有勾选按勾选，否则按 Tab + 搜索条件返回**全量**匹配数据。
 * 超过 `EXPORT_MAX_ROWS` 时按 400 拒绝，模拟接口层的数据量兜底。
 */
function exportOrders(config: InternalAxiosRequestConfig): AxiosResponse {
  const params = (config.params ?? {}) as {
    orderNos?: string[];
    tab?: string;
    orderNo?: string;
    memberName?: string;
  };

  const picked = Array.isArray(params.orderNos) ? params.orderNos : [];
  const list =
    picked.length > 0
      ? orders.filter((order) => picked.includes(order.orderNo))
      : filterOrders(params);

  if (list.length > EXPORT_MAX_ROWS) {
    return fail(
      config,
      `导出数据量过大（${list.length} 条，单次上限 ${EXPORT_MAX_ROWS} 条），请缩小查询范围`,
    );
  }

  return respond(config, { code: 0, message: "ok", data: list });
}

/** GET /orders：Tab 筛选 + 订单号精确 + 姓名模糊 + 创建时间倒序 + 分页。 */
function listOrders(config: InternalAxiosRequestConfig): AxiosResponse {
  const params = (config.params ?? {}) as {
    page?: number;
    pageSize?: number;
    tab?: string;
    orderNo?: string;
    memberName?: string;
    order?: string;
  };
  const page = Number(params.page ?? 1) || 1;
  const pageSize = Number(params.pageSize ?? 10) || 10;

  const list = filterOrders(params);

  // 默认创建时间倒序，保证最新创建的订单显示在最前面。
  const desc = params.order !== "asc";
  list.sort((a, b) =>
    desc ? b.createdAt.localeCompare(a.createdAt) : a.createdAt.localeCompare(b.createdAt),
  );

  const start = (page - 1) * pageSize;
  return respond(config, {
    code: 0,
    message: "ok",
    data: { list: list.slice(start, start + pageSize), total: list.length, page, pageSize },
  });
}

/** POST /orders：新建订单，状态初始化为「待审核」。 */
function createOrder(config: InternalAxiosRequestConfig): AxiosResponse {
  const body = parseBody<{ memberName: string; phone: string; years: number; remark?: string }>(
    config,
  );
  const years = Number(body.years);

  const order: MockOrder = {
    orderNo: `${dayjs().format("YYYYMMDD")}${String(nextId).padStart(3, "0")}`,
    memberName: body.memberName,
    phone: body.phone,
    years,
    amount: calcAmount(years),
    status: "pendingAudit",
    createdAt: dayjs().format("YYYY-MM-DD HH:mm"),
  };
  nextId += 1;
  orders.unshift(order);

  return respond(config, { code: 0, message: "ok", data: order }, 201);
}

/** POST /orders/renew：仅「已到期」可续，年限累加且状态回到「待审核」。 */
function renewOrders(config: InternalAxiosRequestConfig): AxiosResponse {
  const body = parseBody<{ orderNos: string[]; years: number }>(config);
  const years = Number(body.years);
  if (!Number.isInteger(years) || years < MIN_YEARS || years > MAX_YEARS) {
    return fail(config, `续卡年限需为 ${MIN_YEARS}~${MAX_YEARS} 的整数`);
  }

  const targets = orders.filter((order) => body.orderNos.includes(order.orderNo));
  const invalid = targets.filter((order) => order.status !== "expired");
  if (invalid.length > 0) {
    return fail(
      config,
      `以下订单不满足续卡条件：${invalid.map((order) => order.orderNo).join("、")}`,
    );
  }

  targets.forEach((order) => {
    order.years += years;
    order.status = "pendingAudit";
  });

  return respond(config, { code: 0, message: "ok", data: targets });
}

/** POST /orders/cancel：仅「待制卡」「待寄卡」可撤，状态变更为「已取消」。 */
function cancelOrders(config: InternalAxiosRequestConfig): AxiosResponse {
  const body = parseBody<{ orderNos: string[] }>(config);

  const targets = orders.filter((order) => body.orderNos.includes(order.orderNo));
  const invalid = targets.filter(
    (order) => order.status !== "pendingCard" && order.status !== "pendingShip",
  );
  if (invalid.length > 0) {
    return fail(
      config,
      `以下订单不满足撤单条件：${invalid.map((order) => order.orderNo).join("、")}`,
    );
  }

  targets.forEach((order) => {
    order.status = "cancelled";
  });

  return respond(config, { code: 0, message: "ok", data: targets });
}

export const mockAdapter: AxiosAdapter = async (config) => {
  const method = (config.method ?? "get").toLowerCase();
  const url = config.url;

  const isOrders = url === "/orders";
  const isExport = url === "/orders/export" && method === "get";
  const isRenew = url === "/orders/renew" && method === "post";
  const isCancel = url === "/orders/cancel" && method === "post";

  if (isOrders || isExport || isRenew || isCancel) {
    await delay(300);

    // 401 模拟：无 token 或非法 token（`Bearer invalid`）时拒绝，便于验证登录态失效流程。
    const authorization = readAuthorization(config);
    if (!authorization || authorization === "Bearer invalid") {
      return unauthorized(config);
    }

    if (isOrders && method === "get") {
      return listOrders(config);
    }
    if (isOrders && method === "post") {
      return createOrder(config);
    }
    if (isExport) {
      return exportOrders(config);
    }
    if (isRenew) {
      return renewOrders(config);
    }
    if (isCancel) {
      return cancelOrders(config);
    }
  }

  return fallbackAdapter(config);
};
