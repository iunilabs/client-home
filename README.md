# Puntoes — En tus manos

Landing de Puntoes con una escena 3D controlada por el scroll: mano humana, piedra, compás, llave inglesa y encuentro con una mano de porcelana.

## Desarrollo

Se recomienda Node.js 24 y npm.

    npm ci
    npm run dev

La portada está en /. Las utilidades de revisión de mano y modelos están en /mano.html y /modelos.html.

## Comprobación y compilación

    npm test
    npm run build
    npm run preview

La compilación se genera en dist. Los modelos, texturas, fuentes y decodificadores necesarios se incluyen como archivos estáticos.

## GitHub Pages

El workflow .github/workflows/deploy.yml comprueba y compila el proyecto al actualizar main, y publica dist en GitHub Pages. La compilación usa la base /client-home/ para resolver los recursos del sitio de proyecto.

Web: https://iunilabs.github.io/client-home/

## Modelos y licencias

Se conservan los créditos y avisos de procedencia junto a los modelos en public/models, las licencias tipográficas en public/fonts y los avisos de dependencias en public/licenses. Los créditos de los modelos también se muestran en la web.

## Punto de restauración

La sección de manos aprobada antes de esta revisión editorial está guardada en la referencia Git manos-cerradas-2026-10-01, commit 2065e0f4733dc4daadf3aa30a17dc74d42951834.

También existe una copia local independiente con código, modelos, texturas, web compilada y documentación. Su restauración completa fue comprobada antes de limpiar archivos. Los archivos generados y las pruebas visuales locales no forman parte del repositorio de publicación.

Para abrir ese estado en otra carpeta sin modificar la versión actual:

    git worktree add ../puntoes-manos-cerradas manos-cerradas-2026-10-01

Los scripts de preparación de fuentes y texturas conservados en tools necesitan los originales TTF/PNG de ese punto de restauración. La web publicada usa las fuentes WOFF2 y las texturas WebP sin pérdida que ya están en public.

## Sección 2: ciudad y clientes

La página principal continúa desde el encuentro hacia una ciudad con trece clientes y una obra para nuevas colaboraciones. En ordenador, cada punto abre una ficha con «Ver más», cierre con Escape y recuperación del foco; la obra abre «¿Quieres colaborar?» y el enlace «Hablemos». Las tarjetas usan textos breves basados en la web de Puntoes; BBVA tiene un caso publicado y Sabadell usa información facilitada por el usuario, sin nombres de proyectos. Para las demás empresas se emplean frases editoriales generales, sin atribuir proyectos específicos. Los [recursos y prompts](src/section-two/assets/README.md) y las [fuentes de logos](src/section-two/assets/LOGOS-FUENTES.md) están documentados.

Tras las manos, el texto azul «La confianza se construye» aparece centrado antes de dar paso al mapa, tanto en móvil como en ordenador. En ordenador, el mapa entra al 150 % y empieza a alejarse desde su aparición. El gesto que alcanza el final de la ciudad se detiene allí; un gesto nuevo continúa hacia la sección 3. El ratón permite explorar una extensión con un 25 % del ancho/alto original adicional por cada borde. El núcleo V10 conserva su escala, edificios y puntos exactos, con uniones suavizadas al paisaje V11.

En móvil, cada nuevo swipe vertical visita una parada de **Puntoes → BBVA → Naturgy → Banco Sabadell → obra**, con el documento anclado mientras la cámara acelera, abre el encuadre para mostrar las calles y frena al llegar. La entrada captura también la inercia de un swipe fuerte. La tarjeta empieza a entrar durante el viaje y las anteriores permanecen debajo. Tras la obra, un nuevo gesto continúa el scroll nativo de la página sin salto programado. Las tarjetas tienen título y resumen de una o dos líneas y carecen de scroll interno. «Ver más» enlaza a la futura página individual del cliente; esas páginas todavía no existen. La obra conserva «Hablemos».

El footer transparente muestra los trece logos blancos. Se puede arrastrar horizontalmente con inercia y frenado; el avance automático vuelve dos segundos después de soltar el dedo. Tocar cualquier cliente, incluso el ya visible, cancela las demás empresas pendientes y deja **cliente elegido → obra pendiente → salida con scroll normal**. Tras ver «Hablemos», la obra no se repite al elegir otro cliente. Los swipes nuevos pueden cambiar el destino durante un viaje y los desplazamientos duran 1400–2100 ms. Volver a Puntoes limpia la pila visible para evitar que reaparezcan tarjetas antiguas. Una tarjeta ya vista se recupera sobre la pila. Los doce destinos tienen detalle móvil nativo V14, cargado para la visita actual y la siguiente; el móvil no descarga la ampliación de escritorio.

La selección y el orden están en `mobileTourOrder` de [mobile-tour-config.js](src/section-two/mobile-tour-config.js). La [guía de mantenimiento móvil](src/section-two/MOBILE-TOUR.md) documenta todos los identificadores, cómo sustituir las tres empresas, tiempos, encuadres, recuperación de tarjetas y capas de detalle. Cambiar la lista recalcula las paradas y su numeración; mantiene todos los logos disponibles. No requiere modificar HTML ni la animación.

La inclinación del teléfono da una perspectiva suave, calibrada y limitada a dos grados, cuando el navegador ya permite acceder al sensor. Funciona automáticamente, sin botón ni solicitud de permisos, y se pausa durante los trayectos. Imagen, puntos y agua comparten el movimiento. El agua anima espuma en playas y textura en mar abierto con una máscara que excluye piedras, espigones, barcos y edificios; se pausa fuera de la ciudad o con una ficha modal abierta.

`?scroll=0..1000` conserva los marcadores de la sección 1; `#encuentro` muestra su postura final y `?city=0.94` permite revisar la ciudad. El contador vuelve a 0..1000 al empezar la segunda sección. El punto cerrado de la primera sección está en la etiqueta `seccion-1-cerrada-2026-10-01` (`e0d14a3`). Los módulos de continuación usan los modelos y materiales actuales sin copiar su antiguo baseline.

Validación: `npm test`, compilación con `npm run build -- --base=/client-home/`, recorrido y selección manual en 320×568, 390×844 y 430×932, gestos nativos de Chrome emulado, tarjetas sin scroll, carrusel en ambas direcciones, doce detalles y fallback, escritorio, teclado e historial. Los scripts están en `tests/mobile-scroll.mjs`, `tests/mobile-manual.mjs`, `tests/mobile-access.mjs` y `tests/city-carousel-browser.mjs`; configurar sus URLs para el preview compilado. La sección 1 conserva sus fuentes y animaciones aprobadas. La emulación no verifica un sensor ni el rendimiento de un móvil físico.
