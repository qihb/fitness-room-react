import { mkdirSync } from "node:fs";
import { expect, test as setup } from "@playwright/test";

/** 登录态产物路径：业务项目经 `storageState` 复用，避免每个用例重复登录。 */
const AUTH_FILE = "playwright/.auth/user.json";

/** 登录一次并落盘 storageState（mock 登录不校验账密，表单已预填 admin/123456）。 */
setup("登录并保存登录态", async ({ page }) => {
  // 收集运行时报错：CI 若白屏（模块加载失败/JS 异常），失败时输出到日志便于定位。
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push(`console.error: ${msg.text()}`);
    }
  });

  await page.goto("/login");
  try {
    // antd 会对两字按钮自动插空格（"登 录"），用正则宽松匹配避免因空格失配。
    await page.getByRole("button", { name: /登\s*录/ }).click();
  } catch (error) {
    console.error("登录页未出现「登录」按钮，页面可见文本：");
    console.error(
      await page
        .locator("body")
        .innerText()
        .catch(() => "<无法读取页面>"),
    );
    if (errors.length > 0) {
      console.error("浏览器运行时报错：\n" + errors.join("\n"));
    }
    throw error;
  }

  // 登录成功后回跳来源页（/）并重定向到订单列表。
  await expect(page).toHaveURL(/\/orders$/);
  mkdirSync("playwright/.auth", { recursive: true });
  await page.context().storageState({ path: AUTH_FILE });
});
