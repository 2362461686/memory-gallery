/** SVG 图标组件 - 替代 emoji，风格统一 */
import React from "react";

const baseProps = {
  className: "",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
};

interface IconProps {
  className?: string;
  size?: number;
}

function icon(size: number, className = "", children: React.ReactNode) {
  return (
    <svg
      width={size}
      height={size}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      {children}
    </svg>
  );
}

// 画廊 / 展览
export function IconGallery({ className = "", size = 24 }: IconProps) {
  return icon(size, className, [
    <rect key="r" x="3" y="3" width="7" height="7" rx="1" />,
    <rect key="r2" x="14" y="3" width="7" height="7" rx="1" />,
    <rect key="r3" x="3" y="14" width="7" height="7" rx="1" />,
    <rect key="r4" x="14" y="14" width="7" height="7" rx="1" />,
  ]);
}

// AI / 机器学习
export function IconSparkles({ className = "", size = 24 }: IconProps) {
  return icon(size, className, [
    <path key="p" d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" />,
    <path key="p2" d="M4 19l.5 1.5L6 21l-1.5.5L4 23l-.5-1.5L2 21l1.5-.5z" />,
    <path key="p3" d="M19 15l.5 1.5L21 17l-1.5.5L19 19l-.5-1.5L17 17l1.5-.5z" />,
  ]);
}

// 上传 / 导入
export function IconUpload({ className = "", size = 24 }: IconProps) {
  return icon(size, className, [
    <path key="p" d="M12 16V4" />,
    <path key="p2" d="M8 8l4-4 4 4" />,
    <rect key="r" x="3" y="14" width="18" height="6" rx="1" />,
  ]);
}

// 照片 / 图片
export function IconImage({ className = "", size = 24 }: IconProps) {
  return icon(size, className, [
    <rect key="r" x="3" y="3" width="18" height="18" rx="2" />,
    <circle key="c" cx="8.5" cy="8.5" r="1.5" />,
    <path key="p" d="M21 15l-5-5L5 21" />,
  ]);
}

// 分享
export function IconShare({ className = "", size = 24 }: IconProps) {
  return icon(size, className, [
    <circle key="c" cx="18" cy="5" r="3" />,
    <circle key="c2" cx="6" cy="12" r="3" />,
    <circle key="c3" cx="18" cy="19" r="3" />,
    <path key="p" d="M8.59 13.51l6.83 3.98" />,
    <path key="p2" d="M15.41 6.51l-6.82 3.98" />,
  ]);
}

// 左箭头
export function IconArrowLeft({ className = "", size = 24 }: IconProps) {
  return icon(size, className, [
    <path key="p" d="M19 12H5" />,
    <path key="p2" d="M12 19l-7-7 7-7" />,
  ]);
}

// 关闭
export function IconX({ className = "", size = 24 }: IconProps) {
  return icon(size, className, [
    <path key="p" d="M18 6L6 18" />,
    <path key="p2" d="M6 6l12 12" />,
  ]);
}

// 用户
export function IconUser({ className = "", size = 24 }: IconProps) {
  return icon(size, className, [
    <circle key="c" cx="12" cy="8" r="4" />,
    <path key="p" d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />,
  ]);
}

// 退出
export function IconLogout({ className = "", size = 24 }: IconProps) {
  return icon(size, className, [
    <path key="p" d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />,
    <path key="p2" d="M16 17l5-5-5-5" />,
    <path key="p3" d="M21 12H9" />,
  ]);
}

// 复制
export function IconCopy({ className = "", size = 24 }: IconProps) {
  return icon(size, className, [
    <rect key="r" x="9" y="9" width="13" height="13" rx="2" />,
    <path key="p" d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />,
  ]);
}

// 对勾
export function IconCheck({ className = "", size = 24 }: IconProps) {
  return icon(size, className, [
    <path key="p" d="M5 13l4 4L19 7" />,
  ]);
}

// 仪表盘 / 布局
export function IconLayout({ className = "", size = 24 }: IconProps) {
  return icon(size, className, [
    <rect key="r" x="3" y="3" width="7" height="18" rx="1" />,
    <rect key="r2" x="14" y="3" width="7" height="10" rx="1" />,
    <rect key="r3" x="14" y="17" width="7" height="4" rx="1" />,
  ]);
}

// 加号
export function IconPlus({ className = "", size = 24 }: IconProps) {
  return icon(size, className, [
    <path key="p" d="M12 5v14" />,
    <path key="p2" d="M5 12h14" />,
  ]);
}

// QQ 图标（企鹅）
export function IconMessageCircle({ className = "", size = 24 }: IconProps) {
  return icon(size, className, [
    <path key="p" d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />,
  ]);
}
