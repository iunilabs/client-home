# Contexto

Objetivo: optimizar el proyecto completo, retirar recursos obsoletos, verificar y publicar en GitHub Pages. Checkout `puntoes-mobile-section2-fixes`, rama `fix/mobile-section-two`, base `a034450`; incorpora trece clientes y contacto.

Conservados diseño, texturas, modelos activos y recorrido único de 47 tarjetas. Estudios `/mano.html` y `/modelos.html` exclusivamente locales (`build:studies`). Inventario `production-assets.json` controla recursos comerciales; prueba y build detectan ausencias. Retirados 23 archivos históricos recuperables en Git. Publicación: 29,32→19,96 MiB, −31,9 %. DOM editorial se actualiza únicamente cuando cambia; corregida posición de tarjetas al liberar el mapa móvil.

Archivos principales: `vite.config.js`, `src/main.js`, `src/section-three/scene.js`, inventario, auditoría y pruebas. Pasan 129 pruebas, ambos builds, arranque, carrusel, zoom, gestos 320/390/430, físicas, transferencias, precarga, contacto interceptado y estudios. Rendimiento emulado: 60 fps; sin comprobación en teléfono físico.

Publicación autorizada en `main`. Al retomar, consultar último workflow y contrastar versión pública.
