# Contexto

Objetivo: publicar en GitHub Pages las tarjetas compartidas entre móvil y escritorio, con zoom y centrado del edificio seleccionado. Publicación solicitada explícitamente por el usuario.

Rama `feature/client-cards`: mejoras `f0823ec` y `c8f6260`, integrada con `e0be513` de main para conservar los últimos papeles. Checkout original intacto. Vista local: http://127.0.0.1:5188/?city=.5.

Archivos: `city.js`, nuevo `city-focus.js`, `mobile-tour-deck.js` y `style.css`. Diálogo anterior eliminado. Selección suave desde la cámara visible; cierre recupera encuadre previo; marcadores moderados durante zoom; redimensionar conserva cliente y progreso. Movimiento reducido aplica encuadre directo. Móvil conserva recorrido.

Checks: 114 pruebas unitarias y build `/client-home/`; Chrome en escritorio y móvil, zoom, cierre, cambio rápido, arrastre, salida nativa y movimiento reducido sin errores JS. Capturas e informes en `docs/mobile-card-readability/`.

Destino autorizado: https://iunilabs.github.io/client-home/. El workflow `deploy.yml` publica desde main. Al retomar, comprobar despliegue y revisar la web publicada.
