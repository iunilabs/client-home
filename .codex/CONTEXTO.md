# Contexto

Objetivo: adelantar la siguiente tanda 150 px porque visualmente aparecía hacia 640. Worktree aislado `puntoes-paper-copy-1900`; base pública `8541bd6`, con precarga, renderer compartido y optimización de sección 4. Checkout principal intacto.

`paperTiming.several` pasa de 500 a 350 px locales. Primera tarjeta conserva inicio a 80 px y duración. Se mantiene escalonado. Texto: entrada 1200–1700, salida 2500–2740; blur 3 px.

Archivos: `src/section-three/timing.js`, expectativas en `tests/section-three-motion.test.js` y `tests/section-three-integration.mjs`. Cuatro pruebas de movimiento y build correctos antes de integrar actualización remota. QA en 390 y 1440 px: una tarjeta a 349 px, tanda activa a 351 y nueve dentro del encuadre a 500. Siguiente: comprobar build tras rebase, push y verificar Pages.
