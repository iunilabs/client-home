// Conservative depth envelopes include rotation, curl, torsion and flutter.
// Permanent lanes preserve front/back order, including when scroll reverses.
export function paperDepthHalf({width, height, maxScale, tilt, maxCurl}) {
  const rotated = Math.hypot(width, height * (1 + .024 * maxCurl)) / 2 * Math.sin(2 * tilt);
  const flex = maxCurl * (width * .17 + height * .19) + .08 * width * .12
    + .034 * Math.min(width, height) + .26 * height * .06 + .004;
  return (rotated + flex) * maxScale;
}
export function assignPaperLanes(pieces, front = 3.4) {
  let edge = front + paperDepthHalf(pieces[0]);
  for (const piece of pieces) {
    piece.depthHalf = paperDepthHalf(piece);
    piece.depth = edge - piece.depthHalf;
    edge = piece.depth - piece.depthHalf - .06;
  }
}
