import { describe, expect, it } from "vite-plus/test";
import type { Order } from "../types/order";
import { buildExportFilename, buildOrdersCsv, escapeCsvField } from "./export";

function makeOrder(patch: Partial<Order> = {}): Order {
  return {
    orderNo: "20261011001",
    memberName: "张三",
    phone: "13810000000",
    years: 1,
    amount: 1200,
    status: "pendingCard",
    createdAt: "2026-10-11 09:00",
    ...patch,
  };
}

describe("order export", () => {
  it("CSV 字段按 RFC 4180 转义", () => {
    expect(escapeCsvField("普通")).toBe("普通");
    expect(escapeCsvField("含,逗号")).toBe('"含,逗号"');
    expect(escapeCsvField('含"引号')).toBe('"含""引号"');
    expect(escapeCsvField("含\n换行")).toBe('"含\n换行"');
  });

  it("生成带 BOM 的 CSV：表头固定、金额千分位、内容转义", () => {
    const content = buildOrdersCsv([
      makeOrder({ orderNo: "A1", status: "completed", amount: 12000 }),
      makeOrder({
        orderNo: "A4",
        status: "pendingShip",
        memberName: '王,五"',
        amount: null,
      }),
    ]);

    const lines = content.replace(/^\uFEFF/, "").split("\r\n");
    expect(content.startsWith("\uFEFF")).toBe(true);
    expect(lines[0]).toBe("订单号,会员姓名,手机号,购卡年限,订单金额,状态,创建时间");
    expect(lines[1]).toBe('A1,张三,13810000000,1,"12,000.00",已完成,2026-10-11 09:00');
    expect(lines[2]).toBe('A4,"王,五""",13810000000,1,0.00,待寄卡,2026-10-11 09:00');
  });

  it("空列表只保留表头", () => {
    expect(buildOrdersCsv([]).replace(/^\uFEFF/, "")).toBe(
      "订单号,会员姓名,手机号,购卡年限,订单金额,状态,创建时间",
    );
  });

  it("文件名 = 订单导出_<Tab状态>_<时间>_<操作人>", () => {
    const now = new Date(2026, 9, 11, 14, 30, 22);
    expect(buildExportFilename({ tabLabel: "已完成", operator: "张三", now })).toBe(
      "订单导出_已完成_20261011-143022_张三.csv",
    );
    expect(buildExportFilename({ tabLabel: "全部", now })).toBe(
      "订单导出_全部_20261011-143022.csv",
    );
  });

  it("文件名降级非法字符", () => {
    expect(
      buildExportFilename({
        tabLabel: "已完成",
        operator: 'a/b:c"d',
        now: new Date(2026, 9, 11, 14, 30, 22),
      }),
    ).toBe("订单导出_已完成_20261011-143022_a_b_c_d.csv");
  });
});
