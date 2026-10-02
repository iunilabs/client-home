# Contexto

Objetivo: fade out del texto desde 2000 px y recorrido posterior más rápido. Worktree aislado `puntoes-paper-copy-1900`; base pública `9d831d7`. Checkout principal intacto.

Entrada conservada en 920–1420 px; salida ahora 2000–2240. Desde 2000, movimiento de tarjetas a 1,5× por píxel de scroll. Se comprime altura de sección 3 conservando trayectoria y entradas anteriores (primera 80, tanda 350). Sección 4 pasa de 400 a 300 svh, también 1,5× para su recorrido. Helpers `paperMotionPixels`/`paperScrollPixels` mantienen diagnóstico y reversibilidad. Blur 3 px y contenido intactos.

Archivos: `src/section-three/timing.js`, `scene.js`, `style.css`, `tests/section-three-motion.test.js`. Build y 120 pruebas correctos. QA correcto en móvil, escritorio y horizontal: timings, recorrido comprimido, final y retroceso. Siguiente: commit, push y verificar Pages.
