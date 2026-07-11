# Mini & Me — Session Notes

A log of the UI polish and features shipped in this working session, grouped by area. Each entry notes the file(s) touched so it's easy to trace.

---

## Product cards & shadows

- **Even all-around card shadow** — replaced `shadow-xs`/`shadow-md` with a soft, evenly-cast shadow so cards have depth on the top edge too: `shadow-[0_2px_12px_rgba(2,6,23,0.09)] hover:shadow-[0_8px_24px_rgba(2,6,23,0.13)]`. _(`src/components/ProductCard.jsx`)_
- **Shadow-clipping fix in scroll rows** — `overflow-x-auto` clips vertical overflow, cutting off the card's top shadow. Added vertical breathing room (`py-3`) to the Home Trending/New-in rows and `-mx-6 px-6 py-3` to the ProductModal "Similar" row. _(`src/screens/Home.jsx`, `src/screens/ProductModal.jsx`)_

## Quantity stepper

- **Reusable `QtyStepper` component** — outlined-pill − / value / + control with min/max disabling. Replaces the older grey-track versions in the product page and quick-add sheet. _(`src/components/QtyStepper.jsx`, used in `ProductModal.jsx` + `QuickAddSheet.jsx`)_

## Quick-add sheet

- Removed the **"% OFF" badge** from the product image.
- Added a **full-screen image zoom viewer** (tap thumbnail → swipeable lightbox with dots + close).
- Added **quantity** via `QtyStepper`; qty flows into `addToCart` / `buyNow`.
- Redesigned the summary block (larger image, ring, "You save" line).

## Product modal (full product page)

- Added the **quantity stepper** and passed qty to add-to-cart / buy-now.
- Restored the **lightbox close button** (top-right X over the zoomed image).

## Free-size handling

- Products whose only size is **"Free"** now hide the size selector / size guide **everywhere** (product page + quick-add).
- Product details instead shows a **"Free size"** row.
- Driven by an `isFreeSize` guard. _(`ProductModal.jsx`, `QuickAddSheet.jsx`)_

## Home screen

- **Free-shipping banner** — gradient pill under the header: _"Free shipping on all orders above ₹1,000 🎉"_, wired to `SHOP.freeDeliveryThreshold`. _(`src/screens/Home.jsx`, `src/shop.config.js`)_
- Trending row shows **only** trending products; Trending / New-in each have a **"See all"** → collection listing.

## Gift wrapping

- **Opt-in gift wrapping at checkout** — toggle card (Gift icon + Check tick) that adds a flat `SHOP.giftWrapFee` (₹30) to the bill; shows as its own summary line. _(`src/screens/Checkout.jsx`, `src/store.jsx` → `computeBill(lines, wrap)`, `src/shop.config.js`)_

## Checkout — delivery address

- Redesigned the **empty-address state** to match the gift-wrapping card style: solid white card, slate border, `rounded-xl` slate icon tile, muted subtitle.
- The add affordance is a **white circular "+" button** (white bg, slate ring, soft shadow, brand-blue icon). _(`src/screens/Checkout.jsx`)_

## Admin screen

- **Top spacing** — header no longer hugs the top (`px-5 pt-5 pb-4`).
- **Colours editor redesign** — selected swatches with a × badge, tap-to-add palette from `COLOR_FAMILIES`, plus a native custom colour picker.
- **"Show in New in" toggle** — sits next to "Show in Trending"; toggles the product `tag` between `"new"` and empty.
- **Image editor redesign** — one row per image (preview + editable URL + delete), a "Paste image URL" input with an **Add** button, and an **Upload** button. Fixed the "Add URL not working" bug (empty-row round-trip collapsed to `[]`).
- **Per-size stock** — a stock box per offered size; overrides total stock when set.
- **Custom sizes** — "Add custom size" input lets the admin add labels beyond the presets (e.g. `10Y`, `XXXL`); each custom size gets its own stock box and a × to remove it. Wired through `blankForm` / `saveProduct` / `editProduct`. _(`src/screens/Admin.jsx`, `src/store.jsx`)_

## Sizes data

- Expanded **kids sizes** to include baby ranges: `1-3M, 3-6M, 6-9M, 9-12M, 1Y … 8Y`. _(`src/data/products.js`)_

## Database (Supabase)

- **Single paste-able schema** — `supabase/schema.sql` is self-contained and idempotent (run once in the SQL editor).
- Added `size_stock jsonb` to `products` (optional per-size stock, overrides `stock` per size) and `note text` to `orders`, each with an `add column if not exists` upgrade line for existing databases.

---

## Key conventions used

- **Tailwind CSS v4** — `bg-linear-to-*` (not `bg-gradient-to-*`), arbitrary values for shadows/rings, `outline-hidden`.
- **Store pattern** — `computeBill(lines, wrap)`, per-size stock aggregated by `id + size`, `checkoutItems` / `checkoutBill` for buy-now vs cart.
- **Mobile-first** — every change works on phone and `lg:` desktop.
- **Single-source config** — commerce knobs live in `src/shop.config.js`; branding in one config for white-labelling.

_Build verified clean via `npx vite build` after each change._
