"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconSparkles } from "@/lib/icons";

export default function CurateButton({ postCount }: { postCount: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCurate() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/exhibitions/curate", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/exhibition/${data.exhibition.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "策展失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleCurate}
        disabled={loading}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50"
      >
        <IconSparkles size={16} />
        {loading ? "AI 策展中..." : `AI 策展 (${postCount}条)`}
      </button>
      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
    </div>
  );
}
