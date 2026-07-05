/* ============================ Panel gradients (derived from the brand palette) ============================ */
import { BRAND } from "./brand.config.js";

// Clean diagonal brand gradients (no dot pattern) used behind headers/heroes.
const C = BRAND.colors;
export const panelBlue = { backgroundImage: `linear-gradient(135deg, ${C.brand[700]} 0%, ${C.brand[600]} 50%, ${C.accent[500]} 100%)` };
export const panelBlueDeep = { backgroundImage: `linear-gradient(135deg, ${C.brand[800]}, ${C.brand[600]})` };
export const heroBlue = { backgroundImage: `linear-gradient(135deg, ${C.brand[600]}, ${C.accent[400]})` };
