import React from "react";
import { ChevronLeft } from "lucide-react";
import { useStore } from "../store.jsx";

/*
  ScreenHeader — the shared back-button + title header used across screens.
  Props:
    title     — heading text (or node)
    back      — goBack() target when the back button is tapped (default "home")
    onBack    — custom back handler (overrides `back`)
    right     — optional node pinned to the right (actions)
    padded    — include the px-5 pt-[18px] wrapper padding (default true).
                Set false when the header sits inside an already-padded container.
    className — extra classes on the wrapper (e.g. "lg:px-6")
*/
export default function ScreenHeader({ title, back = "home", onBack, right = null, padded = true, className = "" }) {
  const { goBack } = useStore();
  const handleBack = onBack || (() => goBack(back));
  return (
    <div className={`flex items-center gap-2 ${padded ? "px-5 pt-[18px] pb-1" : ""} ${className}`}>
      <button onClick={handleBack} aria-label="Back" className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center active:scale-95 transition shrink-0"><ChevronLeft size={20} className="text-slate-700" /></button>
      <h2 className="flex-1 min-w-0 text-center text-lg font-semibold text-slate-900 truncate">{title}</h2>
      <div className="w-9 shrink-0 flex justify-end">{right}</div>
    </div>
  );
}
