import { BRAND } from "../brand.config.js";

/*
  Legal content — the single source for all policy pages + FAQs. Business and
  support details live in SUPPORT below. Address shown publicly is the city/state
  (full postal address kept on file for Razorpay / customer requests on demand);
  GSTIN is intentionally blank (not GST-registered). Have a lawyer / CA review
  these, and keep LAST_UPDATED current whenever you change them.
  Edit everything in THIS one file.
*/

const NAME = BRAND.name;

// ---- Business & support details (EDIT THESE) ----
export const SUPPORT = {
  email: "miniandme.in@gmail.com",             // real support inbox
  phone: "+91 89715 83502",                    // real support number
  hours: "Monday–Saturday, 10:00–18:00 IST",
  address: "Palladam, Tirupur, Tamil Nadu 641664, India",  // public address (city/state; full postal on file)
  jurisdiction: "Tirupur, Tamil Nadu",         // courts/jurisdiction
  gstin: "",                                   // intentionally blank — not GST-registered
};

export const LAST_UPDATED = "13 July 2026";

// ---- Policy pages ----  each = { title, sections: [{ h, body }] }
export const LEGAL_PAGES = {
  privacy: {
    title: "Privacy Policy",
    sections: [
      { h: "What we collect", body: `${NAME} collects the details you give us — name, email, phone number, delivery addresses, and order history — plus basic device/usage data needed to run the store.` },
      { h: "How we use it", body: "We use your information to process and deliver orders, provide support, send order updates, prevent fraud, and improve the store. We do not sell your personal data." },
      { h: "Who we share it with", body: "We share only what's necessary with delivery partners (to ship your order) and our payment gateway, Razorpay (to take payment securely). They may use it only to provide their service to us. We do not store your full card or UPI details." },
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
      { h: "Orders & pricing", body: "All prices are in Indian Rupees (₹). We may cancel or refuse any order — for example due to pricing errors or stock issues — and will refund any amount already paid." },
      { h: "Payments", body: "Payments are processed securely by our third-party gateway, Razorpay; by paying you also agree to their terms. We don't store your full card or UPI details. Your order is confirmed once payment is successful." },
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
      { h: "Charges", body: "Delivery is free on orders of ₹1,000 or more. On orders below that, a flat ₹99 delivery charge applies. The exact amount is always shown at checkout before you pay." },
      { h: "Tracking", body: "You can follow your order's status anytime in Account → My orders, and we'll email you when it's confirmed, shipped, and delivered." },
      { h: "Delays", body: `Weather, festivals, or courier issues can occasionally cause delays. If your order is late, contact ${SUPPORT.email} and we'll help.` },
    ],
  },
};

export const LEGAL_ORDER = ["privacy", "terms", "returns", "shipping"];

// ---- FAQs (Contact page) ----
export const FAQS = [
  { q: "How do I track my order?", a: "Open Account → My orders to see each order's status. We'll also email you when your order is confirmed, shipped, and delivered." },
  { q: "What payment methods do you accept?", a: "We accept online payments — UPI, cards, netbanking, and wallets — processed securely via Razorpay." },
  { q: "How do I return an item?", a: `Email ${SUPPORT.email} with your order number within 7 days of delivery and we'll arrange it.` },
  { q: "Which areas do you deliver to?", a: "We ship across India; serviceability depends on your PIN code." },
  { q: "How do I change my delivery address?", a: "Go to Account → Delivery addresses to add or edit addresses and set a default." },
];
