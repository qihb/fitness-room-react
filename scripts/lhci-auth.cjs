/**
 * Lighthouse CI 登录脚本：跑分前把 mock 登录态准备好，使被测页为登录后的 `/orders`。
 * LHCI 会在同一浏览器上下文里先执行本脚本、再做审计，故这里写入的 localStorage 可被审计页复用。
 * mock 登录：表单已预填 admin/123456，走一遍真实提交；同时显式写入持久化登录态兜底
 * （结构须与 `src/store/auth.ts` 的 zustand persist 一致：key = fitness-room-auth）。
 */

/** zustand persist 的存储 key（见 src/store/auth.ts）。 */
const AUTH_STORAGE_KEY = "fitness-room-auth";

/** @param {import('puppeteer').Browser} browser @param {{ url: string }} context */
module.exports = async (browser, context) => {
  const page = await browser.newPage();
  try {
    const loginUrl = new URL("/login", context.url).href;
    await page.goto(loginUrl, { waitUntil: "networkidle0" });

    // 兜底：直接写入持久化登录态，避免仅依赖跳转时序。
    await page.evaluate((key) => {
      localStorage.setItem(
        key,
        JSON.stringify({ state: { token: "mock-token", user: { name: "admin" } }, version: 2 }),
      );
    }, AUTH_STORAGE_KEY);

    // 走一遍真实登录流程，确保登录态在当前上下文生效。
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => location.pathname.startsWith("/orders"), { timeout: 30_000 });
  } finally {
    await page.close();
  }
};
