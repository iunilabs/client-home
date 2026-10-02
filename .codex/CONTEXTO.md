# Contexto

Objetivo actual: alargar el fade out del texto de la sección de tarjetas. Worktree activo `puntoes-mobile-section2-fixes`, rama `fix/mobile-section-two`, base pública `3ee8a5b`.

Secciones 3/4 unidas; ordenación desde 1900 px, sin agrupación derecha. Entradas conservadas 80/350 px. Fade out en `src/section-three/scene.js` pasa del 12% al 24% del recorrido de resolución: dura el doble y termina al completar el orden. Caídas, procesamiento, renderer compartido y precarga intactos.

Conservados los últimos textos breves del mapa publicados en `3ee8a5b`: fuentes oficiales, Sabadell según usuario; eliminadas muestras ficticias.

Unitarias y build correctos. QA móvil/escritorio: opacidad 1 al inicio, 0,5 a mitad, 0 al completar orden; retroceso restaura 1, sin errores JS. Siguiente: publicar y verificar https://iunilabs.github.io/client-home/.
