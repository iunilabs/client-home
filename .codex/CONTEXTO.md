# Contexto

Objetivo: mejorar lectura, textos y botones de todas las tarjetas de clientes y colaboración, especialmente en móvil, a partir de la captura del usuario.

Rama `feature/mobile-card-readability`, base `8619f28` (origin/main). Checkout original con cambios ajenos intacto. Vista local: http://127.0.0.1:5188/?city=0.

Cambios: once resúmenes móviles específicos en `src/section-two/case-studies.js`, uso en `mobile-tour-deck.js`, cuerpo de 16 px, botones de 48 px, contraste mayor, tarjetas sin recortar texto y altura mínima uniforme en `style.css`. También ampliada tipografía del diálogo de escritorio. Ajustada expectativa de clamp en `tests/mobile-scroll.mjs`.

Checks: suite unitaria vigente, build `/client-home/`, once tarjetas en 320/390/430 px sin recortes ni desbordamientos; gesto táctil sobre tarjeta y salida nativa correctos. Capturas e informe en `docs/mobile-card-readability/`. Sin errores JS.

Siguiente paso: revisar propuesta con el usuario; publicar solo cuando lo pida.
