import { AxiosHeaders, getAdapter } from "axios";
import axios from "axios";
import dayjs from "dayjs";
import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from "axios";

/**
 * 零依赖 mock：用自定义 axios adapter 短路 `/orders` 请求。
 * 未命中的请求回落到默认 adapter，保证后续接入真实接口时无需改动。
 * 仅在前端无后端的演示场景使用；由 `VITE_USE_MOCK` 开关控制。
 */

interface MockApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

interface MockOrder {
  id: string;
  customer: string;
  product: string;
  amount: number;
  status: "pending" | "paid" | "cancelled";
  createdAt: string;
}

const seedOrders: MockOrder[] = [
  {
    id: "1",
    customer: "张三",
    product: "年卡",
    amount: 2999,
    status: "paid",
    createdAt: "2026-10-08 09:12",
  },
  {
    id: "2",
    customer: "李四",
    product: "月卡",
    amount: 299,
    status: "pending",
    createdAt: "2026-10-09 14:30",
  },
  {
    id: "3",
    customer: "王五",
    product: "私教课 10 节",
    amount: 3000,
    status: "paid",
    createdAt: "2026-10-09 18:05",
  },
  {
    id: "4",
    customer: "赵六",
    product: "季卡",
    amount: 799,
    status: "cancelled",
    createdAt: "2026-10-10 11:48",
  },
];

/** 内存态数据：新建订单会在列表顶部追加（刷新后重置）。 */
const orders: MockOrder[] = [...seedOrders];
let nextId = seedOrders.length + 1;

const fallbackAdapter = getAdapter(axios.defaults.adapter ?? ["xhr", "http", "fetch"]);

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

function listOrders(config: InternalAxiosRequestConfig): AxiosResponse {
  const params = (config.params ?? {}) as { page?: number; pageSize?: number };
  const page = Number(params.page ?? 1) || 1;
  const pageSize = Number(params.pageSize ?? 10) || 10;
  const start = (page - 1) * pageSize;

  return respond(config, {
    code: 0,
    message: "ok",
    data: { list: orders.slice(start, start + pageSize), total: orders.length, page, pageSize },
  });
}

function createOrder(config: InternalAxiosRequestConfig): AxiosResponse {
  const body = (typeof config.data === "string" ? JSON.parse(config.data) : config.data) as {
    customer: string;
    product: string;
    amount: number;
  };

  const order: MockOrder = {
    id: String(nextId++),
    customer: body.customer,
    product: body.product,
    amount: body.amount,
    status: "pending",
    createdAt: dayjs().format("YYYY-MM-DD HH:mm"),
  };
  orders.unshift(order);

  return respond(config, { code: 0, message: "ok", data: order }, 201);
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

  return fallbackAdapter(config);
};
