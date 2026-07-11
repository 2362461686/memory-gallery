"use client";
import { useTheme } from "./ThemeProvider";
import { SunMedium, Moon } from "lucide-react";

export function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg glass hover:scale-110 transition-all duration-300"
      aria-label="切换主题"
    >
      {isDark ? (
        <SunMedium size={16} className="text-amber-400" />
      ) : (
        <Moon size={16} className="text-indigo-500" />
      )}
    </button>
  );
}
