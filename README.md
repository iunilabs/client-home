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

La página principal continúa desde el encuentro hacia una ciudad con diez clientes y una obra para nuevas colaboraciones. En ordenador, cada punto abre una ficha con «Ver más», cierre con Escape y recuperación del foco; la obra abre «¿Quieres colaborar?» y el enlace «Hablemos». Los relatos de clientes están marcados como ejemplos ilustrativos. Los [recursos y prompts](src/section-two/assets/README.md) y las [fuentes de logos](src/section-two/assets/LOGOS-FUENTES.md) están documentados.

En ordenador, la entrada empieza al 150 % y el scroll aleja el mapa. El ratón permite explorar una extensión con un 25 % del ancho/alto original adicional por cada borde. El núcleo V10 conserva su escala, edificios y puntos exactos, con uniones suavizadas al paisaje V11.

En móvil, un gesto vertical deliberado avanza una parada del recorrido **Puntoes → BBVA → Naturgy → Banco Sabadell → obra**. La entrada se ancla en Puntoes y consume la inercia, incluido el scroll nativo que comenzó antes del cruce; los controles «Anterior» y «Siguiente» muestran sus destinos y permiten salir en los extremos. Hay una sola tarjeta visible, con lectura propia: abrir «Ver más» mantiene el edificio incluso al llegar al final del relato. Los diez logos siguen disponibles; visitar un cliente externo conserva el destino pendiente (BBVA → Cepsa → siguiente visita Naturgy). La obra conserva «Hablemos». El móvil no descarga la ampliación de escritorio.

La selección y el orden están en `mobileTourOrder` de [mobile-tour-config.js](src/section-two/mobile-tour-config.js). La [guía de mantenimiento móvil](src/section-two/MOBILE-TOUR.md) documenta todos los identificadores, cómo sustituir las tres empresas, tiempos, encuadres, recuperación de tarjetas y capas de detalle. Cambiar la lista recalcula la numeración y los destinos pendientes; mantiene todos los logos disponibles. No requiere modificar HTML ni la animación.

«Activar movimiento» permite habilitar opcionalmente el sensor en móvil y solicitar permiso desde el toque cuando el navegador lo exige. «Recentrar» toma una nueva posición neutral y «Desactivar movimiento» retira la escucha. La inclinación lateral desplaza horizontalmente el mapa; la inclinación adelante/atrás lo desplaza verticalmente, con suavizado y margen limitado. Texto, controles y tarjetas permanecen fijos. El sensor se pausa durante los trayectos y fuera de la ciudad, y respeta el movimiento reducido; si no existe acceso, el recorrido continúa funcionando. Imagen, puntos y agua comparten el movimiento del mapa. El agua anima espuma en playas y textura en mar abierto con una máscara que excluye piedras, espigones, barcos y edificios; se pausa fuera de la ciudad o con una ficha modal abierta.

`?scroll=0..1000` conserva los marcadores de la sección 1; `#encuentro` muestra su postura final y `?city=0.94` permite revisar la ciudad. El contador se oculta en la ciudad móvil; la tarjeta y los controles indican el destino y el avance. En escritorio conserva las coordenadas de scroll. El punto cerrado de la primera sección está en la etiqueta `seccion-1-cerrada-2026-10-01` (`e0d14a3`). Los módulos de continuación usan los modelos y materiales actuales sin copiar su antiguo baseline.

Validación: `npm test`, compilación con `npm run build -- --base=/client-home/` y `PUNTOES_URL=http://127.0.0.1:4303/client-home/ npm run test:mobile-navigation` , `node tests/mobile-motion.mjs` y `node tests/mobile-entry.mjs` sobre esa compilación, servida con `npm run preview -- --port 4303 --strictPort --base=/client-home/`. Navegador en 320×568, 390×844 y 430×932: gestos y colas de rueda, una tarjeta legible, lectura completa, visitas manuales y continuidad, teclado, historial, movimiento reducido y escritorio. El sensor se verifica con datos y permisos simulados, incluidos ejes independientes, pausas y overlays fijos. La sección 1 conserva sus fuentes y animaciones aprobadas. La emulación no verifica un sensor ni el rendimiento de un móvil físico.
