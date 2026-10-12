import type { Locator, Page } from "@playwright/test";

/**
 * 订单列表页 Page Object：集中封装选择器与常用动作，避免各 spec 散落选择器。
 * 行定位基于 `tbody tr.ant-table-row`（数据行），单元格按表头名解析列索引。
 */
export class OrderListPage {
  readonly page: Page;
  /** 数据行集合（不含表头与空态占位行）。 */
  readonly rows: Locator;
  readonly totalText: Locator;
  readonly batchRenewButton: Locator;
  readonly batchCancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.rows = page.locator("tbody tr.ant-table-row");
    this.totalText = page.locator(".ant-pagination-total-text");
    this.batchRenewButton = page.getByRole("button", { name: "批量续卡" });
    this.batchCancelButton = page.getByRole("button", { name: "一键撤单" });
  }

  /** 打开订单列表（可带 URL search params），并等待首屏列表加载完成。 */
  async goto(params = ""): Promise<void> {
    await this.page.goto(`/orders${params}`);
    await this.waitForFirstLoad();
  }

  /** 切换状态页签（触发列表重新请求，等待加载完成后再继续断言）。 */
  async switchTab(label: string): Promise<void> {
    const settled = this.waitForListIdle();
    await this.page.getByRole("tab", { name: label }).click();
    await settled;
  }

  /** 填写搜索表单并查询（触发列表重新请求，等待加载完成后再继续断言）。 */
  async search(values: { orderNo?: string; memberName?: string }): Promise<void> {
    if (values.orderNo !== undefined) {
      await this.page.getByLabel("订单号").fill(values.orderNo);
    }
    if (values.memberName !== undefined) {
      await this.page.getByLabel("会员姓名").fill(values.memberName);
    }
    const settled = this.waitForListIdle();
    await this.page.getByRole("button", { name: "查询" }).click();
    await settled;
  }

  /** 按订单号定位唯一数据行。 */
  rowByOrderNo(orderNo: string): Locator {
    return this.rows.filter({ hasText: orderNo });
  }

  /** 按状态文案定位数据行（状态仅出现在「状态」列 Tag 中，无同名干扰）。 */
  rowsByStatus(status: string): Locator {
    return this.rows.filter({ hasText: status });
  }

  /** 勾选某行。 */
  async selectRow(row: Locator): Promise<void> {
    await row.getByRole("checkbox").check();
  }

  /** 读取某行指定列的文本。 */
  async cellText(row: Locator, columnTitle: string): Promise<string> {
    const index = await this.columnIndexOf(columnTitle);
    return (await row.locator("td").nth(index).innerText()).trim();
  }

  /** 读取当前页所有行指定列的文本。 */
  async columnTexts(columnTitle: string): Promise<string[]> {
    const index = await this.columnIndexOf(columnTitle);
    const count = await this.rows.count();
    const texts: string[] = [];
    for (let i = 0; i < count; i += 1) {
      texts.push((await this.rows.nth(i).locator("td").nth(index).innerText()).trim());
    }
    return texts;
  }

  /** 表头名 → 列索引（含行选择列，索引以实际 DOM 为准）。 */
  private async columnIndexOf(columnTitle: string): Promise<number> {
    const headers = this.page.locator(".ant-table-thead th");
    const count = await headers.count();
    for (let i = 0; i < count; i += 1) {
      if ((await headers.nth(i).innerText()).trim() === columnTitle) {
        return i;
      }
    }
    throw new Error(`未找到表头列：${columnTitle}`);
  }

  /**
   * 等待整页导航后的首屏加载完成。
   * 与页内动作不同，`page.goto` 可能在加载态结束后才 resolve（并行跑用例时更明显），
   * 因此不以「观察到 spin 出现」为前提，改为：等骨架（表头）出现 → 等加载态（`.ant-spin-spinning`）消失。
   */
  private async waitForFirstLoad(): Promise<void> {
    await this.page.locator(".ant-table-thead th").first().waitFor({ state: "visible" });
    await this.page.locator(".ant-spin-spinning").waitFor({ state: "hidden" });
  }

  /**
   * 等待页内动作（切 Tab / 查询）触发的列表加载态「出现再消失」。
   * 页面用 `<Spin spinning={loading}>` 包裹表格，加载中会有 `.ant-spin-spinning`。
   * mock 走 axios adapter、请求不产生真实网络流量，`waitForResponse` 观测不到，故改用页面加载态判定。
   */
  private async waitForListIdle(): Promise<void> {
    const spinner = this.page.locator(".ant-spin-spinning");
    await spinner.waitFor({ state: "visible" });
    await spinner.waitFor({ state: "hidden" });
  }
}
