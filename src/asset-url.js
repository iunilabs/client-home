const runtimeBase = typeof import.meta.env === 'object' ? import.meta.env.BASE_URL : '/';

// Public assets retain their source paths while the deployed app may live
// below a project directory. Leave external URLs and GLB blob textures intact.
export function assetUrl(path, base = runtimeBase) {
  if (!path.startsWith('/') || path.startsWith('//')) return path;
  if (base === '/' || path.startsWith(base)) return path;
  return base + path.slice(1);
}
