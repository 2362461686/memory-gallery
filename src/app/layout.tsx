import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Memory Gallery - 把你的数字生活变成一场展览",
  description:
    "Memory Gallery 是一个虚拟策展人，帮你把社交媒体内容整理成主题展览，支持 QQ 空间导入、相册上传，AI 自动策展。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="min-h-full flex flex-col bg-gradient-to-br from-[#fce4ec] via-[#e8eaf6] to-[#e0f7fa] text-zinc-800 font-sans antialiased">
        {/* Animated background decorations */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-20 left-[10%] w-64 h-64 bg-pink-200/20 rounded-full blur-3xl animate-float" />
          <div className="absolute top-40 right-[15%] w-48 h-48 bg-indigo-200/20 rounded-full blur-3xl animate-float-delayed" />
          <div className="absolute bottom-20 left-[30%] w-56 h-56 bg-cyan-200/20 rounded-full blur-3xl animate-float-slow" />
        </div>
        {/* Navigation */}
        <nav className="relative z-10 border-b border-white/50 backdrop-blur-sm bg-white/40">
          <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
            <a
              href="/"
              className="text-xl font-bold bg-gradient-to-r from-pink-500 to-indigo-500 bg-clip-text text-transparent"
            >
              Memory Gallery
            </a>
            <div className="flex items-center gap-4 text-sm">
              <a href="/" className="text-zinc-600 hover:text-pink-500 transition-colors">
                首页
              </a>
              <a href="/login" className="text-zinc-600 hover:text-pink-500 transition-colors">
                登录
              </a>
            </div>
          </div>
        </nav>
        {/* Main content */}
        <main className="relative z-10 flex-1">{children}</main>
        {/* Footer */}
        <footer className="relative z-10 border-t border-white/50 bg-white/30 py-6 text-center text-sm text-zinc-400">
          <p>Memory Gallery - 把你的数字生活变成一场展览</p>
        </footer>
      </body>
    </html>
  );
}
