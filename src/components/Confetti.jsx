import React, { useMemo } from "react";

const COLORS = ["#2563eb", "#0ea5e9", "#f59e0b", "#ec4899", "#10b981", "#f43f5e", "#a855f7", "#facc15"];

/*
  Confetti — a celebratory BLAST (party-popper). Each piece explodes radially
  outward from a central origin (the `burst` animation on the outer span) while
  gravity pulls it down (the `grav` animation on the inner span). The two combine
  into a natural arc: fly out fast, then fall + spin + fade. Pure CSS, no deps.
  Honours prefers-reduced-motion.
*/
export default function Confetti({ count = 110 }) {
  const pieces = useMemo(
    () => Array.from({ length: count }, (_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 240;            // explosion radius
      const bx = Math.cos(angle) * speed;
      const by = Math.sin(angle) * speed * 0.85 - 50;    // slight upward bias
      const drop = 240 + Math.random() * 360;            // gravity fall
      const rot = (Math.random() > 0.5 ? 1 : -1) * (240 + Math.random() * 720);
      const dur = 1.15 + Math.random() * 0.75;
      const size = 6 + Math.random() * 8;
      const strip = Math.random() > 0.45;
      return {
        i, bx, by, drop, rot, dur, size, strip,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        delay: Math.random() * 0.06,
      };
    }),
    [count]
  );

  return (
    <div className="pointer-events-none absolute inset-x-0 top-[24%] z-10" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.i}
          className="confetti-blast absolute left-1/2 top-0"
          style={{ "--bx": p.bx + "px", "--by": p.by + "px", animationDuration: p.dur + "s", animationDelay: p.delay + "s" }}
        >
          <span
            className="confetti-grav block"
            style={{
              width: p.strip ? p.size * 0.5 : p.size,
              height: p.strip ? p.size * 1.5 : p.size,
              background: p.color,
              borderRadius: p.strip ? "1px" : "9999px",
              "--drop": p.drop + "px",
              "--rot": p.rot + "deg",
              animationDuration: p.dur + "s",
              animationDelay: p.delay + "s",
            }}
          />
        </span>
      ))}
    </div>
  );
}
