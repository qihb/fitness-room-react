import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

/**
 * 表格内部滚动高度通用 hook：把 `ref` 挂到表格外层容器上，随容器尺寸变化重算 `scroll.y`，
 * 让表格「撑满内容区且不溢出」。
 *
 * 约定：
 * - `ref` 必须挂到**会伸缩的滚动容器**（如 `min-h-0 flex-1` 的 div），而非表格本身。
 * - 首帧测量前 `scrollY` 为 `undefined`；结果不小于 `minHeight`。
 * - `chromeHeight` 为表头 / 分页等占用的固定高度，默认 120。
 *
 * @example
 * ```tsx
 * const { ref, scrollY } = useTableScrollY();
 *
 * <div ref={ref} className="min-h-0 flex-1">
 *   <Table scroll={{ y: scrollY }} ... />
 * </div>
 * ```
 */

export interface UseTableScrollYOptions {
  /** 表头 + 分页等占用的固定高度（antd 默认值约 120）。 */
  chromeHeight?: number;
  /** 表体最小高度。 */
  minHeight?: number;
}

export interface UseTableScrollYResult {
  /** 挂到表格外层容器上的 ref。 */
  ref: RefObject<HTMLDivElement | null>;
  /** 传给 Table `scroll.y` 的表体高度；首帧未测量前为 undefined。 */
  scrollY: number | undefined;
}

/**
 * 表格滚动高度 hook 主体（用途与用法见文件头部说明）。
 * 由 `ResizeObserver` 异步回填，避免在 effect 内同步 setState。
 */
export function useTableScrollY(options: UseTableScrollYOptions = {}): UseTableScrollYResult {
  const { chromeHeight = 120, minHeight = 120 } = options;
  const [scrollY, setScrollY] = useState<number>();
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (el === null) {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const height = entries[0]?.contentRect.height ?? 0;
      setScrollY(Math.max(Math.floor(height) - chromeHeight, minHeight));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [chromeHeight, minHeight]);

  return { ref, scrollY };
}
