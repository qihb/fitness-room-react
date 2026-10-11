import { Alert, Card, Spin, Table, Tag } from "antd";
import type { TableProps } from "antd";
import { useEffect, useState } from "react";
import { getMembers, type Member } from "@/features/member";

/** 示例：经 feature 公共 API 发起 axios 请求，并处理加载 / 预期错误。 */
export function MemberPreview() {
  const [data, setData] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    getMembers({ page: 1, pageSize: 10 })
      .then((pageResult) => {
        if (alive) setData(pageResult.list);
      })
      .catch((cause: unknown) => {
        if (alive) setError(cause instanceof Error ? cause.message : "加载失败");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const columns: TableProps<Member>["columns"] = [
    { title: "姓名", dataIndex: "name" },
    { title: "手机号", dataIndex: "phone" },
    {
      title: "状态",
      dataIndex: "status",
      render: (status: Member["status"]) => (
        <Tag color={status === "active" ? "green" : "red"}>
          {status === "active" ? "有效" : "过期"}
        </Tag>
      ),
    },
  ];

  return (
    <Card title="axios 请求示例（会员列表）" className="w-full">
      {error === null ? (
        <Spin spinning={loading}>
          <Table<Member> rowKey="id" columns={columns} dataSource={data} pagination={false} />
        </Spin>
      ) : (
        <Alert type="error" message={error} showIcon />
      )}
    </Card>
  );
}
