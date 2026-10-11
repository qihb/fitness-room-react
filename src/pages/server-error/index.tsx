import { Button, Result } from "antd";
import { Link } from "react-router";

/** 500 服务器错误页。 */
export function ServerErrorPage() {
  return (
    <Result
      status="500"
      title="500"
      subTitle="抱歉，服务器出错了，请稍后重试。"
      extra={
        <Link to="/">
          <Button type="primary">返回首页</Button>
        </Link>
      }
    />
  );
}
