import { Button, Result } from "antd";
import { isRouteErrorResponse, useRouteError } from "react-router";
import { ForbiddenPage } from "@/pages/forbidden";
import { NotFoundPage } from "@/pages/not-found";
import { ServerErrorPage } from "@/pages/server-error";

/** 路由级错误兜底：配合 createBrowserRouter 的 errorElement/ErrorBoundary 使用。
 *  403/404/500 分别复用对应独立异常页，其余状态与运行时异常用 antd `Result` 兜底。
 */
export function RouteErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    if (error.status === 403) return <ForbiddenPage />;
    if (error.status === 404) return <NotFoundPage />;
    if (error.status === 500) return <ServerErrorPage />;

    return (
      <Result
        status="error"
        title={String(error.status)}
        subTitle={error.statusText || "请求出错"}
      />
    );
  }

  const message = error instanceof Error ? error.message : "未知错误";

  return (
    <Result
      status="error"
      title="页面出错了"
      subTitle={message}
      extra={
        <Button type="primary" onClick={() => window.location.reload()}>
          刷新重试
        </Button>
      }
    />
  );
}
