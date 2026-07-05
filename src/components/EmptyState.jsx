import React from "react";

/*
  EmptyState — THE single "nothing here yet" placeholder for the whole app
  (empty cart, no favourites, no orders, no search results…).
  It renders a gently-floating icon badge with a pulsing halo + twinkling
  sparkles, and staggers the title/subtitle/CTA in. Change the look/animation
  HERE and every empty screen updates.

  Props:
    icon     : a lucide icon component (e.g. Heart)
    title    : bold headline
    subtitle : muted one-liner (optional)
    tone     : "brand" (default) | "rose" | "amber" — colours the badge
    className: spacing/position from the caller (e.g. "mt-20", "py-16")
    children : optional call-to-action (e.g. a <PrimaryButton>)
*/
const TONES = {
  brand: { halo: "bg-brand-300/40", chip: "bg-brand-50", icon: "text-brand-500", dot: "bg-brand-300" },
  rose: { halo: "bg-rose-300/40", chip: "bg-rose-50", icon: "text-rose-400", dot: "bg-rose-300" },
  amber: { halo: "bg-amber-300/50", chip: "bg-amber-50", icon: "text-amber-500", dot: "bg-amber-400" },
};

export default function EmptyState({ icon: Icon, title, subtitle, tone = "brand", className = "", children }) {
  const t = TONES[tone] || TONES.brand;
  return (
    <div className={`flex flex-col items-center justify-center text-center px-8 ${className}`}>
      <div className="es-float relative mb-5">
        {/* pulsing halos */}
        <span className={`es-halo absolute inset-0 rounded-full ${t.halo}`} />
        <span className={`es-halo absolute inset-0 rounded-full ${t.halo}`} style={{ animationDelay: "1.2s" }} />
        {/* twinkling sparkles */}
        <span className={`es-twinkle absolute -top-1 -right-1 w-2 h-2 rounded-full ${t.dot}`} />
        <span className={`es-twinkle absolute bottom-0.5 -left-2 w-1.5 h-1.5 rounded-full ${t.dot}`} style={{ animationDelay: ".7s" }} />
        <span className={`es-twinkle absolute -top-2 left-3 w-1 h-1 rounded-full ${t.dot}`} style={{ animationDelay: "1.1s" }} />
        {/* icon badge */}
        <div className={`relative w-20 h-20 rounded-full ${t.chip} flex items-center justify-center`}>
          {Icon && <Icon size={32} className={t.icon} />}
        </div>
      </div>
      <p className="es-rise font-semibold text-slate-800 text-xl" style={{ animationDelay: ".05s" }}>{title}</p>
      {subtitle && <p className="es-rise text-slate-400 text-sm mt-1" style={{ animationDelay: ".13s" }}>{subtitle}</p>}
      {children && <div className="es-rise mt-5" style={{ animationDelay: ".21s" }}>{children}</div>}
    </div>
  );
}
