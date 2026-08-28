"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconSparkles } from "@/lib/icons";

export default function BindButton({ postCount }: { postCount: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleBind() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/exhibitions/curate", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
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
        {loading ? "装订中…" : `装订成册(${postCount} 张待收）`}
      </button>
      {error && <p className="text-[var(--accent)] text-xs mt-2 font-bold">{error}</p>}
    </div>
  );
}
