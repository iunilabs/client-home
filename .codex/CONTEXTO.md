# Contexto

Objetivo actual: crear únicamente el header de la nueva web, con menú de escritorio y hamburguesa móvil. Checkout `puntoes-mobile-section2-fixes`, rama `fix/mobile-section-two`; incorporado remoto `cfbe437` (mapa de escritorio libre, selección sin zoom y fichas accesibles durante salida).

Opciones: Consultoría, IA y automatización, Formación, Clientes, Nosotros y Hablemos. Botones provisionales sin destino; logo conserva inicio. Bajo 1100 px, diálogo nativo con cierre, Escape, foco contenido/restaurado, altura dinámica y scroll interno. Suspende Lenis y entradas del mapa al abrir; cerrar o pasar a escritorio los restaura.

Archivos: `index.html`, `src/header.css`, `src/header.js`, integración en `main.js` y bloqueo modal en ciudad/entrada móvil. Pruebas de capítulos usan enlaces profundos en lugar de antiguos botones retirados.

Verificado: build, 130 pruebas, header en siete tamaños 320–1440/horizontal, gestos, teclado, resize, mapa e historial móvil. Publicación de cambios autorizada en GitHub Pages; comprobar workflow y versión pública al retomar.
