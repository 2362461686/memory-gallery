"use client";
import { useEffect, useState } from "react";

interface Star {
  id: number; top: string; left: string; size: number; opacity: number;
  twinkleDuration: number; twinkleDelay: number; color: string;
}

const starColors = [
  "rgba(255,200,255,0.9)", // pink
  "rgba(200,220,255,0.9)", // blue
  "rgba(255,220,200,0.8)", // gold
  "rgba(200,255,255,0.8)", // cyan
  "rgba(255,255,200,0.7)", // yellow
];

export default function StarField() {
  const [stars, setStars] = useState<Star[]>([]);

  useEffect(() => {
    const generated: Star[] = Array.from({ length: 60 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: 1.5 + Math.random() * 3,
      opacity: 0.3 + Math.random() * 0.7,
      twinkleDuration: 2 + Math.random() * 4,
      twinkleDelay: Math.random() * -5,
      color: starColors[Math.floor(Math.random() * starColors.length)],
    }));
    setStars(generated);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[5] overflow-hidden">
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.3);
            box-shadow: 0 0 6px 2px currentColor, 0 0 12px 4px currentColor; }
        }
        @keyframes starFloat {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(2px, -4px) rotate(90deg); }
          50% { transform: translate(-2px, -2px) rotate(180deg); }
          75% { transform: translate(-3px, -5px) rotate(270deg); }
        }
      `}</style>
      {stars.map(s => (
        <div
          key={s.id}
          className="absolute"
          style={{
            top: s.top, left: s.left,
            width: `${s.size}px`, height: `${s.size}px`,
            borderRadius: "50%",
            backgroundColor: s.color,
            opacity: s.opacity,
            animation: `twinkle ${s.twinkleDuration}s ease-in-out infinite, starFloat ${s.twinkleDuration * 3}s ease-in-out infinite`,
            animationDelay: `${s.twinkleDelay}s, ${s.twinkleDelay * 0.5}s`,
            boxShadow: `0 0 3px 1px ${s.color}`,
          }}
        />
      ))}
    </div>
  );
}
