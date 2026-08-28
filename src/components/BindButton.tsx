"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconSparkles } from "@/lib/icons";

export default function BindButton({ postCount }: { postCount: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function handleBind() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/exhibitions/curate", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.fallbackReason) {
        // 降级不该是静默的 —— 告诉用户这本是自动起名的,以及为什么
        setNotice(`${data.fallbackReason},这本按日期自动起了名。进去可以改。`);
        setTimeout(() => {
          router.push(`/exhibition/${data.exhibition.id}`);
          router.refresh();
        }, 2600);
        return;
      }
      router.push(`/exhibition/${data.exhibition.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "装订失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button onClick={handleBind} disabled={loading} className="manga-btn manga-btn-accent">
        <IconSparkles size={16} />
        {loading ? "装订中…" : `装订成册(${postCount} 条待收)`}
      </button>
      {error && <p className="text-[var(--accent)] text-xs mt-2 font-bold">{error}</p>}
      {notice && <p className="text-xs mt-2 font-bold opacity-70 max-w-[16rem]">{notice}</p>}
    </div>
  );
}
