import { beforeEach, describe, expect, it } from "vite-plus/test";
import { useCounterStore } from "./use-counter-store";

describe("useCounterStore", () => {
  beforeEach(() => {
    useCounterStore.setState({ count: 0 });
  });

  it("increment / decrement 按步长修改计数", () => {
    const { increment, decrement } = useCounterStore.getState();
    increment();
    increment();
    expect(useCounterStore.getState().count).toBe(2);
    decrement();
    expect(useCounterStore.getState().count).toBe(1);
  });

  it("reset 归零", () => {
    useCounterStore.getState().increment();
    useCounterStore.getState().reset();
    expect(useCounterStore.getState().count).toBe(0);
  });
});
