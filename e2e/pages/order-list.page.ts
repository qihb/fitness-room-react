import type { Locator, Page } from "@playwright/test";

/**
 * 订单列表页 Page Object：集中封装选择器与常用动作，避免各 spec 散落选择器。
 * 行定位基于 `tbody tr.ant-table-row`（数据行），单元格按表头名解析列索引。
 *
 * 列表加载同步：mock 走 axios adapter、请求不产生真实网络流量，`waitForResponse` 观测不到，
 * 故用页面加载态（`.ant-spin-spinning`）判定；为避免轮询漏看约 300ms 的短暂加载态，
 * 改为「动作前记录探针基线 → 动作后等基线增长」的单调计数方案（见 `trackListLoading`）。
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

  /** 注册加载态探针；须在首次导航前调用（`goto` 已内置），重复调用安全。 */
  async installTracking(): Promise<void> {
    await this.page.addInitScript(trackListLoading);
  }

  /** 打开订单列表（可带 URL search params），并等待首屏列表加载完成。 */
  async goto(params = ""): Promise<void> {
    await this.installTracking();
    await this.page.goto(`/orders${params}`);
    await this.waitForListReady();
  }

  /**
   * 等待列表就绪：表头出现 + 完成至少一次加载周期（首屏数据已渲染）。
   * 也用于客户端路由跳转到列表页后的等待——确保挂载回填 effect 已执行，避免其清空即将输入的值。
   */
  async waitForListReady(): Promise<void> {
    await this.page.locator(".ant-table-thead th").first().waitFor({ state: "visible" });
    await this.waitForLoadingCycle(0);
  }

  /** 切换状态页签（触发列表重新请求，等待加载完成后再继续断言）。 */
  async switchTab(label: string): Promise<void> {
    await this.runAndSettle(() => this.page.getByRole("tab", { name: label }).click());
  }

  /** 填写搜索表单并查询（触发列表重新请求，等待加载完成后再继续断言）。 */
  async search(values: { orderNo?: string; memberName?: string }): Promise<void> {
    if (values.orderNo !== undefined) {
      await this.page.getByLabel("订单号").fill(values.orderNo);
    }
    if (values.memberName !== undefined) {
      await this.page.getByLabel("会员姓名").fill(values.memberName);
    }
    await this.runAndSettle(() => this.page.getByRole("button", { name: "查询" }).click());
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

  /** 执行会触发列表重新请求的动作，并等待「加载态出现→消失」完成一轮。 */
  private async runAndSettle(action: () => Promise<void>): Promise<void> {
    const baseline = await this.loadingCycles();
    await action();
    await this.waitForLoadingCycle(baseline);
  }

  private async loadingCycles(): Promise<number> {
    return this.page.evaluate(
      () => (window as unknown as { __listLoading?: ListLoadingState }).__listLoading?.cycles ?? 0,
    );
  }

  /** 等待加载态周期计数超过基线且当前不在加载中（探针未注册时会超时并快速暴露问题）。 */
  private async waitForLoadingCycle(since: number): Promise<void> {
    await this.page.waitForFunction(
      (baseline) => {
        const state = (window as unknown as { __listLoading?: ListLoadingState }).__listLoading;
        return state !== undefined && state.cycles > baseline && !state.active;
      },
      since,
      { timeout: LOADING_WAIT_MS },
    );
  }
}

/** 加载态探针状态：`cycles` 为「加载态出现→消失」的完成次数（单调递增），`active` 为当前是否加载中。 */
interface ListLoadingState {
  cycles: number;
  active: boolean;
}

/** 加载态等待上限：远小于用例超时（90s），超时即抛错，便于快速定位「查询未触发请求」。 */
const LOADING_WAIT_MS = 15_000;

/**
 * 注入页面的加载态探针（须在首次导航前经 `addInitScript` 注册）。
 * 用 `MutationObserver` 记录 `.ant-spin-spinning` 的「出现→消失」周期并累加计数。
 * 计数单调递增，用例可「先记基线、动作后等计数增长」，从而不会漏看短暂加载态。
 */
export const trackListLoading = () => {
  const target = window as unknown as { __listLoading?: ListLoadingState };
  // 重复注册（构造函数与 beforeEach 各一次）时复用同一状态对象，避免计数被重置。
  if (target.__listLoading) {
    return;
  }
  const state: ListLoadingState = { cycles: 0, active: false };
  target.__listLoading = state;

  const isSpinning = () => document.querySelector(".ant-spin-spinning") !== null;
  state.active = isSpinning();

  const observer = new MutationObserver(() => {
    const spinning = isSpinning();
    if (spinning === state.active) {
      return;
    }
    if (spinning) {
      state.active = true;
    } else {
      state.active = false;
      state.cycles += 1;
    }
  });
  observer.observe(document, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["class"],
  });
};
