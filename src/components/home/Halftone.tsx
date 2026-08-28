"use client";

import { useEffect, useRef } from "react";

/**
 * 真网点渲染。
 *
 * 用 halftone-ui 的引擎(MIT,src/vendor/halftone-kit/,含 LICENSE)。
 * 它的做法是:一片带种子的 Poisson-disk 蓝噪点云,每个点带自己的阈值;
 * 组件给出一个墨色深浅函数 field(u,v) -> 0..1,渲染时只保留墨色够得到的点。
 * 这是真印刷逻辑 —— 我之前手写的 radial-gradient 只是贴了张点子图。
 *
 * SSR 安全:引擎在模块顶层不碰 window/document,但仍然只在 effect 里 mount。
 */

export type Screen = "stipple" | "lines" | "waves" | "hatch";

interface HalftoneProps {
  /** 墨色深浅:(u,v) 归一化坐标 -> 0(白)..1(全黑) */
  field: (u: number, v: number) => number;
  screen?: Screen;
  /** 点的疏密,越大点越稀 */
  scale?: number;
  /** 整体墨量 */
  ink?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function Halftone({
  field,
  screen = "stipple",
  scale = 1,
  ink = 1,
  className = "",
  style,
}: HalftoneProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let handle: { destroy?: () => void } | null = null;
    let cancelled = false;

    // 动态引入:引擎里有 canvas 相关代码,放进 effect 里最稳
    import("@/vendor/halftone-kit/press.js")
      .then(({ press }) => {
        if (cancelled || !ref.current) return;
        handle = press(ref.current, { field, screen, scale, ink });
      })
      .catch(() => {
        // 引擎没跑起来不该让页面挂掉 —— 退化成没有网点的干净格子
      });

    return () => {
      cancelled = true;
      handle?.destroy?.();
    };
  }, [field, screen, scale, ink]);

  return <div ref={ref} className={className} style={style} aria-hidden />;
}
