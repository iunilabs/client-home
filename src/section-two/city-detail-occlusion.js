// Older native tiles retain their approved buildings. Cut only the background
// occupied by V17 landmarks so an old house cannot reappear behind a new HQ.
// Coordinates are pixels of the 941 × 1672 portrait, independent of viewport.
export const newLandmarkRegions = {
  telefonica: [[304, 716, 97, 183]],
  indra: [[508, 742, 175, 111], [590, 730, 83, 12]],
  allianz: [[327, 1263, 100, 95]],
};

export function detailBackgroundClip(id, [x, y, width, height]) {
  const holes = Object.entries(newLandmarkRegions).filter(([other]) => other !== id)
    .flatMap(([, regions]) => regions).map(([left, top, w, h]) => [
      Math.max(x, left), Math.max(y, top), Math.min(x + width, left + w), Math.min(y + height, top + h),
    ]).filter(([left, top, right, bottom]) => right > left && bottom > top);
  if (!holes.length) return '';
  const point = (left, top) => `${(left - x) / width * 100}% ${(top - y) / height * 100}%`;
  const points = ['0% 0%', '100% 0%', '100% 100%', '0% 100%', '0% 0%'];
  for (const [left, top, right, bottom] of holes) {
    points.push(point(left, top), point(right, top), point(right, bottom), point(left, bottom), point(left, top), '0% 0%');
  }
  return `polygon(evenodd,${points.join(',')})`;
}
