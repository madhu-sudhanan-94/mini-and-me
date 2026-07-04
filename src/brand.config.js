import { ShoppingCart } from "lucide-react";

/*
  ============================================================
  BRAND CONFIG — the single source of truth for how the store
  looks and is named. To re-skin the whole app for a different
  store, edit ONLY this file:

    • name / tagline  → text shown in the header, login, loader
    • logo            → any icon from lucide-react (e.g. Shirt,
                        Store, Crown, Heart) or your own component
    • font            → the font family used everywhere
    • colors.brand    → PRIMARY colour ramp (buttons, links, headers)
    • colors.accent   → SECONDARY colour ramp (gradients, small pops)

  For colours, the main brand colour is `brand.600` and the main
  accent is `accent.500`. The other shades (50…900, light → dark)
  keep the rest of the UI cohesive — pick a full ramp when you
  rebrand (tip: copy a Tailwind colour scale you like).
  ============================================================
*/
export const BRAND = {
  name: "Mini & Me",
  tagline: "Kids · Men · Women — fashion delivered across India.",

  // Logo mark — swap ShoppingCart for any lucide icon, or a custom component
  logo: ShoppingCart,

  // Font family used across the app (wired into Tailwind's `font-sans`)
  font: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",

  colors: {
    // PRIMARY ramp — main brand colour is `600`
    brand: {
      50: "#eff6ff", 100: "#dbeafe", 200: "#bfdbfe", 300: "#93c5fd", 400: "#60a5fa",
      500: "#3b82f6", 600: "#2563eb", 700: "#1d4ed8", 800: "#1e40af", 900: "#1e3a8a",
    },
    // SECONDARY / accent ramp — main accent is `500`
    accent: {
      50: "#f0f9ff", 100: "#e0f2fe", 200: "#bae6fd", 300: "#7dd3fc", 400: "#38bdf8",
      500: "#0ea5e9", 600: "#0284c7", 700: "#0369a1", 800: "#075985", 900: "#0c4a6e",
    },
  },
};
