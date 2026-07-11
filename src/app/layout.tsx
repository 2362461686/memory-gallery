import type { Metadata } from "next";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { Noto_Serif_SC } from "next/font/google";
import Link from "next/link";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BackgroundFX } from "@/components/ClientLayout";
import ClickEffect from "@/components/ClickEffect";
import "./globals.css";

const notoSerif = Noto_Serif_SC({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-serif",
  display: "swap",
});

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
    <html lang="zh-CN" className={`${notoSerif.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="w-screen overflow-x-hidden min-h-full flex flex-col relative transition-colors duration-700 bg-slate-50 dark:bg-slate-950 font-serif">
        <ThemeProvider>
          <div className="flex-1 flex flex-col relative">
            {/* Background effects */}
            <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
              {/* Gradient overlay */}
              <div className="absolute inset-0 z-[-9] bg-white/40 dark:bg-slate-900/50 backdrop-blur-sm transition-colors duration-700" />

              {/* Animated gradient */}
              <div
                className="absolute inset-0 z-[-8] opacity-40 dark:opacity-15 mix-blend-color transition-opacity duration-700"
                style={{
                  background: "linear-gradient(-45deg, #a78bfa, #f9a8d4, #93c5fd, #a5f3fc)",
                  backgroundSize: "400% 400%",
                  animation: "gradientMove 15s ease infinite",
                }}
              />

              {/* Color blobs */}
              <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/50 dark:bg-indigo-900/20 blur-[100px] rounded-full z-[-7] md:mix-blend-overlay" />
              <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-200/50 dark:bg-purple-900/30 blur-[100px] rounded-full z-[-7] md:mix-blend-overlay" />

              {/* Fireflies (dark only) */}
              <BackgroundFX />
            </div>

            {/* Navigation */}
            <nav className="relative z-10 glass rounded-none border-t-0 border-x-0">
              <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
                <Link
                  href="/"
                  className="text-lg font-black tracking-tight bg-gradient-to-r from-indigo-500 to-pink-500 bg-clip-text text-transparent"
                >
                  Memory Gallery
                </Link>
                <div className="flex items-center gap-5 text-sm">
                  <Link
                    href="/"
                    className="text-slate-600 dark:text-slate-300 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
                  >
                    首页
                  </Link>
                  {user ? (
                    <>
                      <Link
                        href="/dashboard"
                        className="text-slate-600 dark:text-slate-300 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
                      >
                        仪表盘
                      </Link>
                      <Link
                        href="/import"
                        className="text-slate-600 dark:text-slate-300 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
                      >
                        导入
                      </Link>
                      <span className="text-slate-400 dark:text-slate-500 text-xs">
                        {user.name || user.email?.split("@")[0]}
                      </span>
                    </>
                  ) : (
                    <Link
                      href="/login"
                      className="px-4 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-medium transition-colors"
                    >
                      登录
                    </Link>
                  )}
                  <ThemeToggle />
                </div>
              </div>
            </nav>

            {/* Main content */}
            <main className="relative z-10 flex-1">{children}</main>

            {/* Footer */}
            <footer className="relative z-10 py-8 text-center text-xs text-slate-400 dark:text-slate-600 glass border-b-0 border-x-0">
              <p>Memory Gallery - 把你的数字生活变成一场展览</p>
            </footer>
          </div>
          <ClickEffect />
        </ThemeProvider>
      </body>
    </html>
  );
}
