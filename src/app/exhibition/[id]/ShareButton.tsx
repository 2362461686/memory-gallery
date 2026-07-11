"use client";

import { useState } from "react";
import { IconShare, IconCheck } from "@/lib/icons";

export default function ShareButton({ shareToken }: { shareToken: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(
      `${window.location.origin}/share/${shareToken}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-zinc-300 text-zinc-600 text-sm font-medium hover:bg-zinc-50 transition-colors"
    >
      {copied ? (
        <>
          <IconCheck size={16} className="text-green-500" />
          已复制
        </>
      ) : (
        <>
          <IconShare size={16} />
          分享展览
        </>
      )}
    </button>
  );
}
