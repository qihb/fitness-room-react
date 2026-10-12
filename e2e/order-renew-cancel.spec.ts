import { expect, test } from "@playwright/test";
import { OrderListPage } from "./pages/order-list.page";

/** 批量/行内续卡与一键撤单走查。
 *  部分断言依赖「按状态筛选行」而非固定行号：种子数据会洗牌，各状态的行位置每次加载不同。 */

test.describe("批量续卡", () => {
  test("选中不满足条件的订单时给出警告并列出订单号", async ({ page }) => {
    const orderList = new OrderListPage(page);
    // 「全部」页签（pageSize=50 展示全部 42 条）取一条「已完成」订单。
    await orderList.goto("?pageSize=50");
    const row = orderList.rowsByStatus("已完成").first();
    const orderNo = await orderList.cellText(row, "订单号");

    await orderList.selectRow(row);
    await orderList.batchRenewButton.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("部分订单不满足续卡条件");
    await expect(dialog).toContainText(`以下订单不满足：${orderNo}`);
  });

  test("仅选已到期订单：5 年享 8 折，提交后年限累加且状态转为待审核", async ({ page }) => {
    const orderList = new OrderListPage(page);
    await orderList.goto("?tab=expired");

    const first = orderList.rows.nth(0);
    const second = orderList.rows.nth(1);
    const firstNo = await orderList.cellText(first, "订单号");
    const secondNo = await orderList.cellText(second, "订单号");
    const firstYears = Number((await orderList.cellText(first, "购卡年限")).replace(/\D/g, ""));

    await orderList.selectRow(first);
    await orderList.selectRow(second);
    await orderList.batchRenewButton.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("共 2 笔订单");
    await expect(dialog).toContainText(firstNo);
    await expect(dialog).toContainText(secondNo);
    await dialog.getByRole("spinbutton").fill("5");
    // 5 年 × 1200 × 0.8 = 4800。
    await expect(dialog.getByText("4,800.00")).toBeVisible();
    await dialog.getByRole("button", { name: "确认续卡" }).click();

    await expect(page.locator(".ant-message")).toContainText("已完成 2 笔订单续卡");
    // 两笔订单转「待审核」后离开「已到期」页签，剩 6 条。
    await expect(orderList.totalText).toHaveText("共 6 条");

    // 回查详情：年限累加 5 年，状态转为待审核。
    // 用页内导航（切 Tab + 搜索）而非 page.goto：整页重载会重置内存态 mock 并重新洗牌种子。
    await orderList.switchTab("全部");
    await orderList.search({ orderNo: firstNo });
    const renewedRow = orderList.rowByOrderNo(firstNo);
    expect(await orderList.cellText(renewedRow, "购卡年限")).toBe(`${firstYears + 5} 年`);
    expect(await orderList.cellText(renewedRow, "状态")).toBe("待审核");
  });
});

test.describe("一键撤单", () => {
  test("选中待审核订单时给出提示", async ({ page }) => {
    const orderList = new OrderListPage(page);
    // 「进行中」含待审核/待制卡/待寄卡，pageSize=50 全量展示后按状态取行。
    await orderList.goto("?tab=inProgress&pageSize=50");
    const row = orderList.rowsByStatus("待审核").first();
    const orderNo = await orderList.cellText(row, "订单号");

    await orderList.selectRow(row);
    await orderList.batchCancelButton.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("部分订单不满足撤单条件");
    await expect(dialog).toContainText(`以下订单不满足：${orderNo}`);
  });

  test("选待制卡/待寄卡订单：二次确认后状态转为已取消", async ({ page }) => {
    const orderList = new OrderListPage(page);
    await orderList.goto("?tab=inProgress&pageSize=50");

    const cardRow = orderList.rowsByStatus("待制卡").first();
    const shipRow = orderList.rowsByStatus("待寄卡").first();
    const cardNo = await orderList.cellText(cardRow, "订单号");
    const shipNo = await orderList.cellText(shipRow, "订单号");

    await orderList.selectRow(cardRow);
    await orderList.selectRow(shipRow);
    await orderList.batchCancelButton.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("将撤销以下订单");
    await expect(dialog).toContainText(cardNo);
    await expect(dialog).toContainText(shipNo);
    await dialog.getByRole("button", { name: "确认撤单" }).click();

    await expect(page.locator(".ant-message")).toContainText("撤单成功");
    await expect(orderList.totalText).toHaveText("共 22 条");

    // 「已取消」页签可见两条新撤订单（原 4 条 + 新撤 2 条 = 6 条）。
    // 页内切 Tab，避免整页重载重置 mock 内存态。
    await orderList.switchTab("已取消");
    await expect(orderList.totalText).toHaveText("共 6 条");
    await expect(orderList.rowByOrderNo(cardNo).locator(".ant-tag")).toHaveText("已取消");
    await expect(orderList.rowByOrderNo(shipNo).locator(".ant-tag")).toHaveText("已取消");
  });
});

test.describe("行内续卡", () => {
  test("仅已到期行有续卡按钮，弹窗提交后年限累加且转待审核", async ({ page }) => {
    const orderList = new OrderListPage(page);

    // 已到期页签每行均有「续卡」；已完成页签操作列为「-」，无任何续卡入口。
    await orderList.goto("?tab=expired");
    const rowCount = await orderList.rows.count();
    for (let i = 0; i < rowCount; i += 1) {
      await expect(orderList.rows.nth(i).getByRole("button", { name: "续卡" })).toHaveCount(1);
    }
    await orderList.switchTab("已完成");
    await expect(page.getByRole("button", { name: "续卡" })).toHaveCount(0);

    // 行内续卡 1 年：1 × 1200 = 1,200.00。
    await orderList.switchTab("已到期");
    const row = orderList.rows.first();
    const orderNo = await orderList.cellText(row, "订单号");
    const years = Number((await orderList.cellText(row, "购卡年限")).replace(/\D/g, ""));
    await row.getByRole("button", { name: "续卡" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText(`共 1 笔订单：${orderNo}`);
    await dialog.getByRole("spinbutton").fill("1");
    await expect(dialog.getByText("1,200.00")).toBeVisible();
    await dialog.getByRole("button", { name: "确认续卡" }).click();

    await expect(page.locator(".ant-message")).toContainText("已完成 1 笔订单续卡");
    await expect(orderList.totalText).toHaveText("共 7 条");

    // 页内导航，避免整页重载重置 mock 内存态。
    await orderList.switchTab("全部");
    await orderList.search({ orderNo });
    const renewedRow = orderList.rowByOrderNo(orderNo);
    expect(await orderList.cellText(renewedRow, "购卡年限")).toBe(`${years + 1} 年`);
    expect(await orderList.cellText(renewedRow, "状态")).toBe("待审核");
  });
});
