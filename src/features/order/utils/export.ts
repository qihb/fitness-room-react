import type { Order } from "../types/order";
import { formatAmount, formatOrderStatus } from "./format";

/** CSV 换行符：RFC 4180 用 CRLF，Excel 兼容性最好。 */
const CSV_NEWLINE = "\r\n";

/** UTF-8 BOM：避免 Excel 直接打开时中文乱码。 */
const BOM = "\uFEFF";

/**
 * 导出列定义：顺序即表头顺序；`value` 把订单字段转成单元格文本。
 * `forceText`：让 Excel 按文本解析，避免长数字 / 日期被自动转成科学计数法或 ###。
 */
const EXPORT_COLUMNS: { title: string; value: (order: Order) => string; forceText?: boolean }[] = [
  { title: "订单号", value: (order) => order.orderNo, forceText: true },
  { title: "会员姓名", value: (order) => order.memberName },
  { title: "手机号", value: (order) => order.phone, forceText: true },
  { title: "购卡年限", value: (order) => String(order.years) },
  { title: "订单金额", value: (order) => formatAmount(order.amount) },
  { title: "状态", value: (order) => formatOrderStatus(order.status) },
  { title: "创建时间", value: (order) => order.createdAt, forceText: true },
];

/** RFC 4180：字段含逗号/引号/换行时用双引号包裹，内部引号翻倍。 */
export function escapeCsvField(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/**
 * Excel 强制文本：写成 `="值"` 公式，让 Excel 按文本解析，
 * 避免长数字（订单号/手机号）被转成科学计数法或列宽不足时显示 ###。
 */
function toExcelTextCell(value: string): string {
  return `="${value}"`;
}

/**
 * 订单列表 → 带 BOM 的 CSV 文本。
 * 导出范围（勾选 / 查询条件）与数据量上限均由调用方与接口层保证，本函数只负责序列化。
 */
export function buildOrdersCsv(orders: Order[]): string {
  const rows = [
    EXPORT_COLUMNS.map((column) => escapeCsvField(column.title)).join(","),
    ...orders.map((order) =>
      EXPORT_COLUMNS.map((column) => {
        const value = column.value(order);
        return escapeCsvField(column.forceText ? toExcelTextCell(value) : value);
      }).join(","),
    ),
  ];
  return `${BOM}${rows.join(CSV_NEWLINE)}`;
}

const pad2 = (value: number) => String(value).padStart(2, "0");

/** 文件名片段降级：去掉文件系统不允许的字符，避免操作人昵称破坏文件名。 */
function sanitizeFilenamePart(value: string): string {
  return value.replace(/[\\/:*?"<>|]/g, "_");
}

/**
 * 生成导出文件名：`订单导出_<Tab状态>_<导出时间>_<操作人>.csv`。
 * 操作人缺失时省略该段。
 */
export function buildExportFilename(params: {
  tabLabel: string;
  operator?: string;
  now?: Date;
}): string {
  const { tabLabel, operator, now = new Date() } = params;
  const stamp = `${now.getFullYear()}${pad2(now.getMonth() + 1)}${pad2(now.getDate())}-${pad2(
    now.getHours(),
  )}${pad2(now.getMinutes())}${pad2(now.getSeconds())}`;
  const parts = ["订单导出", sanitizeFilenamePart(tabLabel), stamp];
  if (operator) {
    parts.push(sanitizeFilenamePart(operator));
  }
  return `${parts.join("_")}.csv`;
}

/** 把 CSV 文本作为文件触发浏览器下载。 */
export function downloadCsv(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
