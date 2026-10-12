import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite-plus";

export default defineConfig(({ mode }) => {
  // 读取 .env* 中的变量（prefix 置空，兼顾 VITE_ 前缀与代理目标）。
  const env = loadEnv(mode, process.cwd(), "");

  return {
    // 部署子路径：GitHub Pages 项目页等场景经该变量注入（如 /fitness-room-react/）；
    // 本地开发与其他环境缺省为 "/"。
    base: process.env.VITE_BASE_PATH || "/",
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    server: {
      proxy: {
        // 开发环境把 /api 转发到后端，避免跨域；生产环境由网关/同域处理。
        "/api": {
          target: env.VITE_API_PROXY_TARGET || "http://localhost:8080",
          changeOrigin: true,
        },
      },
    },
    staged: {
      "*": "vp check --fix",
    },
    test: {
      include: ["src/**/*.test.{ts,tsx}"],
    },
    fmt: {
      // .trae/ 为 IDE 配置与随仓库分发的技能（外部内容），不纳入项目格式化。
      ignorePatterns: [".trae/**"],
    },
    lint: {
      // 默认插件为 eslint/typescript/unicorn/oxc，设置 plugins 会覆盖默认集，故需显式列全。
      plugins: ["eslint", "typescript", "unicorn", "oxc", "react"],
      jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
      rules: {
        "vite-plus/prefer-vite-plus-imports": "error",
        // 复杂度与规模门禁：首轮先 warn 摸底存量超标量，确认后再统一收紧为 error。
        complexity: ["warn", 15],
        "max-depth": ["warn", 4],
        "max-nested-callbacks": ["warn", 4],
        "max-params": ["warn", 4],
        "max-lines": ["warn", { max: 600, skipBlankLines: true, skipComments: true }],
        "max-lines-per-function": ["warn", { max: 160, skipBlankLines: true, skipComments: true }],
        "max-statements": ["warn", 60],
      },
      options: { typeAware: true, typeCheck: true },
    },
  };
});
