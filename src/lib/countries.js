/* ============================ Countries (dial codes + flags) ============================ */
// Curated list, India first. Phone numbers are stored as `${dial}${digits}` (e.g. +918971583502).

export const COUNTRIES = [
  { code: "IN", name: "India", dial: "+91", flag: "🇮🇳" },
  { code: "US", name: "United States", dial: "+1", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", dial: "+44", flag: "🇬🇧" },
  { code: "AE", name: "United Arab Emirates", dial: "+971", flag: "🇦🇪" },
  { code: "SG", name: "Singapore", dial: "+65", flag: "🇸🇬" },
  { code: "SA", name: "Saudi Arabia", dial: "+966", flag: "🇸🇦" },
  { code: "MY", name: "Malaysia", dial: "+60", flag: "🇲🇾" },
  { code: "AU", name: "Australia", dial: "+61", flag: "🇦🇺" },
  { code: "CA", name: "Canada", dial: "+1", flag: "🇨🇦" },
  { code: "NP", name: "Nepal", dial: "+977", flag: "🇳🇵" },
  { code: "LK", name: "Sri Lanka", dial: "+94", flag: "🇱🇰" },
  { code: "BD", name: "Bangladesh", dial: "+880", flag: "🇧🇩" },
  { code: "DE", name: "Germany", dial: "+49", flag: "🇩🇪" },
  { code: "FR", name: "France", dial: "+33", flag: "🇫🇷" },
];

export const COUNTRY_NAMES = COUNTRIES.map((c) => c.name);

// Split a stored phone string into { dial, number } by longest matching dial prefix.
export function splitPhone(value) {
  const v = (value || "").trim();
  if (!v) return { dial: "", number: "" };
  const byLen = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
  for (const c of byLen) {
    if (v.startsWith(c.dial)) return { dial: c.dial, number: v.slice(c.dial.length).replace(/\D/g, "") };
  }
  return { dial: "", number: v.replace(/\D/g, "") };
}

export function findCountry(dial) {
  return COUNTRIES.find((c) => c.dial === dial) || null;
}
