import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E 配置。
 * - 被测服务为 dev server（webServer 自动拉起 `vp dev`，固定 5173 端口防漂移）；
 * - 业务数据走前端 mock（内存态，每个用例独立浏览器上下文即独立数据，天然隔离）；
 * - 登录态由 setup 项目产出 `playwright/.auth/user.json`，业务项目复用，避免每例重复登录。
 */
export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [["html", { open: "never" }], ["list"]]
    : [["html", { open: "on-failure" }], ["list"]],
  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
  },
  // CI 冷启动 dev server 较慢（依赖优化 + 2 核机器），放宽单用例超时。
  timeout: 90_000,
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], storageState: "playwright/.auth/user.json" },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: "vp dev --port 5173 --strictPort",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // 透出 dev server 日志（依赖优化/报错），CI 白屏时能从 Actions 日志直接定位。
    stdout: "pipe",
    stderr: "pipe",
  },
});
