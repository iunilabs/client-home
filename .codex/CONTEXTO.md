# Contexto

Objetivo: sustituir el pop-up de escritorio por las mismas tarjetas del móvil y acercar/centrar el edificio seleccionado. Implementado sobre la mejora previa de textos, tipografía y botones de las once tarjetas.

Rama `feature/client-cards`, base `8619f28`; mejora móvil en `f0823ec`. Checkout original con cambios ajenos intacto. Vista local: http://127.0.0.1:5188/?city=.5.

Archivos: `city.js`, nuevo `city-focus.js`, `mobile-tour-deck.js` y `style.css`. Diálogo anterior eliminado. Selección suave desde la cámara visible; cierre recupera encuadre previo; marcadores moderados durante zoom; redimensionar conserva cliente y progreso. Movimiento reducido aplica encuadre directo. Móvil conserva recorrido.

Checks: 113 pruebas unitarias y build `/client-home/`; Chrome en 1424×873, 900×600 y móvil 390×844, zoom, cierre, cambio rápido, arrastre, salida nativa a sección 3 y movimiento reducido sin errores JS. Capturas e informes en `docs/mobile-card-readability/`.

Siguiente paso: revisión del usuario. Publicar solo cuando lo pida.
