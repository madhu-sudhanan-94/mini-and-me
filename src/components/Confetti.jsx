import React, { useMemo } from "react";

const COLORS = ["#2563eb", "#0ea5e9", "#f59e0b", "#ec4899", "#10b981", "#f43f5e", "#a855f7", "#fACC15"];

/*
  Confetti — a lightweight, dependency-free burst of falling confetti (pure CSS
  animation, one <span> per piece). Drop it inside a `relative overflow-hidden`
  container; it rains over that box. Honours prefers-reduced-motion.
*/
export default function Confetti({ count = 70 }) {
  const pieces = useMemo(
    () => Array.from({ length: count }, (_, i) => ({
      i,
      left: Math.random() * 100,
      delay: Math.random() * 0.9,
      duration: 2.4 + Math.random() * 2,
      size: 6 + Math.random() * 7,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      drift: (Math.random() - 0.5) * 160,
      rot: (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 540),
      round: Math.random() > 0.55,
    })),
    [count]
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-10" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.i}
          className="confetti-piece absolute"
          style={{
            left: p.left + "%",
            width: p.size,
            height: p.round ? p.size : p.size * 0.45,
            background: p.color,
            borderRadius: p.round ? "9999px" : "1px",
            animationDelay: p.delay + "s",
            animationDuration: p.duration + "s",
            "--drift": p.drift + "px",
            "--rot": p.rot + "deg",
          }}
        />
      ))}
    </div>
  );
}
