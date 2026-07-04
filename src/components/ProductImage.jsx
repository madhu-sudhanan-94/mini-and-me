import React, { useState } from "react";
import Garment from "./Garment.jsx";

/* Product photo with an illustration fallback if there's no image (or it fails to load). */
export default function ProductImage({ p, color, index = 0 }) {
  const [failed, setFailed] = useState(false);
  const src = p.images ? p.images[index] : null;
  if (!src || failed) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <Garment shape={p.shape} color={color || p.colors[0]} className="h-[80%]" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={p.name}
      loading="lazy"
      onError={() => setFailed(true)}
      className="absolute inset-0 w-full h-full object-cover"
    />
  );
}
