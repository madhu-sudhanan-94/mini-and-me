/*
  Payment config — feature switches only. There is NO secret here on purpose:
  - The Razorpay key_id is returned by the create-razorpay-order edge function.
  - The Razorpay key_secret lives ONLY as a Supabase Edge Function secret.
  See docs/payments-setup.md to wire the keys and deploy the functions.
*/
export const PAYMENTS = {
  provider: "razorpay",
  onlineEnabled: true,  // show "Pay online" (Razorpay) at checkout
  codEnabled: true,     // show the "Cash on delivery" option at checkout
  codAvailable: false,  // ...but COD can't be ordered yet — selecting it shows "not available"
};
