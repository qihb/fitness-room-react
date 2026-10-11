import { Card, Col, Row, Statistic } from "antd";

/** 仪表盘：占位页，演示 antd 栅格与统计卡片。 */
export function DashboardPage() {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} lg={8}>
        <Card>
          <Statistic title="会员总数" value={1280} />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={8}>
        <Card>
          <Statistic title="今日新增" value={36} />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={8}>
        <Card>
          <Statistic title="待处理订单" value={12} />
        </Card>
      </Col>
    </Row>
  );
}
