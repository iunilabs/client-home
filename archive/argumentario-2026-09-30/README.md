# Puntoes — entrada luminosa y experiencia navegable

30 de septiembre de 2026. Propuesta local para la futura consultora especializada en IA. No es una renovación oficial de la web existente.

Una página con catorce capítulos, manos articuladas, herramientas, cámara vinculada al scroll, perspectiva del ratón, esfera azul, servicios y clientes. La nueva entrada muestra un fondo blanco y verde y una frase centrada; el scroll revela primero los dedos, después la palma y el antebrazo a través de un campo de luz. Frases breves acompañan las acciones; el detalle comercial se abre de forma voluntaria. Lenis suaviza la rueda y un progreso común sincroniza cámara, objetos y texto. El contenido aparece antes de cargar el 3D. Se puede avanzar y retroceder mediante desplazamiento, tacto o teclado, y acceder directamente a servicios y contacto.

## Revisar

Nueva compilación en marcha: [abrir la entrada luminosa](http://127.0.0.1:4177/). Código editable con HMR: [servidor de desarrollo](http://127.0.0.1:4173/).

La compilación aislada está en `dist-intro/`; conserva la versión previa de clientes en `dist-clientes/`. [Referencia, decisiones y capturas de la entrada](docs/entrada-verde/LEEME.md).

```sh
npm install
npm run dev -- --port 4173
```

`npm run build` genera la versión estática en `dist/`. `npm run preview -- --port 4174` permite revisar esa compilación. No hace falta una cuenta ni una clave API.

## Qué se ha resuelto

- Recorrido completo: origen, piedra, compás, mecanismo y alcance, ratón y repetición, contacto, entrega, criterio, formación, consultoría, acompañamiento, método y cierre.
- Gestos y movimientos derivados de la posición de scroll. El recorrido se puede deshacer; no se guarda progreso en cookies ni almacenamiento del navegador.
- La cámara orbita suavemente con el ratón durante una pausa; manos y herramientas comparten la perspectiva y muestran profundidad. El halo del cursor es un efecto de pantalla; no simula una luz física sobre los modelos.
- Los índices mantienen su contacto mediante una restricción espacial. La llave gira conservando la posición de su cabeza sobre la tuerca.
- Mano humana y mano de porcelana tienen articulaciones. El antebrazo se extiende desde la propia geometría de la muñeca, evitando la unión visible de dos piezas separadas.
- Vaivén de la mano en profundidad durante la aparición, con flexiones independientes de corazón, anular y meñique. El paisaje costero se ha retirado de esta versión. La luz de aparición y la perspectiva pertenecen a la escena; no cambian el progreso de la historia.
- Composición adaptada a móvil, controles de movimiento reducido y respeto a la preferencia del sistema. En ese modo se muestran poses estables por capítulo.
- Alternativa visual si falla WebGL y lectura de toda la propuesta sin JavaScript.
- Contacto mediante modal accesible que guarda un borrador en un archivo local. No envía datos y lo indica antes de introducirlos.

## Nivel de acabado

La revisión de modelos incorpora manos subdivididas con uñas, pequeños volúmenes sobre nudillos y tendones, pliegues, variación de piel y esmalte de porcelana. El compás, la llave, el ratón y los engranajes tienen geometría mecánica más detallada. Piedra, metales, polímero y caliza utilizan acabados procedurales; la luz lateral y el contraluz dan más volumen a las superficies.

Se pueden revisar las ocho piezas en el [estudio 3D](http://127.0.0.1:4173/modelos.html): giro y zoom, tres iluminaciones y control de gesto para las manos. El visor permite primeros planos con dos niveles de subdivisión; la experiencia utiliza un nivel para reducir el coste del recorrido. [Detalle de la revisión y sus límites](docs/MODELOS_3D.md).

Sigue siendo una **prueba de narrativa y movimiento en 3D**, con interfaz completa. La anatomía parte de los modelos ligeros WebXR; subdividirlos y añadir detalles mejora la superficie, pero no sustituye una escultura anatómica final ni una piel fotografiada. No equivale todavía al hiperrealismo de los fotogramas conceptuales.

Antes de convertirlo en una home de producción necesitan trabajo específico: anatomía y piel, agarres sin interpenetraciones, trayectoria exacta del compás, sostén de la esfera durante todo el traspaso, transiciones físicas entre herramientas y continuidad del paisaje. El encuentro y la transferencia se pueden revisar ya en movimiento. Los servicios utilizan esquemas abstractos; su representación definitiva debe apoyarse en tareas y contenidos reales.

La escena de ruptura del cristal no se ha añadido: su función quedó abierta en la narrativa posterior de las herramientas. Se conserva como posibilidad, con la barrera entendida como inercia.

## Contenido comercial

Los textos sobre formación, consultoría y acompañamiento en IA son propuestas editables. Se han incorporado los nueve logotipos publicados en la sección de clientes de la web de .es, sin atribuirles encargos de IA ni contratos actuales. No se han añadido métricas, certificaciones, casos, fotografías del equipo ni promesas de integración. La sección sobre el método evita presentar experiencia no acreditada. Equipo, evidencia comercial, oferta definitiva, datos legales y canal de contacto siguen pendientes de información real.

La identidad observada es `.es` y el azul `#009DDB`. Su uso se limita a esta propuesta local. El documento lleva `noindex, nofollow`; no se ha publicado ni conectado a un dominio.

## Documentación y comprobaciones

- [Escena de clientes: integración, fuentes y comprobaciones](docs/clientes/LEEME.md).
- [Ritmo editorial: mensajes vinculados a acciones y pausas](docs/ritmo-editorial/LEEME.md).
- [Comparación con Zero y cambios de esta revisión](docs/COMPARACION_ZERO.md).
- [Guion de escenas y recursos necesarios](docs/GUION_TECNICO.md).
- [Decisiones y pendientes](docs/DECISIONES.md).
- [Validación](docs/VALIDACION.md) y registro detallado [JSON](docs/VALIDACION.json).
- Capturas del navegador en `docs/capturas/`, escritorio y emulación móvil.
- [Procedencia y licencias](docs/RECURSOS.md).

```sh
npm test
npm run test:browser
npm run test:perspective
npm run test:models
npm run test:clients
node tests/editorial-browser.mjs
```

La prueba de navegador requiere Chrome local. Se puede indicar otro ejecutable mediante `PUNTOES_CHROME`, y otro servidor mediante `PUNTOES_URL`. Usa un contexto nuevo y Chromium sin interfaz con SwiftShader; la emulación móvil y el renderizado por software no sustituyen una prueba de rendimiento en un teléfono real.

## Archivos principales

`index.html` contiene el texto y la estructura accesible; `src/style.css`, la composición; `src/main.js`, navegación y controles; `src/timeline.js`, progreso reversible; `src/scene.js`, puesta en escena; `src/hand.js`, articulaciones y extensión del antebrazo; `src/objects.js` y `src/environment.js`, objetos y entorno. La subdivisión está en `src/geometry.js`, los acabados en `src/surfaces.js` y el ajuste de resolución en `src/render-budget.js`. `modelos.html` y `src/model-studio.js` forman el visor de piezas. Los modelos y fuentes se sirven desde `public/`, sin depender de una CDN en ejecución.
