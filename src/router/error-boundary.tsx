import { Button, Result } from "antd";
import { isRouteErrorResponse, useRouteError } from "react-router";

type ResultStatus = "error" | "403" | "404" | "500";

function toResultStatus(status: number): ResultStatus {
  if (status === 403 || status === 404 || status === 500) {
    return String(status) as ResultStatus;
  }
  return "error";
}

/** 路由级错误兜底：配合 createBrowserRouter 的 errorElement/ErrorBoundary 使用。 */
export function RouteErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <Result
        status={toResultStatus(error.status)}
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
