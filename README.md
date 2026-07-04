# Mini & Me

A mobile-first clothing store (Kids · Men · Women) for India, built with React + Vite + Tailwind CSS.
Products load from a Supabase database and orders are saved back to it.

## Run it on your computer
You need Node.js (https://nodejs.org) installed first.

```bash
npm install      # install dependencies (first time only)
npm run dev      # start local dev server → open the URL it prints
```

## Build for production
```bash
npm run build    # output goes to the dist/ folder
```

## Deploy
Push this folder to GitHub, then import the repo on Vercel or Netlify.
- Build command: `npm run build`
- Output directory: `dist`

## Notes
- The Supabase URL and public key live in `src/App.jsx`. The public key is safe to
  expose in the browser; access is protected by database security rules.
- To change the product catalog, edit the `products` table in Supabase.
