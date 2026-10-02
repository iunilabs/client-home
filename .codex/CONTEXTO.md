# Contexto

Objetivo: corregir pausas al entrar por scroll en secciones 3 y 4 y publicar en Pages. Worktree activo `puntoes-mobile-section2-fixes`, rama `fix/mobile-section-two`. Incorporados cambios públicos hasta `96143fd`: texto plano de sección 3, entrada 1900 px y salida 2500–2740 px, blur 3 px.

Motor y entorno 3D compartidos entre manos y tarjetas; canvas cambia de contenedor y vuelve al retroceder. Durante el mapa se preparan las 47 tarjetas y sus 47 versiones verdes, texturas y shaders, con tandas que ceden al navegador. Grano nativo, deformaciones precalculadas y render directo que conserva el fondo original. Sección 4 solo cambia poses y texturas ya preparadas.

Archivos: `src/main.js`, `src/scene.js`, `src/render-budget.js`, `src/section-three/`. QA: unitarias, integración móvil, separación física, 47 transferencias en cuatro tamaños, orientación, fallback y precarga. CPU×4: entradas 29/57 ms. Build `/client-home/` correcto. Publicación autorizada: https://iunilabs.github.io/client-home/. Confirmar workflow y assets públicos tras push.
