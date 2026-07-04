import React from "react";
import { shade } from "../lib/format.js";

/* Simple SVG garment illustration used as a fallback when there's no photo. */
export default function Garment({ shape, color, className = "", style = {} }) {
  const dark = shade(color, -0.17);
  const light = shade(color, 0.22);
  const s = {
    filter: "drop-shadow(0 8px 10px rgba(2,6,23,0.14))",
    ...style,
  };
  let body = null;

  if (shape === "dress") {
    body = (
      <>
        <path d="M40 20 L42 30 M60 20 L58 30" stroke={dark} strokeWidth="3.2" strokeLinecap="round" opacity="0.6" />
        <path d="M34 28 C42 40 58 40 66 28 L70 72 L88 112 Q50 123 12 112 L30 72 Z" fill={color} />
        <path d="M50 40 L50 72" stroke={light} strokeWidth="1.6" opacity="0.4" />
        <path d="M30 72 Q50 80 70 72" stroke={dark} strokeWidth="2" fill="none" opacity="0.45" />
        <path d="M12 112 Q50 123 88 112" stroke={dark} strokeWidth="2.4" fill="none" opacity="0.4" />
      </>
    );
  } else if (shape === "tee") {
    body = (
      <>
        <path d="M30 40 L14 54 L22 64 L30 53 Z" fill={color} />
        <path d="M70 40 L86 54 L78 64 L70 53 Z" fill={color} />
        <path d="M30 40 L70 40 L73 100 L27 100 Z" fill={color} />
        <path d="M40 40 C44 49 56 49 60 40" stroke={dark} strokeWidth="2.4" fill="none" opacity="0.55" />
        <path d="M50 49 L50 100" stroke={light} strokeWidth="1.4" opacity="0.35" />
      </>
    );
  } else if (shape === "shirt") {
    body = (
      <>
        <path d="M30 42 L12 66 L20 76 L30 62 Z" fill={color} />
        <path d="M70 42 L88 66 L80 76 L70 62 Z" fill={color} />
        <path d="M30 42 L70 42 L73 106 L27 106 Z" fill={color} />
        <path d="M44 42 L50 52 L40 48 Z" fill={dark} opacity="0.8" />
        <path d="M56 42 L50 52 L60 48 Z" fill={dark} opacity="0.8" />
        <path d="M50 52 L50 106" stroke={dark} strokeWidth="1.6" opacity="0.5" />
        <circle cx="50" cy="64" r="1.7" fill={dark} opacity="0.7" />
        <circle cx="50" cy="78" r="1.7" fill={dark} opacity="0.7" />
        <circle cx="50" cy="92" r="1.7" fill={dark} opacity="0.7" />
        <rect x="33" y="62" width="11" height="12" rx="1.5" fill={dark} opacity="0.18" />
      </>
    );
  } else if (shape === "tunic") {
    body = (
      <>
        <path d="M30 38 L14 58 L22 68 L30 55 Z" fill={color} />
        <path d="M70 38 L86 58 L78 68 L70 55 Z" fill={color} />
        <path d="M30 38 L70 38 L72 114 L28 114 Z" fill={color} />
        <path d="M44 38 C46 47 54 47 56 38" stroke={dark} strokeWidth="2.2" fill="none" opacity="0.55" />
        <path d="M50 44 L50 64" stroke={dark} strokeWidth="1.6" opacity="0.5" />
        <path d="M50 47 L46 56 M50 47 L54 56" stroke={dark} strokeWidth="1.2" opacity="0.4" />
        <path d="M30 100 L30 114 M70 100 L70 114" stroke={dark} strokeWidth="1.6" opacity="0.3" />
      </>
    );
  } else if (shape === "jacket") {
    body = (
      <>
        <path d="M30 42 L12 66 L20 76 L30 62 Z" fill={color} />
        <path d="M70 42 L88 66 L80 76 L70 62 Z" fill={color} />
        <path d="M30 42 L49 42 L47 106 L28 106 Z" fill={color} />
        <path d="M70 42 L51 42 L53 106 L72 106 Z" fill={color} />
        <path d="M40 42 L49 42 L44 56 Z" fill={dark} opacity="0.75" />
        <path d="M60 42 L51 42 L56 56 Z" fill={dark} opacity="0.75" />
        <path d="M50 44 L50 106" stroke={dark} strokeWidth="2" strokeDasharray="2 3" opacity="0.7" />
      </>
    );
  } else if (shape === "pants" || shape === "shorts") {
    const legBottom = shape === "shorts" ? 78 : 110;
    body = (
      <>
        <path d={`M28 32 L72 32 L72 44 L60 ${legBottom} L52 ${legBottom} L50 64 L48 ${legBottom} L40 ${legBottom} L28 44 Z`} fill={color} />
        <path d="M28 44 L72 44" stroke={dark} strokeWidth="2" opacity="0.5" />
        <rect x="28" y="30" width="44" height="4" rx="2" fill={dark} opacity="0.55" />
        <path d="M40 50 L40 60" stroke={light} strokeWidth="1.4" opacity="0.4" />
        <path d="M60 50 L60 60" stroke={light} strokeWidth="1.4" opacity="0.4" />
      </>
    );
  } else if (shape === "overall") {
    body = (
      <>
        <path d="M40 40 L34 24 M60 40 L66 24" stroke={color} strokeWidth="6" strokeLinecap="round" />
        <path d="M40 40 L60 40 L60 58 L40 58 Z" fill={color} />
        <path d="M30 58 L70 58 L68 98 L52 98 L50 74 L48 98 L32 98 Z" fill={color} />
        <rect x="30" y="56" width="40" height="4" rx="2" fill={dark} opacity="0.5" />
        <circle cx="45" cy="48" r="2" fill={dark} opacity="0.6" />
        <circle cx="55" cy="48" r="2" fill={dark} opacity="0.6" />
      </>
    );
  }

  return (
    <svg viewBox="0 0 100 120" className={className} style={s} role="img" aria-hidden="true">
      {body}
    </svg>
  );
}
