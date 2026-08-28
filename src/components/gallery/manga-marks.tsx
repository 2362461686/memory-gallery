/**
 * 漫画表情符号
 *
 * 漫画的表现是「约定俗成的集合体」—— 青筋=生气、汗滴=无语、斜线=害羞、
 * 放射点线=心情愉悦或灵感迸发。这些符号读者一看就懂,不需要解释。
 *
 * 这里把它们接到图片特征上:高兴趣度的照片冒闪光,大片纯色的截图冒汗滴。
 * 册子因此会「对你的照片有反应」,而不是无意义的装饰。
 */

const STROKE = "var(--ink)";

/** 放射点线:心情愉悦 / 这张有活人感 */
export function MarkSparkle({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden fill="none">
      <path d="M20 2 L23 15 L36 18 L23 21 L20 34 L17 21 L4 18 L17 15 Z" fill="var(--sun)" stroke={STROKE} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M33 4 L34.5 9 L39 10.5 L34.5 12 L33 17 L31.5 12 L27 10.5 L31.5 9 Z" fill="var(--sun)" stroke={STROKE} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

/** 汗滴:无语 / 这张有点平 */
export function MarkSweat({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 40" className={className} aria-hidden fill="none">
      <path d="M15 3 C15 3 4 20 4 27 A11 11 0 0 0 26 27 C26 20 15 3 15 3 Z" fill="var(--sky)" stroke={STROKE} strokeWidth="2.5" strokeLinejoin="round" />
      <ellipse cx="11" cy="26" rx="2.6" ry="4" fill="var(--paper)" opacity="0.85" />
    </svg>
  );
}

/** 青筋(井字):不爽 / 这张看着来气 */
export function MarkAnger({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 34 34" className={className} aria-hidden fill="none" stroke={STROKE} strokeWidth="3" strokeLinecap="round">
      <path d="M11 4 L8 30" stroke="var(--accent)" />
      <path d="M22 4 L19 30" stroke="var(--accent)" />
      <path d="M4 12 L30 9" stroke="var(--accent)" />
      <path d="M4 24 L30 21" stroke="var(--accent)" />
    </svg>
  );
}

/** 脸颊斜线:害羞 / 这张有点私密 */
export function MarkBlush({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 22" className={className} aria-hidden fill="none" stroke="var(--accent)" strokeWidth="2.6" strokeLinecap="round">
      <path d="M4 16 L11 4" /><path d="M13 18 L20 6" /><path d="M22 16 L29 4" />
    </svg>
  );
}

export type MarkKind = "sparkle" | "sweat" | "anger" | "blush";

/** 按图片特征选符号 —— 有依据,不是随机撒装饰 */
export function pickMark(interest: number, ratio: number): MarkKind | null {
  if (interest >= 0.62) return "sparkle";  // 色彩丰富、明暗有层次
  if (interest <= 0.14) return "sweat";    // 大片纯色,多半是截图
  if (ratio < 0.6) return "blush";         // 极竖构图,通常是人像自拍
  return null;                              // 其余不加,免得满页符号
}

export function MangaMark({ kind, className = "" }: { kind: MarkKind; className?: string }) {
  if (kind === "sparkle") return <MarkSparkle className={className} />;
  if (kind === "sweat") return <MarkSweat className={className} />;
  if (kind === "anger") return <MarkAnger className={className} />;
  return <MarkBlush className={className} />;
}
