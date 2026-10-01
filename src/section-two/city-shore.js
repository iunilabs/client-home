// Build the wave guide from the photograph's connected ocean. The coarse
// contour only bounds the search; it does not determine the shape of waves.
function flood(width, height, allowed, seeds) {
  const visited = new Uint8Array(width * height), queue = new Int32Array(width * height);
  let read = 0, write = 0;
  function visit(index) {
    if (!visited[index] && allowed(index)) {visited[index] = 1; queue[write++] = index}
  }
  for (const index of seeds) visit(index);
  while (read < write) {
    const index = queue[read++], x = index % width;
    if (x) visit(index - 1);
    if (x < width - 1) visit(index + 1);
    if (index >= width) visit(index - width);
    if (index < width * (height - 1)) visit(index + width);
  }
  return visited;
}

// A separable lower envelope of parabolas gives Euclidean distances,
// rather than staircase distances that turn round bays into diamonds.
function landDistance(land, width, height) {
  const count = width * height, size = Math.max(width, height);
  const vertical = new Float32Array(count), squared = new Float32Array(count);
  const verticalIndex = new Int32Array(count), nearest = new Int32Array(count);
  const f = new Float64Array(size), d = new Float64Array(size);
  const closest = new Int32Array(size);
  const vertices = new Int32Array(size), boundaries = new Float64Array(size + 1);
  function transform(length) {
    let k = 0;
    vertices[0] = 0; boundaries[0] = -Infinity; boundaries[1] = Infinity;
    for (let q = 1; q < length; q++) {
      let intersection;
      do {
        const v = vertices[k];
        intersection = ((f[q] + q*q) - (f[v] + v*v)) / (2*q - 2*v);
        if (intersection <= boundaries[k]) k--;
        else break;
      } while (k >= 0);
      k++; vertices[k] = q; boundaries[k] = intersection; boundaries[k + 1] = Infinity;
    }
    k = 0;
    for (let q = 0; q < length; q++) {
      while (boundaries[k + 1] < q) k++;
      d[q] = (q - vertices[k])**2 + f[vertices[k]];
      closest[q] = vertices[k];
    }
  }
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) f[y] = land[y * width + x] ? 0 : 1e8;
    transform(height);
    for (let y = 0; y < height; y++) {
      vertical[y * width + x] = d[y]; verticalIndex[y * width + x] = closest[y];
    }
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) f[x] = vertical[y * width + x];
    transform(width);
    for (let x = 0; x < width; x++) {
      squared[y * width + x] = d[x];
      nearest[y * width + x] = verticalIndex[y * width + closest[x]] * width + closest[x];
    }
  }
  return {squared, nearest};
}

export function cityOceanGuide({data, width, height}, roughShore) {
  const blue = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const index = y * width + x, n = index * 4;
    const r = data[n], g = data[n + 1], b = data[n + 2];
    blue[index] = roughShore[y] < width && x >= roughShore[y] - width * .065 && b - r > 12 && g - r > 5 && b > 70;
  }
  const ocean = flood(width, height, index => blue[index], Array.from({length: height}, (_, y) => (y + 1) * width - 1));
  // Enclosed white boats are not mainland. Only land connected to the
  // interior contributes to the guide, so foam never circles a boat.
  const land = flood(width, height, index => !ocean[index], Array.from({length: height}, (_, y) => y * width));
  const {squared, nearest} = landDistance(land, width, height);
  const guide = new Uint8ClampedArray(width * height * 4), beach = new Float32Array(width * height).fill(-1);
  function beachAt(index) {
    if (beach[index] >= 0) return beach[index];
    const px = index % width, py = Math.floor(index / width);
    let sand = 0, total = 0;
    for (let y = Math.max(0, py - 6); y <= Math.min(height - 1, py + 6); y++)
      for (let x = Math.max(0, px - 6); x <= Math.min(width - 1, px + 6); x++) {
        const sample = y * width + x;
        if (!land[sample]) continue;
        const n = sample * 4, r = data[n], g = data[n + 1], b = data[n + 2];
        total++;
        if (r > 180 && g > 155 && b > 110 && r - g > 5 && r - b > 16 && g - b > 3) sand++;
      }
    // A patch behind the shore distinguishes warm sand from neutral rocks,
    // paving and white surf. Fade the breaking waves at the end of a beach.
    const amount = Math.max(0, Math.min(1, (sand / Math.max(1, total) - .18) / .32));
    return beach[index] = amount * amount * (3 - 2 * amount);
  }
  for (let index = 0; index < width * height; index++) {
    const n = index * 4, distance = Math.sqrt(squared[index]);
    guide[n] = ocean[index] ? Math.min(255, distance * 128) : 0;
    guide[n + 1] = Math.min(255, distance / 18 * 255);
    guide[n + 2] = ocean[index] && distance < 18 ? Math.round(beachAt(nearest[index]) * 255) : 0;
    guide[n + 3] = 255;
  }
  return guide;
}
