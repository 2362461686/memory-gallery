"use client";

import { useState } from "react";
import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import LogoutButton from "./LogoutButton";

const LINKS = [
  { href: "/dashboard", label: "我的回忆" },
  { href: "/import", label: "上传照片" },
  { href: "/settings", label: "页边吐槽" },
];

export default function NavMenu({ user }: { user: { name?: string; email?: string } | null }) {
  const [open, setOpen] = useState(false);

  if (!user) {
    return (
      <div className="flex items-center gap-3 text-sm font-bold">
        <Link href="/" className="hover:text-[var(--accent)] transition-colors">首页</Link>
        <Link href="/login" className="manga-btn manga-btn-accent !py-1.5 !px-4 !text-xs">登录</Link>
        <ThemeToggle />
      </div>
    );
  }

  const name = user.name || user.email?.split("@")[0];

  return (
    <>
      {/* 桌面:平铺 */}
      <div className="hidden md:flex items-center gap-5 text-sm font-bold">
        <Link href="/" className="hover:text-[var(--accent)] transition-colors">首页</Link>
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="hover:text-[var(--accent)] transition-colors">
            {l.label}
          </Link>
        ))}
        <span className="manga-tag">{name}</span>
        <LogoutButton />
        <ThemeToggle />
      </div>

      {/* 手机:主题 + 汉堡,保证 320px 也放得下 */}
      <div className="flex md:hidden items-center gap-2">
        <ThemeToggle />
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "关闭菜单" : "打开菜单"}
          className="w-9 h-9 border-[3px] border-[var(--ink)] rounded-md bg-[var(--paper)] shadow-[2px_2px_0_var(--ink)] flex flex-col items-center justify-center gap-[3px] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
        >
          <span className={`block w-4 h-[3px] bg-[var(--ink)] transition-transform ${open ? "translate-y-[6px] rotate-45" : ""}`} />
          <span className={`block w-4 h-[3px] bg-[var(--ink)] transition-opacity ${open ? "opacity-0" : ""}`} />
          <span className={`block w-4 h-[3px] bg-[var(--ink)] transition-transform ${open ? "-translate-y-[6px] -rotate-45" : ""}`} />
        </button>
      </div>

      {/* 手机抽屉 */}
      {open && (
        <div className="md:hidden absolute top-full left-0 right-0 z-50 bg-[var(--paper)] border-b-[3px] border-[var(--ink)] shadow-[0_6px_0_rgba(0,0,0,0.08)]">
          <nav className="flex flex-col p-3 gap-1">
            <span className="manga-tag self-start mb-2">{name}</span>
            <Link href="/" onClick={() => setOpen(false)} className="py-3 px-3 font-bold border-b-2 border-[var(--ink)]/15 active:bg-[var(--sun)]/30 transition-colors">
              首页
            </Link>
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="py-3 px-3 font-bold border-b-2 border-[var(--ink)]/15 active:bg-[var(--sun)]/30 transition-colors"
              >
                {l.label}
              </Link>
            ))}
            <div className="pt-3">
              <LogoutButton />
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
