# Puntoes · estudio de manos y movimiento

1 de octubre de 2026. La versión activa conserva la entrada luminosa y sustituye todo el argumentario desde la piedra por una coreografía basada en las capturas aportadas de Zero. El encuadre final toma como referencia el detalle de *La creación de Adán* facilitado después.

[Vista previa en desarrollo](http://127.0.0.1:4174/#inicio) · [Vista compilada](http://127.0.0.1:4177/#inicio) · [Encuadre final](http://127.0.0.1:4177/#encuentro)

Hay cinco tramos: aparición, órbita de clientes, giro, extensión y encuentro. El texto visible de la entrada se conserva; no se ha escrito un nuevo argumentario comercial. Las manos, la cámara y los discos comparten un progreso continuo y reversible. La entrada empieza a revelar los dedos desde el primer desplazamiento, con un tramo de 110svh en escritorio y 100svh en móvil (mínimos de 720 y 600 píxeles). La primera mano mantiene el vaivén a través de la luz y los movimientos pequeños de corazón, anular y meñique. El final se alcanza con scroll o teclado, sin dibujar ni mantener pulsado.

La muñeca de la mano humana se articula independientemente del antebrazo. La segunda mano tiene un índice extendido y un pulgar orientado por su articulación de base. Los antebrazos se funden con la luz para ocultar el final de las mallas. El ratón mueve la cámara y un foco de la escena; no cambia el progreso. En móviles que ya entregan datos de orientación, la inclinación controla esa misma perspectiva automáticamente, sin botón, avisos ni llamadas a `requestPermission()`. `src/perspective-input.js` toma la primera postura como centro, limita el movimiento y recalibra al rotar la pantalla o volver a la página. Respeta el movimiento reducido. Si el navegador bloquea los sensores o no hay contexto seguro, la experiencia continúa sin ese efecto. Para comprobarlo desde un móvil en la red se necesita HTTPS; una dirección LAN con HTTP no habilita los sensores. Las pruebas de orientación usan datos simulados, no un móvil físico.

Los nueve logotipos de Puntoes orbitan alrededor de la muñeca y pueden consultarse en una lista accesible. Su procedencia está en `docs/clientes/FUENTES.json`: son relaciones publicadas por Puntoes, sin atribuir contratos actuales o trabajos de IA. El medidor de scroll sirve para revisar posiciones de la animación.

La compilación está en `dist-intro/`. El recorrido anterior se conserva como copia histórica en `archive/argumentario-2026-09-30/` y en `dist-clientes/`; no se carga en esta página. Los archivos de modelado y los visores de la otra sesión se conservan.

```sh
npm run dev -- --port 4180
npm run build -- --outDir dist-intro
npm run preview -- --outDir dist-intro --port 4177 --strictPort
npm test
npm run test:browser
```

[Correspondencia con referencias y capturas](docs/coreografia-mano/LEEME.md). El registro de comprobaciones está en `docs/coreografia-mano/VALIDACION.json`. Las pruebas utilizan Chrome local con SwiftShader; comprueban composición e interacción y no acreditan rendimiento en una GPU física o un móvil real.

Archivos principales: `src/choreography.js` define poses y transiciones; `src/scene.js`, la puesta en escena; `src/wrist-gesture.js`, las articulaciones de muñeca y pulgar; `src/hand-falloff.js`, el fundido del antebrazo; `src/hand-orbits.js`, las órbitas de marcas; `src/main.js`, navegación y reloj de scroll; `index.html` y `src/style.css`, la interfaz. Los modelos y materiales se integran desde los módulos de la sesión de modelado.

Esto es una revisión local de coreografía, sin publicación ni un nuevo guion definitivo de la consultora. Se mantienen los materiales propios de Puntoes; el fondo blanco y azul y los acentos de la interfaz siguen la gama del logo (#009ddb). La referencia de Zero guía los gestos y encuadres, sin incorporar su jardín, textos o mecanismos de interacción. Las manos detalladas disponibles en el proyecto se integran mediante `src/reference-hand.js`; procedencia y comunicado de uso aportado en `public/models/zero/provenance.json`. Se conservan los modelos anteriores. `src/ventral-skin.js` corrige el color de las yemas sin cambiar las uñas dorsales ni editar las texturas fuente.

`src/skin-continuity.js` da continuidad fotográfica al antebrazo, funde la muñeca e iguala localmente el color en las uniones UV de la mano. La comparación antes/después y la prueba nativa están en `docs/coreografia-mano/PIEL-*`.
