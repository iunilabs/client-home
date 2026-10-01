export const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
export const mix = (a, b, t) => a + (b - a) * t;
export const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export function sampleFrames(frames, progress) {
  const p = clamp(progress, frames[0].at, frames.at(-1).at);
  let index = frames.findIndex((frame, i) => i < frames.length - 1 && p >= frame.at && p <= frames[i + 1].at);
  if (index < 0) index = frames.length - 2;
  const a = frames[index], b = frames[index + 1];
  const t = smooth(a.at, b.at, p);
  const result = { at: p };
  for (const key of Object.keys(a)) {
    if (key === 'at') continue;
    result[key] = Array.isArray(a[key]) ? a[key].map((v, i) => mix(v, b[key][i], t)) : mix(a[key], b[key], t);
  }
  return result;
}
export function sceneProgress(offsets, scrollY) {
  if (scrollY <= offsets[0]) return 0;
  for (let i = 0; i < offsets.length - 1; i++) {
    if (scrollY < offsets[i + 1]) return i + clamp((scrollY - offsets[i]) / (offsets[i + 1] - offsets[i]));
  }
  return offsets.length - 1;
}
