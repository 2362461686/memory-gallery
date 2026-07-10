"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "注册失败");
      setLoading(false);
      return;
    }

    router.push("/login?registered=1");
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-120px)] px-6">
      <div className="w-full max-w-sm">
        <div className="bg-white/70 backdrop-blur-md rounded-3xl p-8 shadow-lg shadow-purple-100/50 border border-white/80">
          <h1 className="text-2xl font-bold text-center mb-2 bg-gradient-to-r from-pink-500 to-indigo-500 bg-clip-text text-transparent">
            加入 Memory Gallery
          </h1>
          <p className="text-sm text-zinc-400 text-center mb-8">
            开始你的数字策展之旅
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-600 mb-1.5">
                昵称
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-purple-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent text-zinc-700 placeholder-zinc-300"
                placeholder="你的名字"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-600 mb-1.5">
                邮箱
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-purple-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent text-zinc-700 placeholder-zinc-300"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-600 mb-1.5">
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2.5 rounded-xl border border-purple-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent text-zinc-700 placeholder-zinc-300"
                placeholder="至少6位"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-400 to-purple-500 text-white font-medium hover:shadow-lg hover:shadow-purple-200/50 transition-all disabled:opacity-50"
            >
              {loading ? "注册中..." : "注册"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-400">
            已有账号？{" "}
            <Link href="/login" className="text-purple-500 hover:underline">
              登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
