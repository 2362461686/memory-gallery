"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-400 to-purple-500 text-white font-medium text-sm shadow-md shadow-purple-200/50 hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50"
      >
        {loading ? "AI 策展中..." : `🤖 AI 策展 (${postCount}条)`}
      </button>
      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
    </div>
  );
}
