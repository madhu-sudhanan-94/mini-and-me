import React, { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { useStore } from "../store.jsx";

/*
  ReviewsSection — shared product ratings + comments, read from the `reviews`
  table (public read). Only a signed-in customer with a DELIVERED order for this
  product may post (enforced by RLS; the UI mirrors it via canReview()).
*/
function Stars({ value, size = 14 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} className={n <= value ? "text-amber-400" : "text-slate-300"} fill={n <= value ? "currentColor" : "none"} aria-hidden />
      ))}
    </div>
  );
}

function StarPicker({ value, onChange }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)} aria-label={`${n} star${n > 1 ? "s" : ""}`} className="active:scale-90 transition">
          <Star size={26} className={n <= value ? "text-amber-400" : "text-slate-300"} fill={n <= value ? "currentColor" : "none"} />
        </button>
      ))}
    </div>
  );
}

export default function ReviewsSection({ productId }) {
  const { productReviews, loadProductReviews, canReview, submitReview } = useStore();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => { loadProductReviews(productId); }, [productId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setOpen(false); setRating(0); setComment(""); }, [productId]);

  const list = productReviews[productId] || [];
  const count = list.length;
  const avg = count ? list.reduce((s, r) => s + (r.rating || 0), 0) / count : 0;
  const fmtDate = (ts) => { try { return new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); } catch { return ""; } };
  const mayReview = canReview(productId);

  const send = async () => {
    setBusy(true);
    const ok = await submitReview({ productId, rating, comment });
    setBusy(false);
    if (ok) { setRating(0); setComment(""); setOpen(false); }
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-slate-800">Ratings &amp; reviews{count > 0 && <span className="text-slate-400 font-normal"> ({count})</span>}</p>
        {mayReview && !open && <button onClick={() => setOpen(true)} className="text-xs font-semibold text-brand-600">Write a review</button>}
      </div>

      {count > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg font-bold text-slate-900">{avg.toFixed(1)}</span>
          <Stars value={Math.round(avg)} size={15} />
          <span className="text-xs text-slate-400">{count} review{count !== 1 ? "s" : ""}</span>
        </div>
      )}

      {/* Write-a-review form — only for a signed-in buyer with a delivered order */}
      {mayReview && open && (
        <div className="bg-white rounded-2xl ring-1 ring-slate-100 p-3 mb-3">
          <StarPicker value={rating} onChange={setRating} />
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="Share your experience (optional)" className="w-full mt-2 border border-slate-200 rounded-xl py-2.5 px-3 text-sm outline-hidden focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 resize-none" />
          <div className="flex gap-2 mt-2">
            <button onClick={send} disabled={busy || rating < 1} className="flex-1 bg-brand-600 text-white text-sm font-semibold py-2.5 rounded-xl disabled:opacity-50 active:scale-[0.98] transition">{busy ? "Posting…" : "Post review"}</button>
            <button onClick={() => setOpen(false)} className="px-4 border border-slate-200 text-slate-500 text-sm font-semibold rounded-xl">Cancel</button>
          </div>
        </div>
      )}

      {count === 0 ? (
        <p className="text-sm text-slate-400">{mayReview ? "No reviews yet — be the first." : "No reviews yet."}</p>
      ) : (
        <div className="space-y-3">
          {list.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl border border-slate-100 p-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center shrink-0">{(r.name || "A").charAt(0).toUpperCase()}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{r.name || "Customer"}</p>
                  <p className="text-[10px] text-slate-400">{fmtDate(r.created_at)}</p>
                </div>
                <Stars value={r.rating} />
              </div>
              {r.comment && <p className="text-sm text-slate-600 mt-2 whitespace-pre-line">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
