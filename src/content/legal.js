import { BRAND } from "../brand.config.js";

/*
  ⚠️ PLACEHOLDER LEGAL CONTENT — starting point only.
  Before launch: have a lawyer / CA review these, fill in your real business
  details below, and set LAST_UPDATED. Payment gateways also require live,
  accurate policy pages.
  Edit everything in THIS one file.
*/

const NAME = BRAND.name;

// ---- Business & support details (EDIT THESE) ----
export const SUPPORT = {
  email: "miniandme.in@gmail.com",             // real support inbox
  phone: "+91 89715 83502",                    // real support number
  hours: "Monday–Saturday, 10:00–18:00 IST",
  address: "Registered address, City, State, PIN — India",  // EDIT
  jurisdiction: "Bengaluru, Karnataka",        // EDIT — courts/jurisdiction city
  gstin: "",                                   // EDIT — add once registered
};

export const LAST_UPDATED = "Update this date on publish";

// ---- Policy pages ----  each = { title, sections: [{ h, body }] }
export const LEGAL_PAGES = {
  privacy: {
    title: "Privacy Policy",
    sections: [
      { h: "What we collect", body: `${NAME} collects the details you give us — name, email, phone number, delivery addresses, and order history — plus basic device/usage data needed to run the store.` },
      { h: "How we use it", body: "We use your information to process and deliver orders, provide support, send order updates, prevent fraud, and improve the store. We do not sell your personal data." },
      { h: "Who we share it with", body: "We share only what's necessary with delivery partners (to ship your order) and payment processors (to take payment) once those are enabled. They may use it only to provide their service to us." },
      { h: "Data security", body: "Your data is stored with our hosting provider (Supabase) and protected by row-level security so you can only access your own information. No system is perfectly secure, but we take reasonable measures to protect it." },
      { h: "Your rights", body: `You can view or update your profile and addresses in the app at any time. To access, correct, or delete your data, email us at ${SUPPORT.email}.` },
      { h: "Cookies & local storage", body: "We use browser local storage to keep you signed in and remember your cart and favourites. Clearing your browser storage will remove these." },
      { h: "Contact", body: `Questions about privacy? Email ${SUPPORT.email}.` },
    ],
  },
  terms: {
    title: "Terms & Conditions",
    sections: [
      { h: "Acceptance", body: `By using ${NAME}, you agree to these terms. If you don't agree, please don't use the store.` },
      { h: "Your account", body: "You're responsible for keeping your login secure and for activity under your account. Provide accurate information at signup and checkout." },
      { h: "Orders & pricing", body: "All prices are in Indian Rupees (₹) and include applicable taxes unless stated otherwise. We may cancel or refuse any order — for example due to pricing errors or stock issues — and will refund any amount already paid." },
      { h: "Payments", body: "Once online payments are enabled, payment is handled by a third-party gateway; by paying you also agree to their terms. Until then, orders are recorded but not charged." },
      { h: "Content", body: `All content, branding, and images on ${NAME} belong to us or our licensors and may not be reused without permission.` },
      { h: "Liability", body: "The store is provided “as is”. To the extent permitted by law, we're not liable for indirect or incidental losses arising from use of the store." },
      { h: "Governing law", body: `These terms are governed by the laws of India, and disputes are subject to the courts of ${SUPPORT.jurisdiction}.` },
      { h: "Changes", body: "We may update these terms; continued use after changes means you accept them." },
    ],
  },
  returns: {
    title: "Returns & Refunds",
    sections: [
      { h: "Return window", body: "You can request a return within 7 days of delivery if the item isn't right." },
      { h: "Condition", body: "Items must be unused, unwashed, with original tags and packaging intact. We may decline returns that don't meet this." },
      { h: "Non-returnable items", body: "For hygiene reasons, innerwear and items marked non-returnable or final-sale can't be returned unless they arrived damaged or defective." },
      { h: "How to return", body: `Email ${SUPPORT.email} with your order number and reason. We'll arrange a pickup or share return instructions.` },
      { h: "Refunds", body: "Once we receive and check the item, refunds are issued to your original payment method (or as store credit) within 5–7 business days. Shipping charges, if any, are non-refundable." },
      { h: "Exchanges", body: "Need a different size or colour? Request a return and place a new order, or contact support and we'll help." },
    ],
  },
  shipping: {
    title: "Shipping Policy",
    sections: [
      { h: "Where we deliver", body: "We currently ship across India. Serviceability depends on your PIN code and our courier partners." },
      { h: "Processing time", body: "Orders are usually processed within 1–2 business days. You'll get an update when your order is confirmed and dispatched." },
      { h: "Delivery estimate", body: "Most orders arrive within 3–7 business days of dispatch, depending on your location. Remote areas may take longer." },
      { h: "Charges", body: "Shipping charges (if any) are shown at checkout. [EDIT: e.g. free shipping over ₹999, otherwise a flat fee.]" },
      { h: "Tracking", body: "Once tracking is enabled, you'll receive a tracking link to follow your order. Until then, we'll keep you updated on the order status." },
      { h: "Delays", body: `Weather, festivals, or courier issues can occasionally cause delays. If your order is late, contact ${SUPPORT.email} and we'll help.` },
    ],
  },
};

export const LEGAL_ORDER = ["privacy", "terms", "returns", "shipping"];

// ---- FAQs (Contact page) ----
export const FAQS = [
  { q: "How do I track my order?", a: "Open Account → My orders to see each order's status. Live courier tracking is coming soon." },
  { q: "What payment methods do you accept?", a: "Online payments (UPI/cards) are being set up. Until then, our team will confirm your order and the payment method." },
  { q: "How do I return an item?", a: `Email ${SUPPORT.email} with your order number within 7 days of delivery and we'll arrange it.` },
  { q: "Which areas do you deliver to?", a: "We ship across India; serviceability depends on your PIN code." },
  { q: "How do I change my delivery address?", a: "Go to Account → Delivery addresses to add or edit addresses and set a default." },
];
