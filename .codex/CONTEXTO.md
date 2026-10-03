# Contexto

Objetivo: crear y publicar todas las páginas del menú. Checkout `puntoes-mobile-section2-fixes`, rama `fix/mobile-section-two`, base `a956832` (conserva texto final de tarjetas).

Seis entradas HTML: consultoria, ia-automatizacion, formacion, clientes, nosotros, hablemos. Diseño responsive azul, textos comerciales basados en fuentes oficiales documentadas en `src/site/SOURCES.md`. Sin cifras, testimonios ni casos de IA inventados. BBVA identifica la publicación histórica. Formulario reutiliza el endpoint existente; CTAs preseleccionan tema. Formación filtra diez programas.

`src/site/templates.js` comparte navegación/footer en Vite; `site.css` y `main.js` son ligeros, sin Three/Lenis/modelos. Header conserva animación y foco; enlaces cierran el modal para retorno con historial.

Verificado: 130 unitarias, build Pages, seis vistas a 320/390/1440, rutas/enlaces/imágenes/back, filtros y contacto interceptado. Header en siete tamaños y animación CPU×4: mediana17/p9518ms. Sin teléfono físico.

Publicación autorizada. Confirmar workflow y comprobación pública al terminar.
