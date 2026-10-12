/**
 * Lighthouse CI 配置：对登录后的订单列表页做性能体检。
 * - `startServerCommand` 起预览服务（构建产物），固定 4173 端口；
 * - `puppeteerScript` 在跑分前写入 mock 登录态，使被测页为 `/orders` 而非登录页；
 * - 断言阈值先 `warn`（dashboard 首屏 + mock 波动大），跑稳后再统一转 `error`。
 */
module.exports = {
  ci: {
    collect: {
      startServerCommand: "pnpm preview --port 4173 --strictPort",
      // vp 的就绪横幅带 ANSI 颜色（`Local:` 被转义码拆开），故匹配不含颜色的 URL 片段。
      startServerReadyPattern: "http://localhost",
      startServerReadyTimeout: 60000,
      url: ["http://localhost:4173/orders"],
      numberOfRuns: 3,
      puppeteerScript: "./scripts/lhci-auth.cjs",
      puppeteerLaunchOptions: {
        args: ["--no-sandbox", "--disable-dev-shm-usage"],
      },
    },
    // —— 断言阈值「三阶段」升级路线（由松到紧；后续按此表逐档收紧下方 assertions 的值）——
    //   阶段 1 · 现状（松）     severity: warn    performance ≥ 0.80   LCP ≤ 4000ms   CLS ≤ 0.10   INP ≤ 500ms   TBT ≤ 500ms
    //   阶段 2 · 中            severity: warn    performance ≥ 0.85   LCP ≤ 3000ms   CLS ≤ 0.10   INP ≤ 300ms   TBT ≤ 300ms
    //   阶段 3 · 紧（行业标准）  severity: error   performance ≥ 0.90   LCP ≤ 2500ms   CLS ≤ 0.10   INP ≤ 200ms   TBT ≤ 200ms
    //   依据：Lighthouse 性能分 ≥ 0.9 为「绿」；Core Web Vitals 良好档 LCP ≤ 2.5s / CLS ≤ 0.1 / INP ≤ 200ms。
    //   升级方式：把下面 assertions 的值替换为目标阶段的值，稳定数轮后再把 severity 由 warn 改为 error。
    //   指标键名：performance → categories:performance；LCP → largest-contentful-paint；
    //             CLS → cumulative-layout-shift；INP → interaction-to-next-paint；TBT → total-blocking-time。
    //   INP 说明：属实验室指标，无真实交互时可能缺失或为 0，故保持 warn（避免因 audit 缺失而硬失败）；
    //             TBT 是 lab 中可稳定卡点的交互性代理指标。
    assert: {
      assertions: {
        "categories:performance": ["warn", { minScore: 0.8 }],
        "largest-contentful-paint": ["warn", { maxNumericValue: 4000 }],
        "cumulative-layout-shift": ["warn", { maxNumericValue: 0.1 }],
        "interaction-to-next-paint": ["warn", { maxNumericValue: 500 }],
        "total-blocking-time": ["warn", { maxNumericValue: 500 }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: ".lighthouseci",
    },
  },
};
