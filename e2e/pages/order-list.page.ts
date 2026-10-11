import type { Locator, Page, Response } from "@playwright/test";

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

  /** 打开订单列表（可带 URL search params），并等待首屏列表请求返回。 */
  async goto(params = ""): Promise<void> {
    const listLoaded = this.waitForListResponse();
    await this.page.goto(`/orders${params}`);
    await listLoaded;
  }

  /** 切换状态页签（触发列表重新请求，等待返回后再继续断言）。 */
  async switchTab(label: string): Promise<void> {
    const listLoaded = this.waitForListResponse();
    await this.page.getByRole("tab", { name: label }).click();
    await listLoaded;
  }

  /** 填写搜索表单并查询（触发列表重新请求，等待返回后再继续断言）。 */
  async search(values: { orderNo?: string; memberName?: string }): Promise<void> {
    if (values.orderNo !== undefined) {
      await this.page.getByLabel("订单号").fill(values.orderNo);
    }
    if (values.memberName !== undefined) {
      await this.page.getByLabel("会员姓名").fill(values.memberName);
    }
    const listLoaded = this.waitForListResponse();
    await this.page.getByRole("button", { name: "查询" }).click();
    await listLoaded;
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

  /** 等待下一次订单列表 GET 请求返回（mock adapter 走 fetch/XHR，URL 为 /api/orders）。 */
  private waitForListResponse(): Promise<Response> {
    return this.page.waitForResponse(
      (response) =>
        response.request().method() === "GET" &&
        new URL(response.url()).pathname.endsWith("/orders"),
    );
  }
}
