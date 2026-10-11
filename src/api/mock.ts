import { AxiosHeaders, getAdapter } from "axios";
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
const MIN_YEARS = 1;
const MAX_YEARS = 10;

/** Tab → 覆盖的状态集合（与前端 constants 保持一致）。 */
const TAB_STATUS: Record<string, MockStatus[]> = {
  inProgress: ["pendingAudit", "pendingCard", "pendingShip"],
  expired: ["expired"],
  completed: ["completed"],
  cancelled: ["cancelled"],
};

/** 种子数据：覆盖全部 6 种状态，并含 0 与空值金额。 */
const seedOrders: MockOrder[] = [
  {
    orderNo: "20261011001",
    memberName: "张三",
    phone: "13800000001",
    years: 1,
    amount: 1200,
    status: "pendingAudit",
    createdAt: "2026-10-11 09:12",
  },
  {
    orderNo: "20261010002",
    memberName: "李四",
    phone: "13800000002",
    years: 3,
    amount: 3600,
    status: "pendingCard",
    createdAt: "2026-10-10 14:30",
  },
  {
    orderNo: "20261009003",
    memberName: "王五",
    phone: "13800000003",
    years: 5,
    amount: 4800,
    status: "pendingShip",
    createdAt: "2026-10-09 18:05",
  },
  {
    orderNo: "20261008004",
    memberName: "赵六",
    phone: "13800000004",
    years: 2,
    amount: 2400,
    status: "expired",
    createdAt: "2026-10-08 11:48",
  },
  {
    orderNo: "20261007005",
    memberName: "钱七",
    phone: "13800000005",
    years: 1,
    amount: 0,
    status: "expired",
    createdAt: "2026-10-07 10:20",
  },
  {
    orderNo: "20261006006",
    memberName: "孙八",
    phone: "13800000006",
    years: 4,
    amount: null,
    status: "completed",
    createdAt: "2026-10-06 16:40",
  },
  {
    orderNo: "20261005007",
    memberName: "周九",
    phone: "13800000007",
    years: 2,
    amount: 2400,
    status: "cancelled",
    createdAt: "2026-10-05 08:15",
  },
  {
    orderNo: "20261004008",
    memberName: "张三丰",
    phone: "13800000008",
    years: 1,
    amount: 1200,
    status: "completed",
    createdAt: "2026-10-04 20:05",
  },
];

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

function fail(config: InternalAxiosRequestConfig, message: string): AxiosResponse {
  return respond(config, { code: 1, message, data: null }, 400);
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
    orderNo: `20261011${String(nextId).padStart(3, "0")}`,
    memberName: body.memberName,
    phone: body.phone,
    years,
    amount: years * PRICE_PER_YEAR,
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

  if (config.url === "/orders") {
    await delay(300);
    if (method === "get") {
      return listOrders(config);
    }
    if (method === "post") {
      return createOrder(config);
    }
  }
  if (config.url === "/orders/renew" && method === "post") {
    await delay(300);
    return renewOrders(config);
  }
  if (config.url === "/orders/cancel" && method === "post") {
    await delay(300);
    return cancelOrders(config);
  }

  return fallbackAdapter(config);
};
