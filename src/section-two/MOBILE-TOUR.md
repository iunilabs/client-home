# Recorrido móvil: selección, tarjetas y logos

Recorrido configurado: **Puntoes → BBVA → Naturgy → Banco Sabadell → obra**. Esta configuración se aplica a anchuras inferiores a 700 px. El ordenador conserva la ciudad explorable y sus fichas modales.

## Cambiar las empresas y su orden

Editar únicamente `mobileTourOrder` en [mobile-tour-config.js](mobile-tour-config.js):

```js
export const mobileTourOrder = ['bbva', 'naturgy', 'sabadell', 'collaborate'];
```

La entrada en Puntoes es independiente de esa lista: no añadir `puntoes`. `collaborate` representa la obra y puede conservarse al final, moverse o retirarse. No es una empresa del carrusel. La numeración y los destinos de los controles se recalculan automáticamente; la transición desde la mano no cambia.

Identificadores disponibles:

| Identificador | Empresa / destino |
| --- | --- |
| `accenture` | Accenture |
| `bbva` | BBVA |
| `canal` | Canal de Isabel II |
| `cepsa` | Cepsa |
| `mapfre` | MAPFRE |
| `mediaset` | Mediaset |
| `ree` | Red Eléctrica |
| `siemens` | Siemens |
| `naturgy` | Naturgy |
| `sabadell` | Banco Sabadell |
| `collaborate` | Obra / «¿Quieres colaborar?» |

Usar identificadores válidos, una sola vez cada uno. Por ejemplo, `['bbva', 'cepsa', 'mediaset', 'collaborate']` sustituye las tres empresas manteniendo la obra. **La lista no filtra el carrusel**: los diez clientes siguen disponibles y tienen su propia tarjeta aunque se excluyan del recorrido.

## Cursor, gestos y cámara

El cursor móvil es explícito y no se calcula a partir de coordenadas de scroll. La entrada desde las manos conserva sus anclas; el tramo de ciudad es un ancla de capítulo compacta. La rueda o el touch que cruza la entrada termina en Puntoes (o en colaboración al volver desde la sección 3). Su cola no avanza edificios. Un gesto vertical deliberado de al menos 60 px avanza una parada. Se descartan swipes cortos, diagonales/horizontales, multitouch y gestos que empiezan junto al borde de la pantalla.

Una ráfaga de rueda acumula 60 px normalizados y acepta una sola parada. Todos los eventos siguientes pertenecen a la misma ráfaga hasta 240 ms de silencio, aunque la cámara ya haya llegado. Una cola decreciente o de amplitud residual sigue vinculada durante pausas de hasta 900 ms para tolerar eventos demorados por el pintado; una subida deliberada, un cambio de dirección o una liberación más larga inicia otra ráfaga. No se acepta otro paso durante una transición. Los controles persistentes «Anterior» y «Siguiente» muestran sus destinos, funcionan con teclado y permiten salir en los extremos. Anterior desde Puntoes vuelve al encuentro completo, en el ancla original de las manos. El contador de coordenadas de scroll se oculta solo en la ciudad móvil; la numeración de tarjeta y los destinos visibles describen el cursor. ArrowUp/Down, PageUp/Down y espacio funcionan sobre la escena; Tab conserva su función nativa; Home y End sincronizan el salto al inicio/final del documento con Lenis para evitar que un elemento fijo enfocado atrape esas teclas.

`mobileTourTiming.logoTravel` controla el viaje en milisegundos (1050); `logoCardUntil` controla la entrada de tarjeta (650). La curva de cámara tiene velocidad y aceleración nulas en los extremos. La tarjeta del destino comienza durante el viaje. Solo un artículo es visible/focusable; se reutilizan los once artículos existentes, sin una pila de textos. `prefers-reduced-motion` coloca la cámara directamente en destino y abrevia el fundido a 100 ms, mediante la preferencia local de ciudad; las manos no se modifican.

## Lectura y visitas manuales

La tarjeta completa tiene scroll propio y contención de overscroll. Abrir «Ver más» bloquea los gestos del recorrido también fuera del texto del relato. Leer, arrastrar desde el encabezado o llegar al final del contenido mantiene el edificio y el detalle abierto. Cerrar el detalle permite continuar; un control explícito o un logo puede cambiar de visita y cerrar la lectura.

Los diez logos permanecen en el carrusel, que conserva su swipe horizontal, tap y navegación de teclado. Un logo de la ruta confirma su cursor; un cliente externo cambia la cámara y la tarjeta conservando los destinos pendientes de ese cursor:

| Visita externa desde | Anterior | Siguiente |
| --- | --- | --- |
| Puntoes | El encuentro (sección 1) | BBVA |
| BBVA | Puntoes | Naturgy |
| Naturgy | BBVA | Banco Sabadell |
| Banco Sabadell | Naturgy | Colaboración |
| Colaboración | Banco Sabadell | Lo que hacemos posible (sección 3) |

Así, BBVA → Cepsa → siguiente visita Naturgy; colaboración → Cepsa → siguiente sale directamente. Ninguna coordenada recupera la tarjeta anterior. Una nueva selección parte de la cámara renderizada, incluso durante otra visita manual. Los links de capítulo y el historial reinician explícitamente la entrada; el regreso por scroll desde la sección 3 empieza en colaboración.

`__puntoes.getState().city.tour` expone `currentId`, `guidedCursor`, `nextId`, `previousId`, `transition`, `reading` y `active`. Los datasets `cityStop`, `cityCard`, `cityCursor`, `cityNext`, `cityTransition` y `cityReading` describen la misma visita. La tarjeta actual conserva `.is-current`. Lenis sincroniza las anclas de entrada/salida; no controla destinos del cursor. Mientras el cursor está activo, `anchorScroll` reconcilia cualquier delta de scroll nativo con el ancla antes de evaluar los límites, incluso si la entrada táctil ya había iniciado el desplazamiento del navegador. Las salidas explícitas y los resets de enlaces/historial liberan la sujeción; fuera de la ciudad se conserva el scroll nativo.

## Movimiento opcional del mapa

El control «Activar movimiento» aparece solo en móvil compatible, con contexto seguro y sin preferencia de movimiento reducido. Se pide permiso dentro del toque si existe `DeviceOrientationEvent.requestPermission`; en los demás navegadores la activación habilita la escucha sin solicitud. Denegación y errores muestran un estado persistente y permiten reintentar. Sin API, permiso o lecturas válidas se conserva la navegación normal.

«Recentrar» calibra la próxima lectura como neutral y «Desactivar movimiento» retira los listeners. `city-perspective.js` normaliza beta/gamma, remapea la orientación de pantalla y limita cada eje a ±2 unidades angulares. En `city.js`, gamma remapeado produce traslación horizontal y beta remapeado, vertical, con signo positivo del eje remapeado hacia derecha/abajo (beta físico positivo se remapea a vertical negativo). La amplitud por unidad es `.008 × min(anchoViewport, altoViewport)`; el desplazamiento máximo de cada eje es el doble (1,6 % del lado menor), dentro de la reserva de encuadre de 2,5 %. Solo se transforma `.city-world`, que contiene mapa, detalle, puntos y agua. Copy, control, tarjetas y logos quedan fijos.

El sensor se pausa durante el viaje, al ocultarse la página y fuera de la ciudad; al reanudarse recalibra con la primera muestra. Movimiento reducido devuelve los offsets a cero y oculta el control. La rotación de pantalla también recalibra. El contador de scroll permanece disponible en sección 1 y escritorio, y se oculta en la ciudad móvil. Los mensajes del control solo modifican el DOM cuando cambia su valor. Permisos, orientación y estabilidad se verifican con simulación; sensor y rendimiento físicos siguen sin verificar.

## Encuadres y nitidez

`mobileTourBuildings` y `mobileTourHub` calibran centro, tamaño y puntos en porcentajes del retrato V13 de 941 × 1672. `size` debe abarcar la arquitectura completa, incluida la antena de Mediaset y la grúa de la obra. Cambiar únicamente el orden no requiere tocar esas coordenadas.

[city-detail.js](city-detail.js) permite sumar capas nativas de mayor detalle a rectángulos concretos del mapa. Cada `rect` usa píxeles del V13 original: `[izquierda, arriba, ancho, alto]`. Se cargan el destino actual y el siguiente; el ordenador no descarga estos recursos. Los bordes se mezclan con la imagen base y el detalle entra gradualmente con el zoom y la carga, sin reemplazar el mapa en un solo fotograma.

La imagen global conserva su resolución nativa. Las capas añaden detalle generado localmente; no constituyen una reproducción arquitectónica comprobada ni un reescalado anunciado como 4K. Al cambiar las tres empresas, revisar si los nuevos destinos tienen capa de detalle: la navegación funciona en cualquier caso con V13, pero los destinos sin capa conservan su nitidez original. Sus dimensiones, prompts exactos y procedencia se documentan en [assets/README.md](assets/README.md).

## Comprobaciones al modificar la lista

Ejecutar `npm test`, `npm run build -- --base=/client-home/` y, con la compilación servida en 4303, `PUNTOES_URL=http://127.0.0.1:4303/client-home/ node tests/mobile-navigation.mjs` , `node tests/mobile-motion.mjs` y `node tests/mobile-entry.mjs`. El harness de navegador admite `PUNTOES_URL`, `PUNTOES_EVIDENCE_DIR` y `CHROME_PATH`. Revisar en 320 × 568, 390 × 844 y 430 × 932: entrada desde Puntoes, encuadre de cada parada, tarjeta durante el viaje, scroll inverso, toque de un logo excluido y recuperación de uno ya visto. Comprobar que sigue habiendo diez logos y once tarjetas únicas, que la obra conserva «Hablemos», que no abre un modal móvil y que el footer no tapa las tarjetas.
