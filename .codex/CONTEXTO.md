# Contexto

Objetivo: animar el header funcional aprobado, especialmente en móvil. Checkout `puntoes-mobile-section2-fixes`, rama `fix/mobile-section-two`, base `a932646`. Seis opciones siguen sin destino; logo mantiene inicio.

Móvil: despliegue circular desde hamburguesa, icono que se convierte en cruz, opciones/números/líneas en cascada, halo azul y cierre inverso. Escritorio: entrada suave, subrayados y detalles de logo/CTA. Animaciones finitas, sin recursos nuevos. Diálogo conserva foco, bloqueo de fondo y scroll interno. Escape interrumpe apertura; desktop cancela inmediatamente; movimiento reducido abre/cierra sin animación.

Archivos: `index.html`, `src/header.css`, `src/header.js`, pruebas `header-browser.mjs` y `header-motion.mjs`. Build y funcionalidad en siete tamaños correctos. Prueba de animación: DPR 3, CPU ×4, mediana 17 ms y p95 18 ms; cierres rápidos, resize y movimiento reducido correctos. Sin teléfono físico.

Publicación autorizada en GitHub Pages. Al retomar, contrastar último workflow y versión pública.
