# Contexto

Objetivo: mejorar fluidez continua de sección 4 y publicar. Worktree activo `puntoes-mobile-section2-fixes`, rama `fix/mobile-section-two`. Incorporados cambios públicos hasta `a4a9b99`: texto sección 3 entra 1200–1700 px, sale 2500–2740 px; segunda oleada empieza a 500 px, mínimo vertical 3140 px.

Motor compartido y precarga previa conservados. Sección 4 usa superficies mates y geometría ligera para tarjetas quietas; solo la viajera conserva malla flexible. Caché de poses, sombras estáticas reutilizadas con giroscopio y presupuesto gráfico adaptativo que responde a 30 fps. Materiales y geometrías de sección 3 se restauran al retroceder.

Archivos: `src/section-three/{paper,scene}.js`, `src/render-budget.js`; tests de transferencia, movimiento continuo y presupuesto. QA: unitarias, integración móvil, 47 transferencias en cuatro tamaños, orientación y fallback. CPU×4/DPR3: GPU normal 60 fps; simulación GPU lenta 344→61 ms/fotograma. Build `/client-home/` correcto. Publicación autorizada: https://iunilabs.github.io/client-home/. Confirmar workflow y assets tras push.
