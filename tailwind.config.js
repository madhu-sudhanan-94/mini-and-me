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
      colors: {
        brand: BRAND.colors.brand,
        accent: BRAND.colors.accent,
      },
      fontFamily: {
        sans: [BRAND.font],
      },
    },
  },
  plugins: [],
};
