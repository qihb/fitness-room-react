import { Button, Result } from "antd";
import { Link } from "react-router";

/** 403 无权限页。 */
export function ForbiddenPage() {
  return (
    <Result
      status="403"
      title="403"
      subTitle="抱歉，你无权访问该页面。"
      extra={
        <Link to="/">
          <Button type="primary">返回首页</Button>
        </Link>
      }
    />
  );
}
