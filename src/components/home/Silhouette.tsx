/**
 * 黑白漫画里的剪影人物。
 *
 * 上一版失败在去画五官 —— 手写 SVG 路径画不出好看的脸。
 * 黑白漫画的解法本来就不是画脸:很多分格里人物就是一团黑影,
 * 加几道白色高光切出发丝和轮廓,读者自己脑补。这个我能做好。
 *
 * 全部用 fill=currentColor,跟随 --ink,暗色模式自动反过来。
 */

export interface SilProps {
  className?: string;
  style?: React.CSSProperties;
}

/** 抬头看天的背影 —— 周二的天 */
export function SilLookUp({ className = "", style }: SilProps) {
  return (
    <svg viewBox="0 0 120 160" className={className} style={style} aria-hidden preserveAspectRatio="xMidYMax meet">
      <g fill="currentColor">
        {/* 头 + 微微仰起的角度 */}
        <path d="M42 30 q2-18 20-18 q19 0 21 19 q1 14-6 21 q-4 4-15 4 q-11 0-15-6 q-6-9-5-20 z" />
        {/* 头发:一撮翘起 */}
        <path d="M40 26 q4-20 22-20 q20 0 22 22 q-5-10-14-11 q-7-6-17-3 q-9 3-13 12 z" />
        <path d="M84 18 q10-6 14 2 q-7-2-11 3 z" />
        {/* 肩与身体 */}
        <path d="M46 56 q-18 6-22 26 q-3 16-2 44 h76 q1-28-2-44 q-4-20-22-26 q-6 6-14 6 q-8 0-14-6 z" />
      </g>
      {/* 白色高光:切出发丝与衣褶,黑白漫画的关键 */}
      <g fill="var(--paper)">
        <path d="M50 20 q8-8 18-6 q-9 1-14 8 z" />
        <path d="M58 70 q4 24 2 50 l-4 0 q2-26-2-50 z" opacity="0.85" />
        <path d="M76 78 q3 20 2 42 l-3 0 q1-22-2-42 z" opacity="0.7" />
      </g>
    </svg>
  );
}

/** 趴在桌上 —— 加班那碗面 */
export function SilSlump({ className = "", style }: SilProps) {
  return (
    <svg viewBox="0 0 120 160" className={className} style={style} aria-hidden preserveAspectRatio="xMidYMax meet">
      <g fill="currentColor">
        {/* 低垂的头 */}
        <path d="M30 78 q0-20 20-22 q22-2 24 18 q2 16-10 20 q-14 4-24-2 q-10-6-10-14 z" />
        {/* 散开的头发 */}
        <path d="M28 74 q0-26 24-27 q24-1 24 22 q-6-13-18-13 q-14 0-18 12 q-6 0-12 6 z" />
        {/* 伏下的背 */}
        <path d="M56 92 q26 2 38 14 q10 10 12 26 h-84 q0-24 14-32 q8-5 20-8 z" />
        {/* 桌面 */}
        <rect x="0" y="132" width="120" height="6" />
      </g>
      <g fill="var(--paper)">
        <path d="M40 62 q10-8 20-6 q-11 2-16 8 z" />
        <path d="M74 104 q10 6 14 18 l-4 1 q-4-12-13-17 z" opacity="0.75" />
      </g>
    </svg>
  );
}

/** 走远的背影 —— 回家路上 */
export function SilWalk({ className = "", style }: SilProps) {
  return (
    <svg viewBox="0 0 120 160" className={className} style={style} aria-hidden preserveAspectRatio="xMidYMax meet">
      <g fill="currentColor">
        <path d="M46 28 q1-17 19-17 q19 0 20 18 q1 13-6 19 q-4 4-14 4 q-10 0-14-6 q-6-8-5-18 z" />
        <path d="M44 24 q3-19 21-19 q19 0 21 21 q-5-10-13-11 q-8-5-17-2 q-8 3-12 11 z" />
        {/* 身体 + 走路的腿 */}
        <path d="M48 52 q-16 6-19 24 q-2 14-1 30 h64 q1-16-1-30 q-3-18-19-24 q-6 5-12 5 q-6 0-12-5 z" />
        <path d="M50 106 l-6 42 h12 l4-42 z" />
        <path d="M66 106 l10 40 h12 l-14-40 z" />
        {/* 单肩包 */}
        <path d="M72 58 q14 10 12 30 l-8 2 q2-18-10-28 z" />
      </g>
      <g fill="var(--paper)">
        <path d="M52 18 q9-7 18-5 q-10 1-14 7 z" />
        <path d="M56 70 q3 20 2 34 l-4 0 q1-16-2-34 z" opacity="0.8" />
      </g>
    </svg>
  );
}

/** 蜷着的猫 —— 猫又睡了 */
export function SilCat({ className = "", style }: SilProps) {
  return (
    <svg viewBox="0 0 120 160" className={className} style={style} aria-hidden preserveAspectRatio="xMidYMax meet">
      <g fill="currentColor">
        {/* 蜷成一团 */}
        <path d="M18 128 q-4-34 26-46 q34-14 54 10 q16 22 2 38 q-12 12-40 12 q-32 0-42-14 z" />
        {/* 耳朵 */}
        <path d="M44 86 l-4-18 l18 8 z" />
        <path d="M76 82 l12-16 l4 20 z" />
        {/* 尾巴绕回来 */}
        <path d="M18 126 q-16 4-14-12 q2-12 16-8 l2 8 q-8-2-9 4 q-1 6 7 4 z" />
        <rect x="0" y="140" width="120" height="5" />
      </g>
      <g fill="var(--paper)">
        <path d="M52 96 q14-8 28-2 q-15-1-24 6 z" opacity="0.8" />
        <path d="M96 108 q6 10 2 20 l-4-2 q4-9 -1-17 z" opacity="0.6" />
      </g>
    </svg>
  );
}

/** 低头看手机 —— 没发出去的那条消息 */
export function SilPhone({ className = "", style }: SilProps) {
  return (
    <svg viewBox="0 0 120 160" className={className} style={style} aria-hidden preserveAspectRatio="xMidYMax meet">
      <g fill="currentColor">
        <path d="M44 34 q1-18 20-18 q20 0 21 19 q1 14-7 20 q-4 4-14 4 q-11 0-15-6 q-6-9-5-19 z" />
        <path d="M42 30 q2-20 22-20 q21 0 22 22 q-5-11-14-12 q-8-5-18-2 q-9 3-12 12 z" />
        <path d="M48 58 q-17 6-20 25 q-3 15-2 33 h64 q1-18-2-33 q-3-19-20-25 q-6 5-10 5 q-4 0-10-5 z" />
        {/* 举着手机的手臂 */}
        <path d="M40 74 q-8 18 4 28 l10-4 q-10-8-4-22 z" />
        {/* 手机 */}
        <rect x="46" y="94" width="20" height="30" rx="3" />
        <rect x="0" y="150" width="120" height="5" />
      </g>
      <g fill="var(--paper)">
        <path d="M50 24 q9-8 19-6 q-11 2-15 8 z" />
        {/* 屏幕的光 */}
        <rect x="49" y="97" width="14" height="22" rx="2" opacity="0.9" />
      </g>
    </svg>
  );
}

export const SILHOUETTES = [SilLookUp, SilSlump, SilWalk, SilCat, SilPhone];
