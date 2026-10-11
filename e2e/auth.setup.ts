import { mkdirSync } from "node:fs";
import { expect, test as setup } from "@playwright/test";

/** 登录态产物路径：业务项目经 `storageState` 复用，避免每个用例重复登录。 */
const AUTH_FILE = "playwright/.auth/user.json";

/** 登录一次并落盘 storageState（mock 登录不校验账密，表单已预填 admin/123456）。 */
setup("登录并保存登录态", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "登录" }).click();
  // 登录成功后回跳来源页（/）并重定向到订单列表。
  await expect(page).toHaveURL(/\/orders$/);
  mkdirSync("playwright/.auth", { recursive: true });
  await page.context().storageState({ path: AUTH_FILE });
});
