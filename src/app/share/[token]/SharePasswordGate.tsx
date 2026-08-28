"use client";

import { useState } from "react";

export default function SharePasswordGate({ token, title }: { token: string; title: string }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/share/${token}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "打不开");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <form onSubmit={submit} className="glass-card p-8 w-full max-w-sm text-center">
        <span className="manga-tag manga-tag-accent rotate-[-3deg] inline-block mb-4">上锁的一卷</span>
        <h1 className="text-xl font-black mb-1">{title}</h1>
        <p className="text-sm opacity-60 font-bold mb-6">分享者给这本设了密码</p>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="输入密码"
          autoFocus
          className="w-full px-3 py-2.5 bg-[var(--paper)] border-[3px] border-[var(--ink)] rounded-md text-sm font-bold text-center placeholder:opacity-40 placeholder:font-normal focus:outline-none focus:shadow-[3px_3px_0_var(--accent)] transition-shadow"
        />
        {error && <p className="text-[var(--accent)] text-xs mt-3 font-bold">{error}</p>}

        <button type="submit" disabled={loading || !password} className="manga-btn manga-btn-accent w-full mt-5">
          {loading ? "开锁中…" : "打开这一卷"}
        </button>
      </form>
    </div>
  );
}
