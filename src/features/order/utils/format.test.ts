import { describe, expect, it } from "vite-plus/test";
import {
  calcRenewFee,
  formatAmount,
  formatOrderStatus,
  isCancellable,
  isRenewable,
} from "./format";

describe("order format", () => {
  it("格式化订单状态", () => {
    expect(formatOrderStatus("pendingAudit")).toBe("待审核");
    expect(formatOrderStatus("pendingCard")).toBe("待制卡");
    expect(formatOrderStatus("pendingShip")).toBe("待寄卡");
    expect(formatOrderStatus("expired")).toBe("已到期");
    expect(formatOrderStatus("completed")).toBe("已完成");
    expect(formatOrderStatus("cancelled")).toBe("已取消");
  });

  it("金额按千分位展示，空值按 0 处理", () => {
    expect(formatAmount(12000)).toBe("12,000.00");
    expect(formatAmount(799.5)).toBe("799.50");
    expect(formatAmount(0)).toBe("0.00");
    expect(formatAmount(null)).toBe("0.00");
    expect(formatAmount(undefined)).toBe("0.00");
  });

  it("续卡费用：5 年及以上 8 折", () => {
    expect(calcRenewFee(1)).toBe(1200);
    expect(calcRenewFee(4)).toBe(4800);
    expect(calcRenewFee(5)).toBe(4800);
    expect(calcRenewFee(10)).toBe(9600);
  });

  it("续卡 / 撤单资格判定", () => {
    expect(isRenewable("expired")).toBe(true);
    expect(isRenewable("completed")).toBe(false);
    expect(isCancellable("pendingCard")).toBe(true);
    expect(isCancellable("pendingShip")).toBe(true);
    expect(isCancellable("pendingAudit")).toBe(false);
  });
});
