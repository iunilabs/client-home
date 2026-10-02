# Contexto

Objetivo: unir las secciones 3 y 4 en un recorrido continuo y publicar en GitHub Pages. Worktree activo: `puntoes-mobile-section2-fixes`, rama `fix/mobile-section-two`.

Una sola sección `#posibilidades`, escenario y progreso; `#resolucion` queda como ancla de fase. `journey.js` calcula rangos contiguos; `scene.js` suaviza una única posición. Eliminado el viewport vacío entre agrupación y orden. Agrupación termina justo en la unión; orden y procesamiento arrancan sin pausas. Precarga, renderer compartido, presupuesto GPU y física conservados. Primera tarjeta 80 px, tanda 350, texto 920–1420, salida desde 2000 y recorrido posterior 1,5×.

Archivos clave: `index.html`, `src/main.js`, `src/section-three/{journey,scene,timing}.js`, `style.css`, `src/section-four/workflow.js`. Build y pruebas unitarias correctos. QA: swipe único cruzando unión, retroceso, rotación, precarga, 47 trayectorias sin intersecciones en tres formatos; fluidez móvil emulada ~60 fps con CPU ralentizada. Siguiente: publicar y verificar https://iunilabs.github.io/client-home/.
