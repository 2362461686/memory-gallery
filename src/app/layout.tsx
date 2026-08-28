import type { Metadata } from "next";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { Noto_Serif_SC } from "next/font/google";
import Link from "next/link";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import LogoutButton from "@/components/LogoutButton";
import ClickEffect from "@/components/ClickEffect";
import "./globals.css";

const notoSerif = Noto_Serif_SC({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Memory Gallery - 把日子画成回忆集",
  description:
    "Memory Gallery 是你的漫画风回忆录:上传这些天拍下的照片,自动按时间线整理,做成一本精美的回忆集。",
};

async function getUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
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
      <head>
        {/* 水合前定妥主题,避免刷新时纸白/夜刊闪一下 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("mg-theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme:dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`,
          }}
        />
      </head>
      <body className="w-screen overflow-x-hidden min-h-full flex flex-col relative font-serif">
        <ThemeProvider>
          <div className="flex-1 flex flex-col relative">
            {/* Navigation:漫画分格页眉 */}
            <nav className="relative z-10 glass border-t-0 border-x-0" style={{ boxShadow: "0 4px 0 var(--ink)" }}>
              <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 group">
                  <span className="inline-flex items-center justify-center w-8 h-8 border-[3px] border-[var(--ink)] bg-[var(--accent)] text-[#fffdf7] font-black text-sm rounded-md shadow-[2px_2px_0_var(--ink)] group-hover:rotate-[-6deg] transition-transform">
                    忆
                  </span>
                  <span className="text-lg font-black tracking-tight">Memory Gallery</span>
                </Link>
                <div className="flex items-center gap-5 text-sm font-bold">
                  <Link href="/" className="hover:text-[var(--accent)] transition-colors">
                    首页
                  </Link>
                  {user ? (
                    <>
                      <Link href="/dashboard" className="hover:text-[var(--accent)] transition-colors">
                        我的回忆
                      </Link>
                      <Link href="/import" className="hover:text-[var(--accent)] transition-colors">
                        上传照片
                      </Link>
                      <Link href="/settings" className="hover:text-[var(--accent)] transition-colors">
                        页边吐槽
                      </Link>
                      <span className="manga-tag">{user.name || user.email?.split("@")[0]}</span>
                      <LogoutButton />
                    </>
                  ) : (
                    <Link href="/login" className="manga-btn manga-btn-accent !py-1.5 !px-4 !text-xs">
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
            <footer className="relative z-10 py-6 text-center text-xs glass border-b-0 border-x-0" style={{ boxShadow: "0 -4px 0 var(--ink)" }}>
              <p className="font-bold opacity-60">Memory Gallery · 把日子画成回忆集 · 完</p>
            </footer>
          </div>
          <ClickEffect />
        </ThemeProvider>
      </body>
    </html>
  );
}
