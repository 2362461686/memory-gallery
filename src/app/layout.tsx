import type { Metadata } from "next";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Memory Gallery - 把你的数字生活变成一场展览",
  description:
    "Memory Gallery 是一个虚拟策展人，帮你把社交媒体内容整理成主题展览，支持 QQ 空间导入、相册上传，AI 自动策展。",
};

async function getUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;
    if (!token) return null;
    const payload = await verifyToken(token);
    return payload as { id: string; email: string; name?: string } | null;
  } catch {
    return null;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getUser();

  return (
    <html lang="zh-CN" className="h-full">
      <body className="min-h-full flex flex-col bg-[#FAFAFA] text-zinc-800 antialiased">
        {/* Subtle background grain */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-pink-100/40 rounded-full blur-[120px] animate-float" />
          <div className="absolute -bottom-20 -left-20 w-[500px] h-[500px] bg-indigo-100/30 rounded-full blur-[100px] animate-float-delayed" />
          <div className="absolute top-[40%] left-[40%] w-[400px] h-[400px] bg-violet-100/25 rounded-full blur-[100px] animate-float-slow" />
        </div>

        {/* Navigation */}
        <nav className="relative z-10 border-b border-zinc-200/60 bg-white/70 backdrop-blur-lg">
          <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
            <Link
              href="/"
              className="text-lg font-bold tracking-tight bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent"
            >
              Memory Gallery
            </Link>
            <div className="flex items-center gap-5 text-sm">
              <Link href="/" className="text-zinc-500 hover:text-zinc-900 transition-colors">
                首页
              </Link>
              {user ? (
                <>
                  <Link href="/dashboard" className="text-zinc-500 hover:text-zinc-900 transition-colors">
                    仪表盘
                  </Link>
                  <Link href="/import" className="text-zinc-500 hover:text-zinc-900 transition-colors">
                    导入
                  </Link>
                  <span className="text-zinc-300">|</span>
                  <span className="text-zinc-400 text-xs">
                    {user.name || user.email?.split("@")[0]}
                  </span>
                </>
              ) : (
                <Link
                  href="/login"
                  className="px-4 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 transition-colors"
                >
                  登录
                </Link>
              )}
            </div>
          </div>
        </nav>

        {/* Main content */}
        <main className="relative z-10 flex-1">{children}</main>

        {/* Footer */}
        <footer className="relative z-10 border-t border-zinc-200/60 bg-white/50 py-8 text-center text-xs text-zinc-400">
          <p>Memory Gallery - 把你的数字生活变成一场展览</p>
        </footer>
      </body>
    </html>
  );
}
