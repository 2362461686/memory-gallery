"use client";
import Link from "next/link";
import { IconSparkles } from "@/lib/icons";

/** 装订入口:进预览页确认,不再一键黑盒直接生成 */
export default function BindButton({ postCount }: { postCount: number }) {
  return (
    <Link href="/bind" className="manga-btn manga-btn-accent">
      <IconSparkles size={16} />
      装订成册({postCount} 条待收)
    </Link>
  );
}
