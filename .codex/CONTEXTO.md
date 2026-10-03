# Contexto

Objetivo: corregir el destello de la pantalla anterior al seleccionar una página desde el menú móvil. Checkout `puntoes-mobile-section2-fixes`, rama `fix/mobile-section-two`, base `e31407c` (47 cartas y círculo IA restaurados).

`src/header.js`: navegación nativa entre documentos mantiene el diálogo abierto hasta `pagehide`; el enlace elegido recibe estado visual y `aria-busy`. Anclas locales y correo/teléfono cierran normalmente. Eventos modificados o cancelados conservan comportamiento nativo. Limpieza al salir/restaurar evita menú y bloqueo residual con Atrás. `src/header.css` añade señal discreta al enlace elegido.

Comprobado: 134 pruebas, build, header en siete tamaños y navegación ciudad. `tests/header-navigation.mjs` prueba carga bloqueada, clic cancelado, destino, Atrás, Escape y anclas desde home y página interior en Chrome/WebKit. Comando `npm run test:header-navigation`; `HEADER_WEBKIT=1` opcional. Preview 4392. Pendiente publicar y verificar URL pública. Ciudad, tarjetas y seis páginas conservadas.
