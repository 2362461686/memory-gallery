import Link from "next/link";
import { IconUpload, IconSparkles, IconGallery } from "@/lib/icons";

const chapters = [
  {
    Icon: IconUpload,
    no: "第一话",
    title: "把照片传上来",
    desc: "这些天去了哪里、吃了什么、见了谁。拍摄时间和地点自动读取，截图也收 —— 它也是回忆的一种。",
    sfx: "咔嚓",
    sfxStyle: "fx-sfx-shake",
  },
  {
    Icon: IconSparkles,
    no: "第二话",
    title: "自动排成分镜",
    desc: "格子的比例跟着照片走，竖图不会被裁。一起传的算一话，大小有起伏，像真的漫画页。",
    sfx: "唰",
    sfxStyle: "manga-sfx-soft fx-sfx-shake",
  },
  {
    Icon: IconGallery,
    no: "第三话",
    title: "装订成一卷",
    desc: "挑内容、排顺序、选封面、起名字，确认后装订。发给谁看，随时能撤回。",
    sfx: "砰!",
    sfxStyle: "manga-sfx-loud fx-sfx-bounce",
  },
];

export default function Home() {
  return (
    <div className="px-4 sm:px-6">
      {/* ── 刊头:整屏,标题砸在纸上 ── */}
      <section className="min-h-[calc(100vh-140px)] flex items-center justify-center py-12">
        <div className="masthead speed-lines fx-speed fx-shock w-full max-w-3xl relative overflow-hidden">
          <span className="absolute top-4 left-4 manga-tag manga-tag-accent rotate-[-4deg] z-10">连载中</span>
          <span className="absolute top-4 right-4 manga-tag rotate-[3deg] z-10">全彩</span>

          <div className="px-6 sm:px-10 py-16 sm:py-24 text-center relative z-10">
            <h1 className="title-impact fx-title-quake text-5xl sm:text-7xl font-black tracking-tight leading-[0.95] mb-6 relative z-10">
              把日子
              <br />
              <span className="text-[var(--accent)]">画成回忆集</span>
            </h1>

            <div className="h-[3px] w-20 bg-[var(--ink)] mx-auto mb-6" />

            <p className="handwriting text-lg sm:text-xl font-bold opacity-80 mb-10">
              上传照片 · 自动排成分镜 · 装订成册
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/register" className="manga-btn manga-btn-accent text-base !px-8">
                开始我的第一话 →
              </Link>
              <Link href="/login" className="manga-btn manga-btn-ghost text-base !px-8">
                已有账号？登录
              </Link>
            </div>
          </div>

          <span className="sfx-in fx-sfx-shake manga-sfx absolute bottom-5 left-6 text-4xl sm:text-5xl pointer-events-none z-10">
            咔嚓
          </span>
        </div>
      </section>

      {/* ── 气泡:一句话说清它凭什么 ── */}
      <section className="max-w-2xl mx-auto pb-24">
        <div className="panel-in speech-bubble">
          <p className="text-sm sm:text-base leading-relaxed font-bold">
            「前几天去的海边、上周那顿火锅、去年生日的蛋糕……
            照片躺在相册里就只是文件。<b>放进来，它们就是你的连载。</b>」
          </p>
        </div>
      </section>

      {/* ── 三话:逐格落到纸上,从右侧入场契合漫画动线 ── */}
      <section className="max-w-4xl mx-auto pb-24">
        <div className="manga-heading mb-8">
          <h2 className="text-xl font-black">怎么画</h2>
        </div>

        <div className="flex flex-col gap-6">
          {chapters.map(({ Icon, no, title, desc, sfx, sfxStyle }, i) => (
            <article
              key={no}
              className={`panel-in-r glass-card relative overflow-hidden ${
                i === 1 ? "sm:ml-12" : i === 2 ? "sm:ml-24" : ""
              }`}
            >
              <div className="flex items-start gap-5 p-6 sm:p-7">
                <div className="shrink-0 w-14 h-14 rounded-md border-[3px] border-[var(--ink)] bg-[var(--sun)] flex items-center justify-center shadow-[3px_3px_0_var(--ink)]">
                  <Icon className="text-[var(--on-bright)]" size={24} />
                </div>

                <div className="min-w-0 flex-1">
                  <span className="manga-tag manga-tag-sky mb-2 inline-block">{no}</span>
                  <h3 className="text-xl sm:text-2xl font-black mb-2">{title}</h3>
                  <p className="text-sm opacity-70 leading-relaxed font-bold">{desc}</p>
                </div>
              </div>

              <span
                className={`sfx-in manga-sfx ${sfxStyle} absolute -bottom-1 right-4 text-3xl sm:text-4xl pointer-events-none opacity-90`}
              >
                {sfx}
              </span>
            </article>
          ))}
        </div>
      </section>

      {/* ── 收尾:下回预告 ── */}
      <section className="max-w-2xl mx-auto pb-24">
        <div className="panel-in masthead speed-lines fx-speed text-center px-6 py-14">
          <span className="manga-sfx fx-sfx-bounce text-5xl sm:text-6xl inline-block mb-5">未完</span>
          <p className="handwriting text-lg font-bold opacity-80 mb-2">
            下一话：还没发生的那些日子
          </p>
          <p className="text-xs font-bold opacity-50 mb-8">等你回来继续画</p>
          <Link href="/register" className="manga-btn manga-btn-accent text-base !px-8">
            开始连载 →
          </Link>
        </div>
      </section>
    </div>
  );
}
