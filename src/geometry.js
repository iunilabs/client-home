import * as THREE from 'three';

// Loop subdivision in bind space. Bone influences use the same positive
// interpolation as positions, keeping the existing articulated GLB usable.
// The surfaces are procedural, so welding UV seams does not lose a texture.
export function subdivideSkin(source, iterations = 2) {
  const position = source.attributes.position;
  const ids = [], vertices = [], weld = new Map();
  const indices = source.index?.array ?? Array.from({length: position.count}, (_, i) => i);
  for (let i = 0; i < position.count; i++) {
    const p = [position.getX(i), position.getY(i), position.getZ(i)];
    const key = p.map(v => v.toFixed(6)).join(',');
    if (!weld.has(key)) {
      const influences = new Map();
      for (let j = 0; j < 4; j++) {
        const bone = source.attributes.skinIndex.array[i * 4 + j];
        const weight = source.attributes.skinWeight.array[i * 4 + j];
        influences.set(bone, (influences.get(bone) ?? 0) + weight);
      }
      weld.set(key, vertices.length);
      vertices.push({p, influences});
    }
    ids.push(weld.get(key));
  }
  let current = vertices;
  let faces = Array.from(indices, i => ids[i]);
  const blend = (terms) => {
    const p = [0, 0, 0], influences = new Map();
    for (const [vertex, amount] of terms) {
      for (let i = 0; i < 3; i++) p[i] += vertex.p[i] * amount;
      for (const [bone, weight] of vertex.influences) {
        influences.set(bone, (influences.get(bone) ?? 0) + weight * amount);
      }
    }
    return {p, influences};
  };
  for (let iteration = 0; iteration < iterations; iteration++) {
    const neighbors = current.map(() => new Set()), edges = new Map();
    const edgeKey = (a, b) => a < b ? `${a}:${b}` : `${b}:${a}`;
    for (let i = 0; i < faces.length; i += 3) {
      const triangle = faces.slice(i, i + 3);
      for (let j = 0; j < 3; j++) {
        const a = triangle[j], b = triangle[(j + 1) % 3], opposite = triangle[(j + 2) % 3];
        neighbors[a].add(b); neighbors[b].add(a);
        const key = edgeKey(a, b);
        if (!edges.has(key)) edges.set(key, {a, b, opposite: []});
        edges.get(key).opposite.push(opposite);
      }
    }
    const boundaries = current.map(() => []);
    for (const edge of edges.values()) if (edge.opposite.length === 1) {
      boundaries[edge.a].push(edge.b); boundaries[edge.b].push(edge.a);
    }
    const next = current.map((vertex, i) => {
      const boundary = boundaries[i];
      if (boundary.length === 2) return blend([[vertex, .75], ...boundary.map(n => [current[n], .125])]);
      if (boundary.length) return vertex;
      const count = neighbors[i].size;
      if (!count) return vertex;
      const beta = count === 3 ? 3 / 16 : 3 / (8 * count);
      return blend([[vertex, 1 - count * beta], ...Array.from(neighbors[i], n => [current[n], beta])]);
    });
    for (const edge of edges.values()) {
      edge.midpoint = next.length;
      next.push(edge.opposite.length === 2
        ? blend([[current[edge.a], .375], [current[edge.b], .375], ...edge.opposite.map(n => [current[n], .125])])
        : blend([[current[edge.a], .5], [current[edge.b], .5]]));
    }
    const refined = [];
    for (let i = 0; i < faces.length; i += 3) {
      const [a, b, c] = faces.slice(i, i + 3);
      const ab = edges.get(edgeKey(a, b)).midpoint, bc = edges.get(edgeKey(b, c)).midpoint, ca = edges.get(edgeKey(c, a)).midpoint;
      refined.push(a, ab, ca, b, bc, ab, c, ca, bc, ab, bc, ca);
    }
    current = next; faces = refined;
  }
  const positions = [], skinIndex = [], skinWeight = [];
  for (const vertex of current) {
    positions.push(...vertex.p);
    const weights = [...vertex.influences].filter(([, w]) => w > 0).sort((a, b) => b[1] - a[1]).slice(0, 4);
    const total = weights.reduce((sum, [, w]) => sum + w, 0);
    for (let j = 0; j < 4; j++) { skinIndex.push(weights[j]?.[0] ?? 0); skinWeight.push((weights[j]?.[1] ?? 0) / total); }
  }
  const result = new THREE.BufferGeometry();
  result.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  result.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndex, 4));
  result.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeight, 4));
  result.setIndex(faces); result.computeVertexNormals(); result.computeBoundingBox(); result.computeBoundingSphere();
  return result;
}
