import Link from "next/link";
import { IconUpload, IconSparkles, IconGallery } from "@/lib/icons";

const chapters = [
  {
    Icon: IconUpload,
    no: "第一话",
    title: "上传照片",
    desc: "这些天去了哪里、吃了什么、见了谁——把手机里的照片传上来,拍摄时间和地点自动读取",
  },
  {
    Icon: IconSparkles,
    no: "第二话",
    title: "整理时间线",
    desc: "照片按日子自动排好,一天一格,像漫画分镜一样铺开你的生活",
  },
  {
    Icon: IconGallery,
    no: "第三话",
    title: "生成回忆集",
    desc: "AI 帮你挑主题、写导语,把值得记住的日子装订成一本可分享的回忆集",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] px-6 py-12">
      <div className="text-center max-w-3xl w-full">
        {/* Hero:速度线上的大标题 */}
        <div className="relative speed-lines rounded-2xl border-[3px] border-[var(--ink)] shadow-[6px_6px_0_var(--ink)] bg-[var(--paper)] px-6 py-14 mb-10 overflow-hidden">
          <span className="absolute top-4 left-4 manga-tag manga-tag-accent rotate-[-4deg]">连载中</span>
          <span className="absolute top-4 right-4 manga-tag rotate-[3deg]">全彩</span>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-none mb-6">
            把日子
            <span className="text-[var(--accent)]">画成</span>
            <br />
            回忆集
          </h1>
          <p className="text-base md:text-lg font-bold opacity-80">
            上传照片 · 按时间线整理 · 装订成册
          </p>
        </div>

        {/* 气泡引导 */}
        <div className="speech-bubble max-w-md mx-auto text-left mb-12">
          <p className="text-sm leading-relaxed">
            “前几天去的海边、上周那顿火锅、去年生日的蛋糕……
            照片躺在相册里就只是文件。<b>放进来,它们就是你的连载。</b>”
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link href="/register" className="manga-btn manga-btn-accent text-base !px-8">
            开始我的第一话 →
          </Link>
          <Link href="/login" className="manga-btn manga-btn-ghost text-base !px-8">
            已有账号?登录
          </Link>
        </div>

        {/* 三话分格 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
          {chapters.map(({ Icon, no, title, desc }, i) => (
            <div key={title} className={`glass-card p-6 ${i === 1 ? "md:rotate-[0.6deg]" : i === 2 ? "md:rotate-[-0.6deg]" : "md:rotate-[0.3deg]"}`}>
              <div className="flex items-center justify-between mb-4">
                <span className="manga-tag manga-tag-sky">{no}</span>
                <div className="w-10 h-10 rounded-md border-[3px] border-[var(--ink)] bg-[var(--sun)] flex items-center justify-center shadow-[2px_2px_0_var(--ink)]">
                  <Icon className="text-[#1c1917]" size={20} />
                </div>
              </div>
              <h3 className="font-black text-lg mb-1.5">{title}</h3>
              <p className="text-sm opacity-70 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
