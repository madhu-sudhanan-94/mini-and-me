import React, { useRef, useState } from "react";

/*
  PrimaryButton — THE single primary call-to-action button for the whole app.
  Every prominent action ("Log in", "Add to cart", "Place order", "Save"…)
  should use this so the look AND the click animation live in ONE place.
  Change the colour / shape / press animation here → it updates everywhere.

  Props:
    variant : "gradient" (brand→accent, default) | "solid" (brand-600)
    size    : "md" | "lg" (default) | "xl"
    full    : stretch to full width (default true)
    ...also forwards onClick, disabled, type, className (margins etc.), aria-*, children
*/
const VARIANTS = {
  gradient: "bg-linear-to-r from-brand-600 to-accent-500 shadow-brand-500/25",
  solid: "bg-brand-600 hover:bg-brand-700 shadow-brand-500/25",
};
const SIZES = {
  md: "py-2.5 rounded-xl text-base",
  lg: "py-3 rounded-xl text-base",
  xl: "py-4 rounded-xl text-base",
};

export default function PrimaryButton({
  variant = "gradient",
  size = "lg",
  full = true,
  disabled = false,
  type = "button",
  onClick,
  className = "",
  children,
  ...rest
}) {
  const [ripples, setRipples] = useState([]);
  const idRef = useRef(0);

  const handleClick = (e) => {
    if (disabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const d = Math.max(rect.width, rect.height);
    const id = idRef.current++;
    setRipples((r) => [...r, { id, d, x: e.clientX - rect.left - d / 2, y: e.clientY - rect.top - d / 2 }]);
    onClick?.(e);
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={handleClick}
      className={`relative overflow-hidden inline-flex items-center justify-center font-semibold text-white shadow-lg transition-transform duration-150 active:scale-[0.97] disabled:opacity-60 disabled:pointer-events-none ${VARIANTS[variant]} ${SIZES[size]} ${full ? "w-full" : "px-6"} ${className}`}
      {...rest}
    >
      {ripples.map((r) => (
        <span
          key={r.id}
          onAnimationEnd={() => setRipples((rs) => rs.filter((x) => x.id !== r.id))}
          className="pb-ripple pointer-events-none absolute rounded-full bg-white/40"
          style={{ left: r.x, top: r.y, width: r.d, height: r.d }}
        />
      ))}
      <span className="relative inline-flex items-center justify-center gap-2">{children}</span>
    </button>
  );
}
