"use client";
import { useRouter } from "next/navigation";
import { IconLogout } from "@/lib/icons";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors"
      title="退出登录"
    >
      <IconLogout size={14} />
      退出
    </button>
  );
}
