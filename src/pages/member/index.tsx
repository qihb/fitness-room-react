import { Alert, Card, Spin, Table, Tag } from "antd";
import type { TableProps } from "antd";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { getMembers, type Member } from "@/features/member";

const PAGE_SIZE = 10;

interface PageState {
  page: number;
  data: Member[];
  total: number;
  error: string | null;
}

/** 会员列表页：演示「经 feature 公共 API 取数」+「分页放 URL search params」。 */
export function MemberPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get("page") ?? "1") || 1;

  const [result, setResult] = useState<PageState | null>(null);

  useEffect(() => {
    let alive = true;
    getMembers({ page, pageSize: PAGE_SIZE })
      .then((pageResult) => {
        if (alive) {
          setResult({ page, data: pageResult.list, total: pageResult.total, error: null });
        }
      })
      .catch((cause: unknown) => {
        if (alive) {
          setResult({
            page,
            data: [],
            total: 0,
            error: cause instanceof Error ? cause.message : "加载失败",
          });
        }
      });
    return () => {
      alive = false;
    };
  }, [page]);

  // 仅采用与当前 page 匹配的结果，避免翻页瞬间串数据。
  const settled = result?.page === page ? result : null;
  const loading = settled === null;
  const error = settled?.error ?? null;
  const data = settled?.data ?? [];
  const total = settled?.total ?? 0;

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
    <Card title="会员列表">
      {error === null ? (
        <Spin spinning={loading}>
          <Table<Member>
            rowKey="id"
            columns={columns}
            dataSource={data}
            pagination={{
              current: page,
              pageSize: PAGE_SIZE,
              total,
              onChange: (nextPage) => {
                setSearchParams((prev) => {
                  const next = new URLSearchParams(prev);
                  next.set("page", String(nextPage));
                  return next;
                });
              },
            }}
          />
        </Spin>
      ) : (
        <Alert type="error" message={error} showIcon />
      )}
    </Card>
  );
}
