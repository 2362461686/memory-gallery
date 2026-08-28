/**
 * 首页分格里的线稿。
 *
 * 为什么自己画而不是下素材:查过 CC0 素材库(unDraw / Open Peeps / いらすとや),
 * 风格全是扁平插画,跟墨线漫画冲突,填进去会毁掉整体;授权也各有限制。
 * 内联 SVG 零外部请求、零授权问题,并且能用 stroke-dashoffset 让线条自己描出来 ——
 * 那正是这一页要的动画:你看着这页漫画被画出来。
 *
 * 所有 path 都带 pathLength="1",这样不同长度的线条能用同一套描画时长。
 */

export interface ArtProps {
  className?: string;
  style?: React.CSSProperties;
}

const line = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  pathLength: 1,
};

/** 周二的天:云和一只飞过的鸟 */
export function ArtSky({ className = "", style }: ArtProps) {
  return (
    <svg viewBox="0 0 200 120" className={className} style={style} aria-hidden preserveAspectRatio="xMidYMid meet">
      <g className="ink">
        <path {...line} d="M28 74 q8-16 24-13 q4-16 22-15 q17 1 20 16 q14-2 17 12 z" />
        <path {...line} d="M112 50 q6-12 18-10 q3-12 17-11 q13 1 15 12 q11-1 13 9 z" />
        <path {...line} d="M150 82 q7 6 14 0" />
        <path {...line} d="M164 82 q7 6 14 0" />
        <path {...line} d="M18 98 h164" />
      </g>
    </svg>
  );
}

/** 加班那碗面:碗、筷子、腾起的热气 */
export function ArtNoodles({ className = "", style }: ArtProps) {
  return (
    <svg viewBox="0 0 200 120" className={className} style={style} aria-hidden preserveAspectRatio="xMidYMid meet">
      <g className="ink">
        <path {...line} d="M52 62 h96 q-6 38 -48 38 q-42 0 -48-38 z" />
        <path {...line} d="M44 62 h112" />
        <path {...line} d="M72 62 q10-10 26-6 q18 4 30-4" />
        <path {...line} d="M120 30 l34-14" />
        <path {...line} d="M124 36 l34-14" />
        <path {...line} d="M78 42 q-8-12 2-20 q8-6 2-14" />
        <path {...line} d="M100 36 q-8-12 2-20 q8-6 2-12" />
      </g>
    </svg>
  );
}

/** 回家路上:路灯、地面、一个走远的人 */
export function ArtStreet({ className = "", style }: ArtProps) {
  return (
    <svg viewBox="0 0 200 120" className={className} style={style} aria-hidden preserveAspectRatio="xMidYMid meet">
      <g className="ink">
        <path {...line} d="M46 100 v-72" />
        <path {...line} d="M46 28 q0-10 12-10 h14" />
        <path {...line} d="M66 18 h14 a7 7 0 0 1 0 14 h-14 a7 7 0 0 1 0-14" />
        <path {...line} d="M60 42 l-8 16 M78 42 l8 16 M69 44 v18" />
        <path {...line} d="M18 100 h164" />
        <path {...line} d="M132 100 v-22 a7 7 0 0 1 14 0 v22" />
        <path {...line} d="M139 78 v-10" />
        <circle {...line} cx="139" cy="60" r="8" />
        <path {...line} d="M128 84 l-8 8 M150 84 l8 8" />
      </g>
    </svg>
  );
}

/** 猫又睡了:蜷成一团的猫 */
export function ArtCat({ className = "", style }: ArtProps) {
  return (
    <svg viewBox="0 0 200 120" className={className} style={style} aria-hidden preserveAspectRatio="xMidYMid meet">
      <g className="ink">
        <path {...line} d="M56 90 q-6-34 26-42 q34-8 48 16 q12 22 -8 30 z" />
        <path {...line} d="M92 52 l-6-14 l16 6" />
        <path {...line} d="M118 50 l10-12 l2 16" />
        <path {...line} d="M96 62 q6 4 12 0" />
        <path {...line} d="M114 62 q6 4 12 0" />
        <path {...line} d="M108 70 q4 4 8 0" />
        <path {...line} d="M56 90 q-22 4 -20 -12 q2-10 14-6" />
        <path {...line} d="M22 98 h158" />
        <path {...line} d="M150 40 q6-8 12-2 M164 34 q7-7 12 0" />
      </g>
    </svg>
  );
}

/** 没发出去的那条消息:手机、气泡、光标 */
export function ArtMessage({ className = "", style }: ArtProps) {
  return (
    <svg viewBox="0 0 200 120" className={className} style={style} aria-hidden preserveAspectRatio="xMidYMid meet">
      <g className="ink">
        <rect {...line} x="62" y="12" width="76" height="98" rx="10" />
        <path {...line} d="M88 22 h24" />
        <path {...line} d="M74 44 h44 a6 6 0 0 1 6 6 v10 a6 6 0 0 1 -6 6 h-38 l-8 8 v-8 a6 6 0 0 1 -4-6 v-10 a6 6 0 0 1 6-6 z" />
        <path {...line} d="M82 54 h26" />
        <path {...line} d="M96 84 h30" />
        <path {...line} d="M126 78 v12" />
      </g>
    </svg>
  );
}

export const PANEL_ART = [ArtSky, ArtNoodles, ArtStreet, ArtCat, ArtMessage];
