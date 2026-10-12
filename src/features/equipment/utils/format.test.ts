import { describe, expect, it } from "vite-plus/test";
import { formatEquipmentStatus, isDeletable } from "./format";

describe("equipment format", () => {
  it("格式化设备状态", () => {
    expect(formatEquipmentStatus("inUse")).toBe("在用");
    expect(formatEquipmentStatus("idle")).toBe("闲置");
    expect(formatEquipmentStatus("maintenance")).toBe("维护中");
    expect(formatEquipmentStatus("scrapped")).toBe("已报废");
  });

  it("删除资格：仅闲置 / 已报废可删", () => {
    expect(isDeletable("idle")).toBe(true);
    expect(isDeletable("scrapped")).toBe(true);
    expect(isDeletable("inUse")).toBe(false);
    expect(isDeletable("maintenance")).toBe(false);
  });
});
