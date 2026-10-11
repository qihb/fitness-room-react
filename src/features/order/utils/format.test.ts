import { describe, expect, it } from "vite-plus/test";
import { formatAmount, formatOrderStatus } from "./format";

describe("order format", () => {
  it("格式化订单状态", () => {
    expect(formatOrderStatus("pending")).toBe("待支付");
    expect(formatOrderStatus("paid")).toBe("已支付");
    expect(formatOrderStatus("cancelled")).toBe("已取消");
  });

  it("格式化金额", () => {
    expect(formatAmount(128)).toBe("¥128.00");
    expect(formatAmount(0)).toBe("¥0.00");
  });
});
