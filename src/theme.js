/* ============================ Panel gradients (derived from the brand palette) ============================ */
import { BRAND } from "./brand.config.js";

const DOT =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='22' height='22'%3E%3Ccircle cx='2' cy='2' r='1.4' fill='%23ffffff' fill-opacity='0.16'/%3E%3C/svg%3E\")";
// Layer the dot pattern OVER a CSS gradient in one background-image.
const C = BRAND.colors;
export const panelBlue = { backgroundImage: `${DOT}, linear-gradient(135deg, ${C.brand[600]}, ${C.accent[500]})` };
export const panelBlueDeep = { backgroundImage: `${DOT}, linear-gradient(135deg, ${C.brand[700]}, ${C.brand[500]})` };
export const heroBlue = { backgroundImage: `${DOT}, linear-gradient(135deg, ${C.brand[600]}, ${C.accent[400]})` };
