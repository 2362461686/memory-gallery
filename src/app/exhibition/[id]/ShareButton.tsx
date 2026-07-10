"use client";

export default function ShareButton({ shareToken }: { shareToken: string }) {
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(`${window.location.origin}/share/${shareToken}`);
      }}
      className="px-4 py-2.5 rounded-xl bg-white/60 backdrop-blur-sm border border-purple-200 text-purple-500 text-sm font-medium hover:bg-white/80 transition-colors"
    >
      复制分享链接
    </button>
  );
}
