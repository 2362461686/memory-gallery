"use client";

import { useState, useEffect } from "react";
import { IconShare, IconCopy, IconCheck, IconX } from "@/lib/icons";

interface ShareState {
  isPublic: boolean;
  shareToken: string;
  expiresAt: string | null;
  hasPassword: boolean;
  allowDownload: boolean;
}

export default function ShareButton({
  shareToken,
  exhibitionId,
}: {
  shareToken: string;
  exhibitionId: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<ShareState | null>(null);
  const [copied, setCopied] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!open || state) return;
    fetch(`/api/exhibitions/${exhibitionId}/share`)
      .then((r) => r.json())
      .then((d) => !d.error && setState(d))
      .catch(() => {});
  }, [open, state, exhibitionId]);

  const token = state?.shareToken ?? shareToken;
  const url = typeof window !== "undefined" ? `${window.location.origin}/share/${token}` : "";

  async function patch(body: Record<string, unknown>, note: string) {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch(`/api/exhibitions/${exhibitionId}/share`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setState(d);
      setMsg(note);
      if ("password" in body) setPassword("");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "改不动");
    } finally {
      setBusy(false);
    }
  }

  function copy() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="manga-btn manga-btn-ghost">
        <IconShare size={16} />分享
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-[var(--ink)]/40 flex items-end sm:items-center justify-center p-0 sm:p-6"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-[var(--paper)] border-[3px] border-[var(--ink)] rounded-t-xl sm:rounded-xl w-full max-w-md max-h-[88vh] overflow-y-auto shadow-[6px_6px_0_var(--ink)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b-[3px] border-[var(--ink)] sticky top-0 bg-[var(--paper)]">
              <h2 className="font-black">分享这一卷</h2>
              <button
                onClick={() => setOpen(false)}
                aria-label="关闭"
                className="w-8 h-8 border-2 border-[var(--ink)] rounded flex items-center justify-center hover:bg-[var(--accent)] hover:text-[#fffdf7] transition-colors"
              >
                <IconX size={14} />
              </button>
            </div>

            <div className="p-4 flex flex-col gap-4">
              {msg && <p className="text-xs font-bold p-3 glass rounded">{msg}</p>}

              {/* 总开关 —— 关掉后旧链接立刻打不开 */}
              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <span>
                  <span className="font-black text-sm">开启分享链接</span>
                  <span className="block text-xs opacity-55 font-bold mt-0.5">
                    关掉后,已经发出去的链接立刻失效
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={state?.isPublic ?? false}
                  disabled={busy || !state}
                  onChange={(e) =>
                    patch({ isPublic: e.target.checked }, e.target.checked ? "已开启" : "已撤销 —— 旧链接现在打不开了")
                  }
                  className="w-6 h-6 shrink-0 accent-[var(--accent)] cursor-pointer"
                />
              </label>

              {/* 链接 */}
              <div className={state?.isPublic ? "" : "opacity-40 pointer-events-none"}>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={url}
                    className="flex-1 min-w-0 px-3 py-2 bg-[var(--paper)] border-[3px] border-[var(--ink)] rounded-md text-xs font-bold"
                  />
                  <button onClick={copy} className="manga-btn !px-3 shrink-0">
                    {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                  </button>
                </div>
                <button
                  onClick={() => patch({ rotate: true }, "换好了 —— 旧链接已作废")}
                  disabled={busy}
                  className="mt-2 text-xs font-bold opacity-60 hover:opacity-100 hover:text-[var(--accent)] underline transition-all"
                >
                  换一个新链接(旧的立刻作废)
                </button>
              </div>

              <div className={`flex flex-col gap-4 ${state?.isPublic ? "" : "opacity-40 pointer-events-none"}`}>
                {/* 有效期 */}
                <div>
                  <p className="font-black text-sm mb-2">有效期</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { d: 1, label: "1 天" },
                      { d: 7, label: "7 天" },
                      { d: 30, label: "30 天" },
                      { d: 0, label: "永久" },
                    ].map(({ d, label }) => (
                      <button
                        key={d}
                        onClick={() => patch({ expireDays: d }, d ? `${label}后自动失效` : "已设为永久有效")}
                        disabled={busy}
                        className="px-3 py-1.5 text-xs font-black border-2 border-[var(--ink)] rounded bg-[var(--paper)] hover:bg-[var(--sun)] transition-colors"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  {state?.expiresAt && (
                    <p className="text-xs opacity-55 font-bold mt-2">
                      到期:{new Date(state.expiresAt).toLocaleString("zh-CN")}
                    </p>
                  )}
                </div>

                {/* 密码 */}
                <div>
                  <p className="font-black text-sm mb-1">访问密码</p>
                  <p className="text-xs opacity-55 font-bold mb-2">
                    {state?.hasPassword ? "已设密码,收到链接的人要输入才能看" : "没设密码,拿到链接就能看"}
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={state?.hasPassword ? "输入新密码以修改" : "设一个密码"}
                      className="flex-1 min-w-0 px-3 py-2 bg-[var(--paper)] border-[3px] border-[var(--ink)] rounded-md text-sm font-bold placeholder:opacity-40 placeholder:font-normal focus:outline-none focus:shadow-[3px_3px_0_var(--accent)] transition-shadow"
                    />
                    <button
                      onClick={() => patch({ password }, "密码已更新")}
                      disabled={busy || !password.trim()}
                      className="manga-btn !px-3 shrink-0 !text-xs"
                    >
                      设置
                    </button>
                  </div>
                  {state?.hasPassword && (
                    <button
                      onClick={() => patch({ password: "" }, "密码已取消")}
                      disabled={busy}
                      className="mt-2 text-xs font-bold opacity-60 hover:opacity-100 hover:text-[var(--accent)] underline transition-all"
                    >
                      取消密码
                    </button>
                  )}
                </div>

                {/* 下载 */}
                <label className="flex items-center justify-between gap-3 cursor-pointer">
                  <span>
                    <span className="font-black text-sm">允许对方下载原图</span>
                    <span className="block text-xs opacity-55 font-bold mt-0.5">
                      关掉后只能在页面里看
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={state?.allowDownload ?? false}
                    disabled={busy || !state}
                    onChange={(e) => patch({ allowDownload: e.target.checked }, "已更新")}
                    className="w-6 h-6 shrink-0 accent-[var(--accent)] cursor-pointer"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
