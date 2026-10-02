// Match the compressed section heights in style.css. Earlier entrances stay put.
export const paperMotionPixels = pixels => Math.min(pixels, 2000) + Math.max(0, pixels - 2000) * 1.5;
export const paperScrollPixels = pixels => Math.min(pixels, 2000) + Math.max(0, pixels - 2000) / 1.5;

// Pixel anchors keep the first two entrances consistent across viewport sizes.
export function paperTiming(scrollRange) {
  const first = 80 / scrollRange, several = 350 / scrollRange;
  const remaining = 1 - several;
  return {
    first, several, firstDuration: Math.min(470 / scrollRange, .145),
    severalSpread: remaining * .075, severalDuration: remaining * .12,
    many: several + remaining * .18, manySpread: remaining * .16,
    manyDuration: remaining * .16,
    group: several + remaining * .54, grouped: 1,
  };
}
