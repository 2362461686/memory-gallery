"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) { setError("两次输入的密码不一致"); return; }
    if (password.length < 6) { setError("密码长度至少 6 位"); return; }
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    if (!res.ok) { const d = await res.json(); setError(d.error || "注册失败"); setLoading(false); return; }
    router.push("/login?registered=1");
  }

  const inputCls = "w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-800 dark:text-slate-200 placeholder-slate-400 text-sm";

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-120px)] px-6">
      <div className="w-full max-w-md">
        <div className="glass-card p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-1">加入 Memory Gallery</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">开始你的数字策展之旅</p>
          </div>
          {error && <div className="mb-6 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm text-center">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">昵称</label><input type="text" value={name} onChange={e => setName(e.target.value)} required className={inputCls} placeholder="你的名字" /></div>
            <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">邮箱</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} required className={inputCls} placeholder="your@email.com" /></div>
            <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">密码</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className={inputCls} placeholder="至少 6 位" /></div>
            <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">确认密码</label><input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className={inputCls} placeholder="再次输入密码" /></div>
            <button type="submit" disabled={loading} className="w-full py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium transition-colors disabled:opacity-50 shadow-lg shadow-indigo-500/25">{loading ? "注册中..." : "注册"}</button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">已有账号？ <Link href="/login" className="text-indigo-500 dark:text-indigo-400 font-medium hover:underline">登录</Link></p>
        </div>
      </div>
    </div>
  );
}
