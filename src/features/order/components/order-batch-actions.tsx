import { DownloadOutlined } from "@ant-design/icons";
import { Button, Space } from "antd";

export interface OrderBatchActionsProps {
  /** 按当前 Tab 的导出权限决定是否展示导出入口。 */
  canExport: boolean;
  /** 当前 Tab 是否允许批量续卡。 */
  canRenew: boolean;
  /** 当前 Tab 是否允许一键撤单。 */
  canCancel: boolean;
  exporting: boolean;
  onExport: () => void;
  onBatchRenew: () => void;
  onBatchCancel: () => void;
}

/** 订单列表批量操作区：导出 / 批量续卡 / 一键撤单；三项均不可用时整体不渲染。 */
export function OrderBatchActions({
  canExport,
  canRenew,
  canCancel,
  exporting,
  onExport,
  onBatchRenew,
  onBatchCancel,
}: OrderBatchActionsProps) {
  if (!canExport && !canRenew && !canCancel) {
    return null;
  }

  return (
    <Space className="mb-3 shrink-0">
      {canExport && (
        <Button icon={<DownloadOutlined />} loading={exporting} onClick={onExport}>
          导出
        </Button>
      )}
      {canRenew && <Button onClick={onBatchRenew}>批量续卡</Button>}
      {canCancel && (
        <Button danger onClick={onBatchCancel}>
          一键撤单
        </Button>
      )}
    </Space>
  );
}
