import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] px-6">
      <div className="text-center max-w-2xl">
        {/* Title */}
        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
          <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
            Memory Gallery
          </span>
        </h1>
        <p className="text-lg md:text-xl text-zinc-500 mb-4">
          把你的数字生活变成一场展览
        </p>
        <p className="text-sm md:text-base text-zinc-400 mb-10 max-w-lg mx-auto leading-relaxed">
          授权接入你的社交媒体（QQ
          空间、手机相册），AI
          自动整理出主题展览——美食展、旅行展、emo 时刻展，
          并生成一个可分享的线上虚拟画廊。
        </p>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="inline-flex items-center justify-center px-8 py-3 rounded-2xl bg-gradient-to-r from-pink-400 to-purple-500 text-white font-medium shadow-lg shadow-purple-200/50 hover:shadow-xl hover:shadow-purple-300/50 transition-all hover:scale-105"
          >
            开始策展
            <svg
              className="ml-2 w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-8 py-3 rounded-2xl border-2 border-purple-200 text-purple-500 font-medium hover:bg-purple-50 transition-colors"
          >
            已有账号？登录
          </Link>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-16">
          {[
            {
              icon: "📱",
              title: "一键导入",
              desc: "连接 QQ 空间，或直接上传手机相册，轻松导入你的数字记忆",
            },
            {
              icon: "🤖",
              title: "AI 策展",
              desc: "DeepSeek AI 自动分类、打标签，生成主题展览和治愈导语",
            },
            {
              icon: "🎨",
              title: "虚拟画廊",
              desc: "3D 二次元风格线上展厅，沉浸式浏览你的专属回忆",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/80 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h3 className="font-semibold text-zinc-700 mb-2">{feature.title}</h3>
              <p className="text-sm text-zinc-400">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
