# Contexto

Objetivo: restaurar por petición expresa la sección 4 anterior, con las 47 cartas originales agrupadas pasando por un círculo «IA» y repartidas entre Organiza, Resuelve y Deriva. Checkout `puntoes-mobile-section2-fixes`, rama `fix/mobile-section-two`.

Revertido el rediseño de tres ejemplos (`ba145ff`), conservando la revisión de manos `d98660a`. Código de producto idéntico a esa versión anterior; se recuperan sus textos, pila, animación, contadores y duración. Secciones 1–3, seis páginas comerciales, menú y contacto conservados.

Comprobado: 134 pruebas y build correctos; Chrome escritorio/móvil y WebKit móvil, las 47 transferencias, separación física, contadores y scroll inverso hasta la primera tarjeta. Capturas e informe en `/tmp/puntoes-restored-ia`. Preview 4392. Siguiente: publicar en GitHub Pages y confirmar la versión pública.
