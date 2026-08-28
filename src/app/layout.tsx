import type { Metadata } from "next";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import localFont from "next/font/local";
import Link from "next/link";
import { ThemeProvider } from "@/components/ThemeProvider";
import NavMenu from "@/components/NavMenu";
import ClickEffect from "@/components/ClickEffect";
import "./globals.css";

// 三角色字体系统:
// display = 站酷庆科黄油体,粗壮扁方,漫画标题的重量
// hand    = 马善政毛笔楷书,真毛笔手写(原来的 Xingkai SC 只有 macOS 有,在别的系统上根本没生效)
// body    = Noto Serif SC,明朝体是日漫正文的惯例
const notoSerif = localFont({
  src: [
    { path: "../fonts/noto-serif-sc-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/noto-serif-sc-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/noto-serif-sc-900.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-serif",
  display: "swap",
});

// 自托管:字体文件在 src/fonts/,只含项目实际用到的 621 个字(共约 400KB)。
// 不走 next/font/google —— 那需要构建期访问 fonts.gstatic.com,
// 在代理环境下会超时,连带整页 500。自托管后构建与运行都不再依赖外网。
const zcool = localFont({
  src: "../fonts/zcool-qingke.woff2",
  variable: "--font-display",
  display: "swap",
});

const maShan = localFont({
  src: "../fonts/mashan.woff2",
  variable: "--font-hand",
  display: "swap",
});

export const metadata: Metadata = {
  // 没有它,分享卡片会用 localhost 地址,微信等渠道预览就废了
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
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
    <html lang="zh-CN" className={`${notoSerif.variable} ${zcool.variable} ${maShan.variable} h-full antialiased`} suppressHydrationWarning>
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
            <nav className="relative z-40 glass border-t-0 border-x-0" style={{ boxShadow: "0 4px 0 var(--ink)" }}>
              <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
                <Link href="/" className="flex items-center gap-2 group">
                  <span className="inline-flex items-center justify-center w-8 h-8 border-[3px] border-[var(--ink)] bg-[var(--accent)] text-[#fffdf7] font-black text-sm rounded-md shadow-[2px_2px_0_var(--ink)] group-hover:rotate-[-6deg] transition-transform">
                    忆
                  </span>
                  <span className="text-base sm:text-lg font-black tracking-tight truncate">Memory Gallery</span>
                </Link>
                <NavMenu user={user} />
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
