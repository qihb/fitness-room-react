/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 后端接口基地址；未配置时回退到同域 `/api`。 */
  readonly VITE_API_BASE_URL?: string;
  /** 是否启用前端 mock（axios adapter）；默认开启，设 `false` 关闭。 */
  readonly VITE_USE_MOCK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
