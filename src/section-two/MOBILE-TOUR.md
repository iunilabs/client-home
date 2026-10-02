# Recorrido móvil: selección, tarjetas y logos

Estado aprobado el 1 de octubre de 2026: **Puntoes → BBVA → Naturgy → Banco Sabadell → obra**. Esta configuración se aplica a anchuras inferiores a 700 px. El ordenador conserva la ciudad explorable y sus fichas modales.

## Cambiar las empresas y su orden

Editar únicamente `mobileTourOrder` en [mobile-tour-config.js](mobile-tour-config.js):

```js
export const mobileTourOrder = ['bbva', 'naturgy', 'sabadell', 'collaborate'];
```

La entrada en Puntoes es independiente de esa lista: no añadir `puntoes`. `collaborate` representa la obra y puede conservarse al final, moverse o retirarse. No es una empresa del carrusel. La duración de la sección y la numeración de las tarjetas se recalculan automáticamente; la transición desde la mano no cambia.

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

## Entrada de tarjetas y movimiento de cámara

`mobileTourTiming`, en el mismo archivo, controla la coreografía. `intro`, `stop` y `outro` se miden en alturas de pantalla. Cada parada ocupa `1.45` pantallas de scroll; la primera pausa en Puntoes ocupa `0.8`.

`travelUntil: .42` significa que la cámara termina su viaje al 42 % del tramo. `cardFrom: .04` y `cardUntil: .48` hacen que la tarjeta comience poco después de arrancar el mapa y termine de entrar al 48 %. Para una pantalla de 844 px, comienza tras unos 49 px de scroll dentro del tramo. La aceleración y el frenado usan una curva con velocidad y aceleración nulas en los extremos.

Las tarjetas anteriores permanecen debajo. Su separación visual se limita a cuatro niveles, 28 px y menos de 1.2 grados, para que no invadan el encuadre. Hay una sola tarjeta DOM por empresa; el contenido procede de [case-studies.js](case-studies.js), también usado en las fichas de escritorio. Al abrir «Ver más», la tarjeta completa tiene scroll nativo propio para leer también desde su encabezado, sin perder la empresa elegida. Al cerrarla, vuelve a acompañar el scroll de la página. Un gesto sobre el mapa siempre sigue el recorrido.

El recorrido está ligado a la distancia real de scroll: no captura gestos para convertirlos en pasos ni añade botones «Anterior», «Siguiente» o de activación del movimiento. Tras la obra, el scroll continúa normalmente y la ciudad sale a la misma velocidad que entra el contenido siguiente. Nunca se ejecuta un salto programado a la sección 3 por un último swipe.

## Visitas desde el footer

El footer es transparente, con logos blancos de proporciones originales. Avanza despacio y permite desplazarse horizontalmente con el dedo; una intención vertical conserva el scroll de la página. El teclado puede recorrer todos los botones y pausa el avance automático.

Tocar un logo lleva la cámara desde su posición visible al edificio en `logoTravel: 1250` ms. La tarjeta comienza a entrar a los `logoCardFrom: 80` ms y termina a los `logoCardUntil: 650` ms. Si ya había aparecido, la misma tarjeta vuelve a lo alto de la pila con un fundido, conservando las demás; no se crean duplicados.

Si el cliente pertenece al recorrido, Lenis sitúa el scroll en el tramo correspondiente mientras la cámara realiza su viaje independiente. Al continuar bajando, se visita la siguiente parada de la lista. Si el cliente está fuera de la lista, se conserva el scroll; el siguiente desplazamiento vertical retoma el recorrido mediante una transición desde la cámara visible. La recuperación manual conserva el historial de tarjetas. Si se avanza desde la introducción tras visitar un logo, la tarjeta permanece mientras se retoma el recorrido. Al retroceder a Puntoes, la pila se retira suavemente desde su opacidad visible; solo se vacía cuando ya es invisible. Se desactiva el foco antes de llegar a ese punto. Un regreso rápido no presenta fugazmente tarjetas de edificios intermedios. Sin visitas manuales, subir el scroll invierte el recorrido normal.

La unión con Lenis está en el callback `onNavigate` de `main.js`: solo sincroniza el scroll y su progreso visual para evitar que el suavizado anterior cancele la visita recién solicitada. No cambia las poses ni los tiempos de la mano.

## Encuadres y nitidez

`mobileTourBuildings` y `mobileTourHub` calibran centro, tamaño y puntos en porcentajes del retrato V13 de 941 × 1672. `size` debe abarcar la arquitectura completa, incluida la antena de Mediaset y la grúa de la obra. Cambiar únicamente el orden no requiere tocar esas coordenadas.

[city-detail.js](city-detail.js) permite sumar capas nativas de mayor detalle a rectángulos concretos del mapa. Cada `rect` usa píxeles del V13 original: `[izquierda, arriba, ancho, alto]`. Se cargan el destino actual y el siguiente; el ordenador no descarga estos recursos. Los bordes se mezclan con la imagen base y el detalle entra gradualmente con el zoom y la carga, sin reemplazar el mapa en un solo fotograma.

La imagen global conserva su resolución nativa. Las capas añaden detalle generado localmente; no constituyen una reproducción arquitectónica comprobada ni un reescalado anunciado como 4K. Al cambiar las tres empresas, revisar si los nuevos destinos tienen capa de detalle: la navegación funciona en cualquier caso con V13, pero los destinos sin capa conservan su nitidez original. Sus dimensiones, prompts exactos y procedencia se documentan en [assets/README.md](assets/README.md).

## Comprobaciones al modificar la lista

Ejecutar `npm test`, `npm run build -- --base=/client-home/` y `npm run test:mobile-scroll` con la web local abierta en 4180 (o indicar `MOBILE_SCROLL_URL`). La prueba de navegador utiliza touch nativo en 320 × 568, 390 × 844 y 430 × 932: movimiento continuo del mapa, tarjetas apiladas, recuperación por logo, lectura desde el encabezado y salida proporcional al último swipe. Revisar también entrada desde Puntoes, encuadre de cada parada, tarjeta durante el viaje y scroll inverso. Comprobar que sigue habiendo diez logos y once tarjetas únicas, que la obra conserva «Hablemos», que no abre un modal móvil y que el footer no tapa las tarjetas.
