/** Clamp `value` into the inclusive range [min, max]. */
export function clamp(value: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}

export interface RectBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** Whether two axis-aligned rectangles overlap. A DOMRect satisfies RectBounds. */
export function rectsIntersect(a: RectBounds, b: RectBounds): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}
