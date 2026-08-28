/**
 * 小琥 —— 首页里那个把日子画下来的人。
 *
 * 之前几格画的是云、面碗、路灯这些「静物」,那是插图不是动漫。
 * 动漫风的核心是有角色、有表情、有情绪符号(汗滴、闪光、青筋、脸红斜线)。
 * 所以加一个贯穿全页的角色,首页从「五张画」变成「一小段演出」。
 *
 * 全部线稿用 currentColor,跟随 --ink,暗色模式自动成立。
 * 每个 path 带 pathLength="1",配合 .ink 的 stroke-dashoffset 描线动画。
 */

export interface FaceProps {
  className?: string;
  style?: React.CSSProperties;
}

const L = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  pathLength: 1,
};

const HAIR = {
  ...L,
  strokeWidth: 3,
};

/** 头部轮廓 + 头发,五官由各表情单独画 */
function Head() {
  return (
    <>
      {/* 脸 */}
      <path {...L} d="M62 58 q0-32 38-32 q38 0 38 32 q0 34-38 42 q-38-8-38-42 z" />
      {/* 刘海 */}
      <path {...HAIR} d="M62 52 q4-34 38-34 q34 0 38 34 q-10-14-24-12 q-6-10-18-8 q-14 2-16 14 q-10-2-18 6 z" />
      {/* 侧发 */}
      <path {...HAIR} d="M62 54 q-8 16 -4 34" />
      <path {...HAIR} d="M138 54 q8 16 4 34" />
    </>
  );
}

/** 平常:安静地看着 */
export function FaceCalm({ className = "", style }: FaceProps) {
  return (
    <svg viewBox="0 0 200 120" className={className} style={style} aria-hidden preserveAspectRatio="xMidYMid meet">
      <g className="ink">
        <Head />
        <path {...L} d="M80 62 q7 6 14 0" />
        <path {...L} d="M106 62 q7 6 14 0" />
        <path {...L} d="M94 78 q6 4 12 0" />
      </g>
    </svg>
  );
}

/** 累:眯眼 + 汗滴 —— 加班那碗面 */
export function FaceTired({ className = "", style }: FaceProps) {
  return (
    <svg viewBox="0 0 200 120" className={className} style={style} aria-hidden preserveAspectRatio="xMidYMid meet">
      <g className="ink">
        <Head />
        {/* 眯成一条线的眼 */}
        <path {...L} d="M78 64 h18" />
        <path {...L} d="M104 64 h18" />
        {/* 无奈的嘴 */}
        <path {...L} d="M92 80 q8-4 16 0" />
        {/* 汗滴 */}
        <path {...L} d="M146 44 c0 0 -8 12 -8 17 a8 8 0 0 0 16 0 c0-5 -8-17 -8-17 z" />
      </g>
    </svg>
  );
}

/** 高兴:闪亮的眼 + 脸红斜线 —— 周二的天真好 */
export function FaceHappy({ className = "", style }: FaceProps) {
  return (
    <svg viewBox="0 0 200 120" className={className} style={style} aria-hidden preserveAspectRatio="xMidYMid meet">
      <g className="ink">
        <Head />
        {/* 弯成月牙的笑眼 */}
        <path {...L} d="M78 66 q9-12 18 0" />
        <path {...L} d="M104 66 q9-12 18 0" />
        {/* 张嘴笑 */}
        <path {...L} d="M90 78 q10 12 20 0 q-10 4 -20 0 z" />
        {/* 脸颊斜线 */}
        <path {...L} d="M70 70 l6-8 M76 74 l6-8" />
        <path {...L} d="M118 70 l6-8 M124 74 l6-8" />
        {/* 头顶闪光 */}
        <path {...L} d="M152 30 l3 9 l9 3 l-9 3 l-3 9 l-3-9 l-9-3 l9-3 z" />
      </g>
    </svg>
  );
}

/** 发呆:点点点 —— 没发出去的那条消息 */
export function FaceBlank({ className = "", style }: FaceProps) {
  return (
    <svg viewBox="0 0 200 120" className={className} style={style} aria-hidden preserveAspectRatio="xMidYMid meet">
      <g className="ink">
        <Head />
        {/* 空洞的眼 */}
        <circle {...L} cx="87" cy="64" r="4" />
        <circle {...L} cx="113" cy="64" r="4" />
        {/* 一条直线的嘴 */}
        <path {...L} d="M92 80 h16" />
        {/* 省略号:说不出话 */}
        <path {...L} d="M150 40 h1 M160 40 h1 M170 40 h1" strokeWidth="6" />
      </g>
    </svg>
  );
}

/** 睡着:zzz —— 猫又睡了,人也困了 */
export function FaceSleep({ className = "", style }: FaceProps) {
  return (
    <svg viewBox="0 0 200 120" className={className} style={style} aria-hidden preserveAspectRatio="xMidYMid meet">
      <g className="ink">
        <Head />
        {/* 闭着的眼 */}
        <path {...L} d="M78 64 q9 8 18 0" />
        <path {...L} d="M104 64 q9 8 18 0" />
        {/* 微张的嘴 */}
        <path {...L} d="M96 80 q4 5 8 0 q-4 2 -8 0 z" />
        {/* zzz */}
        <path {...L} d="M146 46 h12 l-12 12 h12" />
        <path {...L} d="M162 32 h9 l-9 9 h9" />
        <path {...L} d="M175 22 h7 l-7 7 h7" />
      </g>
    </svg>
  );
}

export const FACES = [FaceHappy, FaceTired, FaceCalm, FaceSleep, FaceBlank];
