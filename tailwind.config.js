import { BRAND } from "./src/brand.config.js";

/**
 * Tailwind v4 loads this file via `@config "../tailwind.config.js"` in
 * src/index.css. Colours and font come from the single brand source
 * (src/brand.config.js), so rebranding stays a one-file edit.
 * @type {import('tailwindcss').Config}
 */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      // The whole app uses `lg:` as the mobile-frame → desktop switch. Lower it
      // from Tailwind's default 1024px so laptops with OS display scaling (which
      // report a smaller CSS viewport, e.g. a 1280px screen at 150% ≈ 853px) still
      // get the full desktop layout instead of the phone-frame mobile view.
      screens: {
        lg: "900px",
      },
      colors: {
        brand: BRAND.colors.brand,
        accent: BRAND.colors.accent,
      },
      fontFamily: {
        sans: [BRAND.font],
      },
      // Single source for the standard card shadow — soft, even on all sides.
      // Use `shadow-card` on card containers (product, order, address, cart,
      // favourites…) and `hover:shadow-card-hover` for the lift on tappable cards.
      boxShadow: {
        card: "0 2px 12px rgba(2,6,23,0.09)",
        "card-hover": "0 8px 24px rgba(2,6,23,0.13)",
      },
    },
  },
  plugins: [],
};
