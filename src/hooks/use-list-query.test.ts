import { describe, expect, it } from "vite-plus/test";
import { buildListQueryUpdate, parseListQuery } from "./use-list-query";

const FIELDS = [
  { key: "tab", defaultValue: "all", options: ["all", "expired"] },
  { key: "orderNo" },
  { key: "memberName" },
];

describe("parseListQuery", () => {
  it("空 URL：分页取默认值，未声明字段时无筛选条件", () => {
    expect(parseListQuery(new URLSearchParams())).toEqual({
      page: 1,
      pageSize: 10,
      conditions: {},
    });
  });

  it("声明字段后，缺失值按各自默认值兜底", () => {
    const parsed = parseListQuery(new URLSearchParams(), { fields: FIELDS });
    expect(parsed.conditions).toEqual({ tab: "all", orderNo: "", memberName: "" });
  });

  it("白名单命中取原值，不命中回落默认值", () => {
    const hit = parseListQuery(new URLSearchParams("tab=expired"), { fields: FIELDS });
    expect(hit.conditions.tab).toBe("expired");

    const miss = parseListQuery(new URLSearchParams("tab=unknown"), { fields: FIELDS });
    expect(miss.conditions.tab).toBe("all");
  });

  it("未声明白名单的字段原样透传", () => {
    const parsed = parseListQuery(new URLSearchParams("orderNo=A1&memberName=%E5%BC%A0"), {
      fields: FIELDS,
    });
    expect(parsed.conditions.orderNo).toBe("A1");
    expect(parsed.conditions.memberName).toBe("张");
  });

  it("page 仅接受正整数，其余回落 1", () => {
    const cases: [string, number][] = [
      ["page=3", 3],
      ["page=abc", 1],
      ["page=0", 1],
      ["page=-2", 1],
      ["page=1.5", 1],
    ];
    cases.forEach(([query, expected]) => {
      expect(parseListQuery(new URLSearchParams(query)).page, query).toBe(expected);
    });
  });

  it("pageSize 仅接受白名单内取值，其余回落默认值", () => {
    expect(parseListQuery(new URLSearchParams("pageSize=20")).pageSize).toBe(20);
    expect(parseListQuery(new URLSearchParams("pageSize=5")).pageSize).toBe(10);
    expect(parseListQuery(new URLSearchParams("pageSize=abc")).pageSize).toBe(10);
  });

  it("支持自定义每页条数选项与默认值", () => {
    const config = { pageSizeOptions: [5, 15], defaultPageSize: 5 };
    expect(parseListQuery(new URLSearchParams("pageSize=15"), config).pageSize).toBe(15);
    expect(parseListQuery(new URLSearchParams(), config).pageSize).toBe(5);
  });
});

describe("buildListQueryUpdate", () => {
  it("写入新键并覆盖已有键，数字转字符串", () => {
    const next = buildListQueryUpdate(new URLSearchParams("tab=all&page=1"), {
      tab: "expired",
      page: 2,
      orderNo: "A1",
    });
    expect(next.toString()).toBe("tab=expired&page=2&orderNo=A1");
  });

  it("空字符串 / null / undefined 删除该键，其余键保留", () => {
    const next = buildListQueryUpdate(new URLSearchParams("tab=expired&orderNo=A1&page=3"), {
      tab: "",
      orderNo: null,
      memberName: undefined,
    });
    expect(next.toString()).toBe("page=3");
  });

  it("不修改传入的 search params", () => {
    const current = new URLSearchParams("page=1");
    buildListQueryUpdate(current, { page: 2 });
    expect(current.toString()).toBe("page=1");
  });
});
