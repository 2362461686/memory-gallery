"use client";
import { useTheme } from "./ThemeProvider";
import Fireflies from "./Fireflies";
import PageTransition from "./PageTransition";

export function BackgroundFX() {
  const { isDark } = useTheme();
  return (
    <div className={`transition-opacity duration-1000 ${isDark ? "opacity-100" : "opacity-0"}`}>
      <Fireflies />
    </div>
  );
}

export function AnimatedContent({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
