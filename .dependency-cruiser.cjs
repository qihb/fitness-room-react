/**
 * 依赖关系门禁（dependency-cruiser）。
 * 三道防线：① 循环依赖 ② 孤立模块 ③ 分层守卫（feature 边界 / 单向依赖）。
 * 运行：`pnpm depcruise`（只扫 src）。
 *
 * 说明：`@/*` 别名经 tsconfig paths 解析，依赖 dependency-cruiser 内置的
 * tsconfig-paths 支持，因此必须选用支持 TypeScript 6 的 dependency-cruiser 18.x
 * （其引擎要求 Node ≥22）。
 *
 * @type {import('dependency-cruiser').IConfiguration}
 */
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      comment: "禁止循环依赖：循环会让模块初始化顺序变得不可预测。",
      from: {},
      to: { circular: true },
    },
    {
      name: "no-orphans",
      severity: "warn",
      comment:
        "孤立模块（无人引用）。入口 main.tsx、类型声明 *.d.ts、测试文件属合法「无人引用」，已排除。",
      from: {
        orphan: true,
        pathNot: ["(^|/)main\\.tsx?$", "\\.d\\.ts$", "\\.(test|spec)\\.tsx?$"],
      },
      to: {},
    },
    {
      name: "features-deep-import",
      severity: "error",
      comment:
        "feature 边界：外部只能经 @/features/<feature>（其 index.ts）导入，禁止深层导入其 api|components|hooks|stores|types|utils。",
      from: { pathNot: "^src/features/" },
      to: { path: "^src/features/[^/]+/(api|components|hooks|stores|types|utils)/" },
    },
    {
      name: "features-no-pages",
      severity: "error",
      comment: "分层方向：单向 pages → features，feature 不得反向依赖 pages。",
      from: { path: "^src/features/" },
      to: { path: "^src/pages/" },
    },
    {
      name: "shared-no-features",
      severity: "error",
      comment:
        "分层方向：单向 pages/features → components/hooks/lib，共享层不得反向依赖 features/pages。",
      from: { path: "^src/(components|hooks|lib)/" },
      to: { path: "^src/(features|pages)/" },
    },
  ],
  options: {
    tsConfig: { fileName: "tsconfig.json" },
    tsPreCompilationDeps: true,
    doNotFollow: { path: "node_modules" },
    includeOnly: "^src",
    enhancedResolveOptions: {
      extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
    },
    reporterOptions: {
      text: { highlightFocused: true },
    },
  },
};
