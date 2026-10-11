import { Button, Card, Space, Statistic } from "antd";
import { useCounterStore } from "../stores/use-counter-store";

/** 示例：React 函数组件 + Tailwind 布局 + antd 组件 + zustand 状态。 */
export function CounterCard() {
  const count = useCounterStore((state) => state.count);
  const increment = useCounterStore((state) => state.increment);
  const decrement = useCounterStore((state) => state.decrement);
  const reset = useCounterStore((state) => state.reset);

  return (
    <Card title="zustand 计数器" className="w-full">
      <Space direction="vertical" size="middle" className="w-full">
        <Statistic title="当前计数" value={count} />
        <Space wrap>
          <Button type="primary" onClick={increment}>
            +1
          </Button>
          <Button onClick={decrement}>-1</Button>
          <Button onClick={reset}>重置</Button>
        </Space>
      </Space>
    </Card>
  );
}
