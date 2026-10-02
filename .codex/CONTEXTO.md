# Contexto

Objetivo: quitar la agrupación de tarjetas a la derecha, recortando el tramo posterior a 1900 px. Worktree `puntoes-mobile-section2-fixes`, rama `fix/mobile-section-two`; base pública `bad2c23`.

Una sola sección `#posibilidades`; ordenación comienza en 1900 px. Eliminada la interpolación hacia el volumen derecho. Se conserva la calibración original de caídas por viewport y entradas 80/350 px. Las caídas pendientes terminan mientras las mismas tarjetas se ordenan, sin saltos; el texto se desvanece durante esa transición. El procesamiento posterior, renderer compartido, precarga, geometría y presupuesto GPU siguen vigentes. Ancla `#resolucion` apunta al comienzo de ordenación.

Archivos: `src/section-three/{scene,timing}.js`, `style.css`; pruebas de journey, física, integración y sección cuatro ajustadas. Unitarias y build correctos; swipe y reversibilidad comprobados. QA correcto: 47 trayectorias y transferencias sin intersecciones en escritorio, móvil, móvil pequeño y horizontal; integración sin errores JS. Siguiente: terminar QA, publicar y verificar https://iunilabs.github.io/client-home/.
