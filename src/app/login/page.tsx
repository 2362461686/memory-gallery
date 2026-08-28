"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "登录失败");
      setLoading(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-120px)] px-6">
      <div className="w-full max-w-md">
        <div className="glass-card p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black mb-1">欢迎回来</h1>
            <p className="text-sm opacity-60 font-bold">登录 Memory Gallery</p>
          </div>

          {error && (
            <div className="mb-6 p-3 border-[3px] border-[var(--accent)] rounded-md text-sm font-bold text-center">
              {error}
            </div>
          )}
          {registered === "1" && (
            <div className="mb-6 p-3 border-[3px] border-[var(--ink)] bg-[var(--sun)] rounded-md text-sm font-bold text-center text-[#17130e]">
              注册成功，请登录
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-black mb-1.5">邮箱</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full px-4 py-2.5 bg-[var(--paper)] border-[3px] border-[var(--ink)] rounded-md text-sm font-bold placeholder:opacity-40 placeholder:font-normal focus:outline-none focus:shadow-[3px_3px_0_var(--accent)] transition-shadow"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-black mb-1.5">密码</label>
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                className="w-full px-4 py-2.5 bg-[var(--paper)] border-[3px] border-[var(--ink)] rounded-md text-sm font-bold placeholder:opacity-40 placeholder:font-normal focus:outline-none focus:shadow-[3px_3px_0_var(--accent)] transition-shadow"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="manga-btn manga-btn-accent w-full"
            >
              {loading ? "登录中..." : "登录"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm opacity-60 font-bold">
            还没有账号？{" "}
            <Link href="/register" className="text-[var(--accent)] font-black hover:underline">
              注册
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
