import { expect, test } from "@playwright/test";
import { OrderListPage, trackListLoading } from "./pages/order-list.page";

/** 新建订单走查：空表单校验、办卡费用只读联动、提交成功回列表并可见新订单。 */

test.beforeEach(async ({ page }) => {
  // 首次文档加载前注入加载态探针：客户端路由跳转到列表页后仍可用。
  await page.addInitScript(trackListLoading);
});

test.describe("新建订单", () => {
  test("空表单提交展示三项必填校验", async ({ page }) => {
    await page.goto("/orders/new");
    // antd 会对两字按钮自动插空格（"提 交"），用正则宽松匹配避免因空格失配。
    await page.getByRole("button", { name: /提\s*交/ }).click();
    await expect(page.getByText("请输入会员姓名")).toBeVisible();
    await expect(page.getByText("请输入联系手机号")).toBeVisible();
    await expect(page.getByText("请输入购卡年限")).toBeVisible();
  });

  test("填写并提交成功后回列表，新订单可查且为待审核", async ({ page }) => {
    const orderList = new OrderListPage(page);
    await page.goto("/orders/new");

    // 姓名带时间戳保证唯一，便于回查。
    const memberName = `端测会员${Date.now()}`;
    await page.getByLabel("会员姓名").fill(memberName);
    await page.getByLabel("联系手机号").fill("13800138000");
    await page.getByLabel("购卡年限").fill("2");

    // 办卡费用只读联动：2 年 × 1200 = 2,400.00 元（该表单项无 name，按所在表单项定位）。
    const feeInput = page
      .locator(".ant-form-item")
      .filter({ hasText: "办卡费用" })
      .locator("input");
    await expect(feeInput).toHaveValue("2,400.00 元");
    await expect(feeInput).toHaveAttribute("readonly", "");

    await page.getByRole("button", { name: /提\s*交/ }).click();
    await expect(page.locator(".ant-message")).toContainText("订单创建成功");
    await expect(page).toHaveURL(/\/orders$/);

    // 回列表按姓名搜索：唯一命中，状态为待审核、金额 2,400.00。
    // （新单按创建时间倒序应排最前；mock 种子基准时刻为 09:00，凌晨窗口内新单排第 2，故不断言具体位次。）
    // 先等列表首屏就绪：搜索表单挂载时会用 URL 值回填，过早输入会被清空导致查询条件为空。
    await orderList.waitForListReady();
    await orderList.search({ memberName });
    await expect(orderList.totalText).toHaveText("共 1 条");
    const row = page.locator("tbody tr.ant-table-row").first();
    await expect(row.locator(".ant-tag")).toHaveText("待审核");
    await expect(row).toContainText("2,400.00");
  });
});
