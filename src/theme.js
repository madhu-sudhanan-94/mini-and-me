/* ============================ Panel gradients (derived from the brand palette) ============================ */
import { BRAND } from "./brand.config.js";

// Clean diagonal brand gradients (no dot pattern) used behind headers/heroes.
const C = BRAND.colors;
export const panelBlue = { backgroundImage: `linear-gradient(135deg, ${C.brand[700]} 0%, ${C.brand[600]} 50%, ${C.accent[500]} 100%)` };
export const panelBlueDeep = { backgroundImage: `linear-gradient(135deg, ${C.brand[800]}, ${C.brand[600]})` };
export const heroBlue = { backgroundImage: `linear-gradient(135deg, ${C.brand[600]}, ${C.accent[400]})` };

// #rrggbb -> rgba(), so glows below stay derived from the brand palette.
const rgba = (hex, a) => {
  const h = hex.replace("#", "");
  return `rgba(${parseInt(h.slice(0, 2), 16)}, ${parseInt(h.slice(2, 4), 16)}, ${parseInt(h.slice(4, 6), 16)}, ${a})`;
};

// Soft ambient "aura" wash for the profile / account section (mobile only).
// A brand bloom from top-centre + faint accent (upper-right) & brand-light (upper-left)
// glows, resolving to pure white by mid-screen so white cards stay clearly elevated.
export const profileWash = [
  `radial-gradient(120% 60% at 50% -10%, ${rgba(C.brand[500], 0.1)} 0%, ${rgba(C.brand[500], 0.045)} 32%, ${rgba(C.brand[500], 0)} 60%)`,
  `radial-gradient(90% 45% at 84% 2%, ${rgba(C.accent[500], 0.08)} 0%, ${rgba(C.accent[500], 0)} 52%)`,
  `radial-gradient(80% 42% at 10% 8%, ${rgba(C.brand[400], 0.05)} 0%, ${rgba(C.brand[400], 0)} 55%)`,
  `linear-gradient(180deg, #f8fafc 0%, #ffffff 48%, #ffffff 100%)`,
].join(", ");
