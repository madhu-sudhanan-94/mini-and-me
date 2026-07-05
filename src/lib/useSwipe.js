import { useRef } from "react";

/*
  useSwipe — lightweight horizontal swipe / drag detection for carousels.
  Works for touch (mobile) and mouse/pen drag (desktop) via Pointer Events.
  Vertical page scrolling still works — pair with the `touch-pan-y` class.

    const swipe = useSwipe({ onLeft: next, onRight: prev });
    <div {...swipe} className="… touch-pan-y">…</div>

  - onLeft  fires on a LEFTWARD swipe  → natural "next"
  - onRight fires on a RIGHTWARD swipe → natural "previous"

  The returned handlers include `onClickCapture`, which swallows the click that
  would otherwise fire at the end of a drag — so wrapping a <button> (e.g. the
  home hero) won't mis-trigger its onClick when the user only meant to swipe.
*/
export function useSwipe({ onLeft, onRight, threshold = 45 } = {}) {
  const start = useRef(null);
  const swiped = useRef(false);

  const onPointerDown = (e) => {
    start.current = { x: e.clientX, y: e.clientY };
    swiped.current = false;
    try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch { /* noop */ }
  };
  const onPointerUp = (e) => {
    if (!start.current) return;
    const dx = e.clientX - start.current.x;
    const dy = e.clientY - start.current.y;
    start.current = null;
    if (Math.abs(dx) > threshold && Math.abs(dx) > Math.abs(dy)) {
      swiped.current = true;
      (dx < 0 ? onLeft : onRight)?.();
    }
  };
  const onPointerCancel = () => { start.current = null; };
  const onClickCapture = (e) => {
    if (swiped.current) { e.stopPropagation(); e.preventDefault(); swiped.current = false; }
  };

  return { onPointerDown, onPointerUp, onPointerCancel, onClickCapture };
}
