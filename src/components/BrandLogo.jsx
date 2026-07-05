import React, { useState } from "react";
import { BRAND } from "../brand.config.js";
import { panelBlue } from "../theme.js";
import { useStore } from "../store.jsx";

const Logo = BRAND.logo;

/*
  Clickable brand wordmark shown in the top-left of the header.
  Tapping it always returns to Home.
  Uses the image from brand.config (BRAND.logoImage); if that image is
  missing/fails to load, it falls back to the icon + name so the header
  never breaks. `mix-blend-multiply` hides a white PNG background on the
  light header.
*/
export default function BrandLogo({ imgClass = "h-7 lg:h-8", className = "" }) {
  const { setScreen } = useStore();
  const [failed, setFailed] = useState(false);
  const showImg = BRAND.logoImage && !failed;

  return (
    <button
      onClick={() => setScreen("home")}
      aria-label={`${BRAND.name} — Home`}
      className={`flex items-center gap-2 shrink-0 active:scale-95 transition-transform ${className}`}
    >
      {showImg ? (
        <img
          src={BRAND.logoImage}
          alt={BRAND.name}
          onError={() => setFailed(true)}
          className={`${imgClass} w-auto object-contain mix-blend-multiply`}
        />
      ) : (
        <>
          {/* <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={panelBlue}>
            <Logo size={18} className="text-white" />
          </span> */}
          <span className="font-bold text-xl text-slate-900">{BRAND.name}</span>
        </>
      )}
    </button>
  );
}
