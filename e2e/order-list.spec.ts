import { expect, test } from "@playwright/test";
import { OrderListPage } from "./pages/order-list.page";

/** 订单列表走查：Tab/表头/排序/操作列、金额格式、筛选与搜索。
 *  mock 为内存态且每个用例独立浏览器上下文，用例以 goto 起手、互不依赖写操作结果。 */

test.describe("订单列表 · 展示", () => {
  test("Tab 顺序、表头、默认创建时间倒序与操作列", async ({ page }) => {
    const orderList = new OrderListPage(page);
    await orderList.goto();

    // 5 个状态页签及顺序。
    expect(await page.getByRole("tab").allInnerTexts()).toEqual([
      "全部",
      "进行中",
      "已到期",
      "已完成",
      "已取消",
    ]);

    // 7 列表头（首列为行选择列）。
    const headers = (await page.locator(".ant-table-thead th").allInnerTexts()).map((text) =>
      text.trim(),
    );
    expect(headers).toEqual([
      "",
      "订单号",
      "会员姓名",
      "购卡年限",
      "订单金额",
      "状态",
      "创建时间",
      "操作",
    ]);

    // 默认创建时间倒序：种子最新一条为 20261011001，共 42 条。
    await expect(orderList.rows.first()).toContainText("20261011001");
    await expect(orderList.totalText).toHaveText("共 42 条");

    // 每行状态为 6 种合法文案之一，且仅「已到期」行的操作列有「续卡」。
    const statusTexts = ["待审核", "待制卡", "待寄卡", "已到期", "已完成", "已取消"];
    const rowCount = await orderList.rows.count();
    for (let i = 0; i < rowCount; i += 1) {
      const row = orderList.rows.nth(i);
      const status = await orderList.cellText(row, "状态");
      expect(statusTexts, `第 ${i + 1} 行状态文案`).toContain(status);
      expect(
        await row.getByRole("button", { name: "续卡" }).count(),
        `第 ${i + 1} 行（${status}）的续卡按钮`,
      ).toBe(status === "已到期" ? 1 : 0);
    }
  });

  test("金额格式：千分位展示，0 与 null 均显示 0.00", async ({ page }) => {
    const orderList = new OrderListPage(page);

    // 已到期页签：含 0 金额样本与千分位金额（4 年 = 4,800.00、8 年 = 9,600.00）。
    await orderList.goto("?tab=expired");
    const expiredAmounts = await orderList.columnTexts("订单金额");
    expect(expiredAmounts).toContain("0.00");
    expect(expiredAmounts).toContain("4,800.00");
    expect(expiredAmounts).toContain("9,600.00");

    // 已完成页签：含 null 金额样本，同样显示 0.00。
    await orderList.goto("?tab=completed");
    const completedAmounts = await orderList.columnTexts("订单金额");
    expect(completedAmounts).toContain("0.00");
  });
});

test.describe("订单列表 · 筛选与搜索", () => {
  test("切页签回到第 1 页并同步 URL", async ({ page }) => {
    const orderList = new OrderListPage(page);
    await orderList.goto("?tab=all&page=3");
    await orderList.switchTab("已到期");
    await expect(page).toHaveURL(/tab=expired&page=1/);
    await expect(orderList.totalText).toHaveText("共 8 条");
  });

  test("订单号精确匹配：部分单号查不到，完整单号唯一命中", async ({ page }) => {
    const orderList = new OrderListPage(page);
    await orderList.goto("?tab=expired");
    const orderNo = await orderList.cellText(orderList.rows.first(), "订单号");

    await orderList.search({ orderNo: orderNo.slice(0, -1) });
    await expect(orderList.totalText).toHaveText("共 0 条");

    await orderList.search({ orderNo });
    await expect(orderList.totalText).toHaveText("共 1 条");
    await expect(orderList.rowByOrderNo(orderNo)).toHaveCount(1);
  });

  test("会员姓名模糊匹配：「张」命中张三与张伟", async ({ page }) => {
    const orderList = new OrderListPage(page);
    await orderList.goto();

    // 种子姓名池按行号取模分布：「张」命中张三 ×4、张伟 ×3，共 7 条。
    await orderList.search({ memberName: "张" });
    await expect(orderList.totalText).toHaveText("共 7 条");
    const names = await orderList.columnTexts("会员姓名");
    expect(new Set(names)).toEqual(new Set(["张三", "张伟"]));

    // 「张三」仅精确包含张三，张伟不命中。
    await orderList.search({ memberName: "张三" });
    await expect(orderList.totalText).toHaveText("共 4 条");
    expect(new Set(await orderList.columnTexts("会员姓名"))).toEqual(new Set(["张三"]));
  });
});
