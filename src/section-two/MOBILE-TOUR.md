# Recorrido móvil: gestos, tarjetas y logos

Recorrido móvil del 2 de octubre de 2026, actualizado tras la elección manual de clientes. A anchuras inferiores a 700 px se mantiene el itinerario configurado **Puntoes → BBVA → Naturgy → Banco Sabadell → obra**. Los diez clientes siguen disponibles en el carrusel, con una tarjeta por empresa y otra de colaboración. El ordenador conserva su ciudad explorable y sus fichas modales.

## Un gesto, una parada

La entrada desde la mano conserva los puntos de revelado anteriores. Al llegar a Puntoes se captura un único anclaje del documento, `geometry.revealed`. La entrada larga consume su gesto completo: ni el resto del movimiento ni su inercia visitan BBVA. `anchorScroll` reconcilia el desplazamiento del compositor con Lenis antes de renderizar. No hay pantallas vacías entre edificios: la altura móvil contiene solo la entrada y una pantalla de salida.

Un nuevo swipe vertical de al menos 60 px solicita una parada. La dirección se reconoce desde 10 px acumulados y exige una componente vertical superior a 1.4 veces la horizontal. Se cuentan desplazamientos acumulados, incluidos movimientos lentos con muestras de 3 px. Taps, horizontales y diagonales no navegan. Una dirección ambigua se conserva hasta levantar el dedo. El gesto sobre una tarjeta también puede navegar; sus enlaces conservan el comportamiento normal del navegador. No hay botones de recorrido ni de sensor.

La cámara viaja por tiempo, no por scroll, con aceleración y frenado suaves. En `mobileTourTiming`, `logoTravel: 1850` ms es el mínimo: la distancia añade `travelPerScreen: 450` ms por diagonal de pantalla, con un máximo de `maxTravel: 2800` ms. Durante el recorrido, la cámara se abre entre un 16 % y un 28 % respecto al menor zoom de los extremos, para mostrar las calles; al llegar recupera exactamente el encuadre aceptado. El gesto de zoom y el desplazamiento usan la misma curva continua. `cruisePullback`, `pullbackPerScreen` y `maxPullback` permiten ajustar esa apertura sin cambiar posiciones. La tarjeta empieza a los 80 ms y termina de entrar a los 650 ms. Un gesto iniciado durante un viaje se consume completo, aunque la cámara llegue antes de que se levante el dedo. Un burst de rueda solicita como máximo una parada; las colas decrecientes extienden el bloqueo incluso con pausas entre muestras. La rueda horizontal queda fuera de la navegación vertical.

Al llegar a la obra, el gesto que la solicitó sigue consumido. **Solo un nuevo gesto hacia delante libera el documento**. Se comprueba el límite antes de cancelar un movimiento vertical, de modo que Chrome conserva su scroll nativo desde el principio del gesto. `release` no escribe scroll ni salta a sección 3. La escena sale una cantidad igual al desplazamiento real del documento. Un gesto inverso vuelve a capturar la última parada al cruzar el anclaje. En Puntoes, un nuevo gesto inverso libera de la misma forma la vuelta a sección 1.

## Tarjetas y destinos futuros

Once artículos únicos forman una pila con alturas iguales y fondos opacos; solo la tarjeta activa permite foco y enlaces. Las anteriores quedan debajo, con un máximo de cuatro escalones visibles. Repetir una visita recupera el mismo artículo. La tarjeta ocupa 320 px en pantallas normales y 256 px en pantallas de altura máxima de 650 px. Los resúmenes se limitan a tres líneas con elipsis; los títulos a dos. No hay scroll de lectura, `details`, relato desplegable ni modal móvil. La franja inferior de logos queda libre incluso a 320 × 568.

El contenido breve existente procede de `case-studies.js`; las empresas conservan el aviso «Caso ilustrativo · texto de muestra». No se añaden relatos reales. Colaboración conserva su enlace externo «Hablemos».

«Ver más» es un enlace normal a `${import.meta.env.BASE_URL}clientes/<id>/`. En el build con `--base=/client-home/`, los destinos futuros son:

| Cliente | Destino reservado |
| --- | --- |
| Accenture | `/client-home/clientes/accenture/` |
| BBVA | `/client-home/clientes/bbva/` |
| Canal de Isabel II | `/client-home/clientes/canal/` |
| Cepsa | `/client-home/clientes/cepsa/` |
| MAPFRE | `/client-home/clientes/mapfre/` |
| Mediaset | `/client-home/clientes/mediaset/` |
| Red Eléctrica | `/client-home/clientes/ree/` |
| Siemens | `/client-home/clientes/siemens/` |
| Naturgy | `/client-home/clientes/naturgy/` |
| Banco Sabadell | `/client-home/clientes/sabadell/` |

Estas páginas **todavía no existen**. Este cambio reserva sus URLs; no crea páginas ni intercepta enlaces con contenido sustituto. La prueba de navegador sustituye únicamente la respuesta de red de Sabadell para comprobar una navegación real sin depender de una futura página.

## Carrusel, teclado y cambios de pantalla

Se conserva el contrato de `createCityCarousel`: callbacks `onSelect`, `onOpen`, y métodos `select`, `update`, `load`, `setModal`, `logoFor`. El carrusel añade arrastre horizontal con inercia, aceleración y frenado en `carousel-motion.js`; reanuda su avance automático dos segundos después de soltar el dedo. La interacción horizontal sigue siendo local al carrusel y no avanza edificios. El teclado mantiene todos los clientes accesibles y pausa el avance mientras conserva el foco. Los diez logos mantienen su estilo blanco y footer transparente.

Seleccionar cualquiera de los diez logos cancela todas las empresas pendientes del itinerario normal, incluso si se toca la empresa ya enfocada. La secuencia restante pasa a ser **cliente elegido → colaboración → nuevo gesto de salida nativa**. Cambiar de logo reemplaza la elección y mantiene pendiente solo colaboración. La cámara y la tarjeta seleccionadas permanecen hasta un nuevo gesto, que viaja directamente a la obra. No se desplaza el documento al seleccionar logos.

La reversa desde la obra vuelve al cliente elegido, luego a Puntoes; avanzar otra vez repite solo ese cliente y la obra. Volver desde la salida nativa conserva esa elección y no recupera empresas canceladas. Una nueva entrada hacia delante desde sección 1 o un recorrido reiniciado por navegación explícita restablece BBVA → Naturgy → Sabadell → obra. Las tarjetas conservan su pila e historial único; la numeración de cliente elegido y obra cambia a `01 / 02` y `02 / 02` en el recorrido manual.

Tab y Enter mantienen el foco y activación normales de enlaces y logos. Las flechas verticales, PageUp/PageDown y espacio solicitan una parada cuando el foco no está en un control; se ignora la repetición automática. Home/End permiten abandonar el recorrido y sincronizan Lenis. Los enlaces de capítulos suspenden el anclaje antes de navegar; el enlace a confianza reinicia en Puntoes. Los cambios pequeños de altura conservan el anclaje para tolerar la barra de URL; cambios superiores al 20 % o de anchura lo recalculan sin perder la parada. El enlace a confianza usa ese mismo anclaje. Al cruzar 700 px se restablece la navegación de escritorio, y regresar a móvil reinicia su cursor.

## Configuración y arte

Editar solo `mobileTourOrder` en `mobile-tour-config.js` para cambiar la selección u orden de paradas. No incluir `puntoes`; no repetir identificadores. La lista no filtra clientes ni tarjetas. `collaborate` representa la obra. `mobileTourBuildings` y `mobileTourHub` conservan coordenadas y encuadres del retrato V13. Las doce sedes tienen una capa móvil V14 nativa: se conservan las cinco anteriores y se añaden las siete restantes. [Recursos y procedencia](assets/README.md) documenta los archivos, recortes, dimensiones y prompts. `city-detail.js` carga destino actual y próximo y conserva V13 como fallback. Las manos tampoco cambian. La ciudad consulta localmente `prefers-reduced-motion`: acorta sus viajes y llegada de tarjetas a 100 ms, conservando gestos y selección manual; no altera la preferencia de animación de la experiencia de manos.

## Validación

Ejecutar `npm test`, `npm run build -- --base=/client-home/` y `npm run test:mobile-scroll`. El navegador usa Chrome con CDP `Input.dispatchTouchEvent` en 320 × 568, 390 × 844 y 430 × 932. Por defecto visita `http://127.0.0.1:4304/`; `MOBILE_SCROLL_URL` permite usar el preview con su base `/client-home/`. Capturas y reporte se guardan en `docs/mobile-snap-2026-10-02` (ignorado en Git).

La regresión rápida `MOBILE_SCROLL_URL=http://127.0.0.1:4314/client-home/ node tests/mobile-access.mjs` comprueba en el último build el fragmento en frío, movimiento normal/reducido, Cepsa, enlaces después de reducir la altura y Atrás/Adelante.

La prueba comprueba gestos lentos, largos, diagonales, horizontales y taps; mapa animado con documento fijo; residuos de rueda; swipe sobre tarjeta; salida proporcional e inversa; Cepsa y todas las empresas; artículos únicos y sus medidas; enlaces reales; entrada larga; carrusel horizontal; teclado; altura, escritorio/móvil y enlaces de capítulos. Los tests unitarios comprueban el estado y los límites sin depender del navegador. Chrome emulado no sustituye una prueba física de Safari/iOS, barra de URL dinámica ni gestos del sistema.

La regresión de este contrato es `MOBILE_SCROLL_URL=http://127.0.0.1:4314/client-home/ node tests/mobile-manual.mjs`. Comprueba los diez logos desde Puntoes y etapas del itinerario, BBVA ya enfocado, cambio Cepsa → Naturgy, reversa sin empresas intermedias y salida nativa breve.
