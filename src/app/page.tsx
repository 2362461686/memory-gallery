import Link from "next/link";
import { IconUpload, IconSparkles, IconGallery } from "@/lib/icons";

const features = [
  {
    Icon: IconUpload,
    title: "一键导入",
    desc: "连接 QQ 空间或上传手机相册，轻松收集你的数字记忆",
  },
  {
    Icon: IconSparkles,
    title: "AI 策展",
    desc: "DeepSeek AI 自动分类、打标签，生成主题展览和策展导语",
  },
  {
    Icon: IconGallery,
    title: "虚拟画廊",
    desc: "3D 沉浸式线上展厅，以独特视角浏览你的专属回忆展",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] px-6">
      <div className="text-center max-w-3xl">
        {/* Hero */}
        <h1 className="text-5xl sm:text-6xl md:text-8xl font-bold tracking-tight leading-none mb-8">
          <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
            Memory
            <br />
            Gallery
          </span>
        </h1>

        <p className="text-lg md:text-xl text-zinc-500 mb-3 font-medium">
          把你的数字生活变成一场展览
        </p>

        <p className="text-sm md:text-base text-zinc-400 max-w-lg mx-auto leading-relaxed mb-12">
          接入你的社交媒体与相册，AI 自动整理出主题展览——美食、旅行、情绪时刻——生成可分享的线上虚拟画廊。
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-20">
          <Link
            href="/register"
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl bg-zinc-900 text-white font-medium text-sm hover:bg-zinc-800 transition-colors"
          >
            开始策展
            <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl border border-zinc-300 text-zinc-600 font-medium text-sm hover:bg-zinc-50 transition-colors"
          >
            已有账号？登录
          </Link>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          {features.map(({ Icon, title, desc }, i) => (
            <div
              key={title}
              className="group p-6 rounded-2xl bg-white border border-zinc-200/60 shadow-sm hover:shadow-md transition-shadow"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center mb-4 group-hover:bg-pink-100 transition-colors">
                <Icon className="text-pink-500" size={20} />
              </div>
              <h3 className="font-semibold text-zinc-800 mb-1.5">{title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
