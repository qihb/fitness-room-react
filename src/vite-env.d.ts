/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 后端接口基地址；未配置时回退到同域 `/api`。 */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
