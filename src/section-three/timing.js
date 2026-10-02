// Pixel anchors keep the first two entrances consistent across viewport sizes.
export function paperTiming(scrollRange) {
  const first = 80 / scrollRange, several = 350 / scrollRange;
  const remaining = 1 - several;
  return {
    first, several, firstDuration: Math.min(470 / scrollRange, .145),
    severalSpread: remaining * .075, severalDuration: remaining * .12,
    many: several + remaining * .18, manySpread: remaining * .16,
    manyDuration: remaining * .16,
    group: several + remaining * .54, grouped: several + remaining * .96,
  };
}
