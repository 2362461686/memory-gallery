import Link from "next/link";
import { PANEL_ART } from "@/components/home/PanelArt";

/**
 * 首页的记忆点(signature):一页会自己装订起来的漫画。
 *
 * 打开就看着几个平凡瞬间一格一格砸到纸上,拟声词跟着响,
 * 最后落下来的那一格是标题。这就是产品的论点本身 ——
 * 你的普通日子,变成这个。
 *
 * 大胆只花在这一处;页面其余部分一律安静。
 */

// 刻意选最没什么故事的瞬间 —— 平凡才是论点。
//
// 少年漫画的一页不是五个同等大小的格子平摊 —— 它有轻重:
// 一格压成实心黑(ベタ)当视觉锚,一格是決めゴマ(集中線+出血+大拟声词)当落点,
// 其余保持安静。这三样都是印刷语汇,不需要任何角色素材。
const panels = [
  { caption: "周二的天", sfx: "唰", sfxClass: "manga-sfx-soft", tone: "sky", tilt: "-1.6deg" },
  { caption: "加班那碗面", sfx: "", sfxClass: "", tone: "sun", tilt: "1.4deg" },
  // ベタ格:整页唯一的实心黑。原来是 tone-dots,那是灰的,压不住场
  { caption: "回家路上", sfx: "咔嚓", sfxClass: "manga-sfx-loud", tone: "beta", tilt: "-1.1deg" },
  { caption: "猫又睡了", sfx: "", sfxClass: "", tone: "sun", tilt: "1.8deg" },
  // 決めゴマ:紧挨标题格,是视线落到 CTA 之前的最后一击。
  // 中空字:一声没送达的提示音,回响但没落地 —— 跟这格的文案是同一件事
  { caption: "没发出去的那条消息", sfx: "叮", sfxClass: "manga-sfx-hollow", tone: "sky", tilt: "-1.3deg", hero: true },
];

const toneClass: Record<string, string> = {
  sky: "bg-[color-mix(in_srgb,var(--sky)_38%,var(--paper))]",
  sun: "bg-[color-mix(in_srgb,var(--sun)_34%,var(--paper))]",
  dots: "tone-dots",
  beta: "panel-beta",
};

const areas = [
  "1 / 1 / 2 / 3",
  "1 / 3 / 3 / 4",
  "2 / 1 / 3 / 2",
  "2 / 2 / 3 / 3",
  "3 / 3 / 4 / 4",
];

export default function Home() {
  return (
    <div className="px-4 sm:px-6">
      {/* ════ SIGNATURE:自己装订起来的一页 ════ */}
      <section className="min-h-[calc(100vh-140px)] flex items-center justify-center py-10">
        <div className="assemble-quake w-full max-w-3xl">
          <div className="masthead p-3 sm:p-5" style={{ aspectRatio: "4 / 3.1" }}>
            <div
              className="assemble h-full grid gap-2 sm:gap-3"
              style={{
                gridTemplateColumns: "1.25fr 1fr 1fr",
                gridTemplateRows: "1.15fr 1fr 1.5fr",
              }}
            >
              {panels.map((p, i) => {
                const Art = PANEL_ART[i];
                const beta = p.tone === "beta";
                return (
                <figure
                  key={p.caption}
                  className={`manga-panel relative overflow-hidden ${toneClass[p.tone]} ${
                    // 決めゴマ:集中線收束。
                    // ⛔ 试过出血(负边距顶到刊头内缘)——这一页的"纸边"就是刊头那道框,
                    // 负边距把框撞断了,看着像渲染坏了不像出血。已撤。
                    p.hero ? "focus-lines fx-focus-strong" : ""
                  }`}
                  style={
                    { "--drop-tilt": p.tilt, gridArea: areas[i] } as React.CSSProperties
                  }
                >
                  {/* 线稿:格子落地之后才开始描。ベタ格上是白线,所以那一格必须先黑 */}
                  <Art
                    className={`absolute inset-0 w-full h-full p-2 ${
                      beta ? "text-[var(--paper)]" : "text-[var(--ink)]"
                    }`}
                    style={{ ["--ink-delay" as string]: `${0.2 + i * 0.16}s` }}
                  />
                  {/* 旁白框:交代这是哪个瞬间。ベタ格上仍是白框黑字 —— 漫画里就是这么压的 */}
                  <figcaption className="absolute top-0 left-0 z-10 bg-[var(--paper)] text-[var(--ink)] border-r-[3px] border-b-[3px] border-[var(--ink)] px-2 py-[3px] text-[0.6rem] sm:text-[0.7rem] font-black max-w-[88%] truncate">
                    {p.caption}
                  </figcaption>

                  {p.sfx && (
                    // 外层只管"跟着自己那一格落地",内层才是字本身 ——
                    // 两个 animation 分层,否则持续抖动会被落地动画整个覆盖掉
                    <span
                      className={`sfx-drop absolute z-20 pointer-events-none ${
                        // 決めゴマ的拟声词挪到左下:右下和手机的线缠在一起,两边都读不清
                        p.hero ? "bottom-4 left-4 sm:bottom-6 sm:left-6" : "bottom-2 right-2"
                      }`}
                      style={{ animationDelay: `${0.34 + i * 0.14}s` }}
                    >
                      <span
                        className={`block manga-sfx ${p.sfxClass} ${
                          p.hero ? "fx-sfx-shake text-2xl sm:text-6xl" : "text-xl sm:text-3xl"
                        }`}
                      >
                        {p.sfx}
                      </span>
                    </span>
                  )}
                </figure>
                );
              })}

              {/* 最后落下的一格:标题 —— 论点在这里落地 */}
              <div
                className="manga-panel relative flex flex-col items-center justify-center text-center px-4 py-6"
                style={{ "--drop-tilt": "1.2deg", gridArea: "3 / 1 / 4 / 3" } as React.CSSProperties}
              >
                <h1 className="title-logo text-3xl sm:text-5xl leading-[1.06] mb-4">
                  把这些日子
                  <br />
                  画成一本
                </h1>
                <Link href="/register" className="manga-btn manga-btn-accent !py-2 !px-6 text-sm">
                  开始我的第一话 →
                </Link>
              </div>
            </div>
          </div>

          {/* 欄外:书的页边,不是网页的说明文字 */}
          <div className="flex flex-wrap items-center justify-between gap-3 mt-4 px-1">
            <p className="handwriting text-sm sm:text-base font-bold opacity-70">
              上面这五格，都是很普通的一天。
            </p>
            <Link
              href="/login"
              className="text-sm font-bold opacity-60 hover:opacity-100 hover:text-[var(--accent)] transition-all underline underline-offset-4"
            >
              已有账号？登录
            </Link>
          </div>
        </div>
      </section>

      {/* ════ 以下全部保持安静 ════ */}

      <section className="max-w-2xl mx-auto pb-28">
        <div className="panel-in">
          <p className="display text-xl sm:text-2xl leading-[1.85]">
            照片躺在相册里，就只是文件。
            <br />
            <span className="text-[var(--accent)]">排进格子里，它们才是你的连载。</span>
          </p>
          <div className="h-[3px] w-16 bg-[var(--ink)] mt-6" />
        </div>
      </section>

      <section className="max-w-3xl mx-auto pb-28">
        <ol className="border-t-[3px] border-[var(--ink)]">
          {[
            ["传照片", "拍摄时间和地点自动读取。截图也收 —— 它也是回忆的一种。"],
            ["排成分镜", "格子比例跟着照片走，竖图不会被裁。一起传的算一话。"],
            ["装订成卷", "挑内容、排顺序、选封面、起名字。发给谁看，随时能撤回。"],
          ].map(([title, desc], i) => (
            <li key={title} className="panel-in toc-row flex items-baseline gap-5">
              <span className="display shrink-0 text-3xl sm:text-4xl tabular-nums opacity-25">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <h2 className="display text-xl sm:text-2xl mb-1">{title}</h2>
                <p className="text-sm opacity-65 leading-relaxed font-bold">{desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="max-w-2xl mx-auto pb-28 text-center">
        <div className="panel-in">
          <p className="handwriting text-xl sm:text-2xl font-bold opacity-80 mb-8 leading-relaxed">
            下一话，是你还没过完的那些日子。
          </p>
          <Link href="/register" className="manga-btn manga-btn-accent text-base !px-8">
            开始连载 →
          </Link>
        </div>
      </section>
    </div>
  );
}
