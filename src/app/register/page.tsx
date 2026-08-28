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

  const inputCls = "w-full px-4 py-2.5 bg-[var(--paper)] border-[3px] border-[var(--ink)] rounded-md text-sm font-bold placeholder:opacity-40 placeholder:font-normal focus:outline-none focus:shadow-[3px_3px_0_var(--accent)] transition-shadow";

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-120px)] px-6">
      <div className="w-full max-w-md">
        <div className="glass-card p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black mb-1">开始连载</h1>
            <p className="text-sm opacity-60 font-bold">把这些天的照片,画成一本回忆集</p>
          </div>
          {error && <div className="mb-6 p-3 border-[3px] border-[var(--accent)] rounded-md text-sm font-bold text-center">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="block text-sm font-black mb-1.5">昵称</label><input type="text" value={name} onChange={e => setName(e.target.value)} required className={inputCls} placeholder="你的名字" /></div>
            <div><label className="block text-sm font-black mb-1.5">邮箱</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} required className={inputCls} placeholder="your@email.com" /></div>
            <div><label className="block text-sm font-black mb-1.5">密码</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className={inputCls} placeholder="至少 6 位" /></div>
            <div><label className="block text-sm font-black mb-1.5">确认密码</label><input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className={inputCls} placeholder="再次输入密码" /></div>
            <button type="submit" disabled={loading} className="manga-btn manga-btn-accent w-full">{loading ? "注册中..." : "注册"}</button>
          </form>
          <p className="mt-6 text-center text-sm opacity-60 font-bold">已有账号？ <Link href="/login" className="text-[var(--accent)] font-black hover:underline">登录</Link></p>
        </div>
      </div>
    </div>
  );
}
