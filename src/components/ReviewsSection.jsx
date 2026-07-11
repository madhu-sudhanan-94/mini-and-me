import React, { useState, useEffect } from "react";
import { Star } from "lucide-react";

/*
  ReviewsSection — READ-ONLY star ratings + written comments for a product.
  Writing is intentionally disabled (only verified buyers should review).
  Reviews are read from localStorage; to show shared reviews and let delivered
  buyers post, back this with a Supabase `reviews` table (product_id, name,
  rating, comment, created_at) + a fetch, gated behind a delivered order.
*/
const KEY = "mm_reviews";
const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; } };

function Stars({ value, size = 14 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} className={n <= value ? "text-amber-400" : "text-slate-300"} fill={n <= value ? "currentColor" : "none"} aria-hidden />
      ))}
    </div>
  );
}

export default function ReviewsSection({ productId }) {
  const [all, setAll] = useState({});
  useEffect(() => { setAll(load()); }, []);

  const list = all[productId] || [];
  const count = list.length;
  const avg = count ? list.reduce((s, r) => s + r.rating, 0) / count : 0;
  const fmtDate = (ts) => { try { return new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); } catch { return ""; } };

  return (
    <div className="mt-6">
      <p className="text-sm font-semibold text-slate-900 mb-2">Ratings &amp; reviews{count > 0 && <span className="text-slate-400 font-normal"> ({count})</span>}</p>

      {count > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg font-bold text-slate-900">{avg.toFixed(1)}</span>
          <Stars value={Math.round(avg)} size={15} />
          <span className="text-xs text-slate-400">{count} review{count !== 1 ? "s" : ""}</span>
        </div>
      )}

      {count === 0 ? (
        <p className="text-sm text-slate-400">No reviews yet.</p>
      ) : (
        <div className="space-y-3">
          {list.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl border border-slate-100 p-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center shrink-0">{(r.name || "A").charAt(0).toUpperCase()}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{r.name}</p>
                  <p className="text-[10px] text-slate-400">{fmtDate(r.ts)}</p>
                </div>
                <Stars value={r.rating} />
              </div>
              <p className="text-sm text-slate-600 mt-2 whitespace-pre-line">{r.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
