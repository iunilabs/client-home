# Recorrido móvil: gestos, tarjetas y logos

Recorrido móvil del 2 de octubre de 2026, actualizado tras la elección manual de clientes. A anchuras inferiores a 700 px se mantiene el itinerario configurado **Puntoes → BBVA → Naturgy → Banco Sabadell → obra**. Los trece clientes siguen disponibles en el carrusel, con una tarjeta por empresa y otra de colaboración. El ordenador conserva su ciudad explorable y sus fichas modales.

## Un gesto, una parada

Tras la salida de las manos, el texto azul «La confianza se construye» empieza a entrar a 850 px del inicio de la transición y queda centrado. Sale antes de que el mapa empiece a aparecer a 1650 px. En ordenador, el alejamiento empieza con esa aparición; la altura mínima de la sección permite completar la entrada también en pantallas horizontales cortas. Al llegar a Puntoes en móvil se captura un único anclaje del documento, `geometry.revealed`. La entrada larga consume su gesto completo: ni el resto del movimiento ni su inercia visitan BBVA. Antes del gesto, `createMobileScrollBoundary` limita el rango nativo mediante el flujo de `main`: sitúa la sección 3 en su extremo, fuera del flujo y dentro del recorte, y retira temporalmente el footer. Así el compositor tampoco puede cruzar el anclaje mientras JavaScript está ocupado. El layout mantiene las posiciones de los destinos y se adapta a la altura de pantalla; al llegar a la obra, navegar explícitamente o pasar a escritorio se restauran los estilos originales y se actualizan inmediatamente las dimensiones de Lenis. El bloqueo temporal de `overflow` mantiene la parada y `anchorScroll` reconcilia el desplazamiento antes y después de actualizar Lenis. No hay pantallas vacías entre edificios: la altura móvil contiene solo la entrada y una pantalla de salida.

El acercamiento móvil pasa de zoom `1.5` al encuadre de Puntoes, adaptado a la pantalla, con la misma curva tanto en movimiento normal como reducido del sistema. Si un swipe rápido captura el anclaje antes de completar el acercamiento, la cámara continúa desde su posición visible hacia Puntoes, sin abrirse ni saltar al zoom final. Una entrada directa por capítulo o fragmento también empieza desde la vista general. El zoom restante dura como máximo `logoTravel` y se acorta según lo ya mostrado; empieza cuando el mapa está listo y se pausa si vuelve a estar pendiente su imagen. Si la imagen termina de cargar antes del anclaje pero con el scroll ya avanzado, su primer frame visible sigue en `1.5` y recupera suavemente el encuadre correspondiente al scroll, sin bloquear el documento. Un contacto nuevo puede avanzar inmediatamente hacia un cliente durante este acercamiento. Tras salir por arriba y dejar atrás el mapa, la siguiente entrada recupera su zoom progresivo.

La oficina móvil utiliza el mismo tile Puntoes desde el primer frame hasta el encuadre cercano, a opacidad 1. Se prepara y decodifica antes de revelar el mapa para que las columnas y la fachada no cambien entre dos imágenes. Las demás sedes mantienen su carga por visita y sus fundidos.

Un nuevo swipe vertical de al menos 60 px solicita una parada. La dirección se reconoce desde 10 px acumulados y exige una componente vertical superior a 1.4 veces la horizontal. Se cuentan desplazamientos acumulados, incluidos movimientos lentos con muestras de 3 px. Taps, horizontales y diagonales no navegan. Una dirección ambigua se conserva hasta levantar el dedo. El gesto sobre una tarjeta también puede navegar; sus enlaces conservan el comportamiento normal del navegador. No hay botones de recorrido ni de sensor.

La cámara viaja por tiempo, no por scroll, con aceleración y frenado suaves. En `mobileTourTiming`, `logoTravel: 1400` ms es el mínimo: la distancia añade `travelPerScreen: 340` ms por diagonal de pantalla, con un máximo de `maxTravel: 2100` ms. Durante el recorrido, la cámara se abre entre un 16 % y un 28 % respecto al menor zoom de los extremos, para mostrar las calles; al llegar recupera exactamente el encuadre aceptado. El gesto de zoom y el desplazamiento usan la misma curva continua. `cruisePullback`, `pullbackPerScreen` y `maxPullback` permiten ajustar esa apertura sin cambiar posiciones. La tarjeta empieza a los 80 ms y termina de entrar a los 650 ms. Cada contacto solicita como máximo una parada. Un contacto nuevo durante el viaje cambia el destino inmediatamente desde la cámara visible; no espera a la llegada. El resto del mismo gesto sigue consumido. Un burst de rueda solicita como máximo una parada; las colas decrecientes extienden el bloqueo incluso con pausas entre muestras. La rueda horizontal queda fuera de la navegación vertical.

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

Se conserva el contrato de `createCityCarousel`: callbacks `onSelect`, `onOpen`, y métodos `select`, `update`, `load`, `setModal`, `logoFor`. El carrusel añade arrastre horizontal con inercia, aceleración y frenado en `carousel-motion.js`; reanuda su avance automático dos segundos después de soltar el dedo. En móvil, el avance suave continúa también con movimiento reducido del sistema; esa preferencia elimina la inercia al soltar, sin inmovilizar los logos. Escritorio conserva su pausa por movimiento reducido. Los finales de contacto se observan también en captura global para que el último dedo fuera del carrusel no deje una pausa permanente tras un gesto con dos dedos. La interacción horizontal sigue siendo local al carrusel y no avanza edificios. El teclado mantiene todos los clientes accesibles y pausa el avance mientras conserva el foco. Los diez logos mantienen su estilo blanco y footer transparente.

Seleccionar cualquiera de los diez logos cancela todas las empresas pendientes del itinerario normal, incluso si se toca la empresa ya enfocada. La secuencia restante pasa a ser **cliente elegido → colaboración pendiente → nuevo gesto de salida nativa**. Cambiar de logo reemplaza la elección y mantiene pendiente solo colaboración si aún no han llegado su edificio y su tarjeta. Tras ver «Hablemos», elegir otro cliente deja cliente elegido → salida nativa, incluso durante el viaje de cámara. La memoria dura hasta recargar la página y sobrevive a reversas, capítulos y cambios de tamaño. La cámara y la tarjeta seleccionadas permanecen hasta un nuevo gesto, que viaja directamente a la obra. No se desplaza el documento al seleccionar logos.

La reversa desde la obra vuelve al cliente elegido, luego a Puntoes. Una vez vistos el edificio y «Hablemos», avanzar desde el último cliente libera el documento sin repetir la obra; esto también se aplica a la reversa del recorrido guiado. Volver desde la salida nativa conserva esa elección y no recupera empresas canceladas. Una nueva entrada hacia delante desde sección 1 o un recorrido reiniciado por navegación explícita restablece BBVA → Naturgy → Sabadell y omite la obra si ya se presentó. Las tarjetas conservan artículos únicos, pero la pila visible se limpia al volver a Puntoes. Al salir del hub solo aparece la tarjeta entrante; durante un viaje se usan únicamente la entrante y la saliente realmente presentada. La numeración se calcula con las paradas pendientes: `01 / 01` si la obra ya se vio; `01 / 02` y `02 / 02` si sigue pendiente.

Tab y Enter mantienen el foco y activación normales de enlaces y logos. Las flechas verticales, PageUp/PageDown y espacio solicitan una parada cuando el foco no está en un control; se ignora la repetición automática. Home/End y Cmd+Arriba/Abajo permiten abandonar el recorrido, liberan el bloqueo y sincronizan Lenis. Los enlaces de capítulos suspenden el anclaje antes de navegar; el enlace a confianza reinicia en Puntoes en móvil y muestra el texto de entrada en ordenador. Los cambios pequeños de altura conservan el anclaje para tolerar la barra de URL y reservan la altura de la pantalla actual para la salida; cambios superiores al 20 % o de anchura lo recalculan sin perder la parada. Al cruzar 700 px se restablece la navegación de escritorio, y regresar a móvil reinicia su cursor.

En ordenador, pulsar un logo o un marcador muestra la misma tarjeta resumida del móvil, sin diálogo modal. La cámara desplaza el mapa para centrar el tejado en el espacio libre a la derecha de la tarjeta, hasta donde permite la cobertura de la imagen; seleccionar un cliente no aumenta el zoom. La escala sigue dependiendo del scroll. Cambiar de cliente parte del encuadre visible; cerrar con el botón o Escape recupera el desplazamiento previo y el zoom general. La tarjeta deja libre la fila de logos y el mapa puede arrastrarse después del desplazamiento. Movimiento reducido aplica el encuadre directamente.

En ordenador, el scroll es libre durante toda la sección y al cruzar hacia la sección 3, también con una tarjeta abierta. No hay captura de ráfagas ni bloqueo del documento. El anclaje y la salida con un gesto nuevo se conservan exclusivamente en móvil.

## Configuración y arte

Editar solo `mobileTourOrder` en `mobile-tour-config.js` para cambiar la selección u orden de paradas. No incluir `puntoes`; no repetir identificadores. La lista no filtra clientes ni tarjetas. `collaborate` representa la obra. `mobileTourBuildings` y `mobileTourHub` conservan coordenadas y encuadres del retrato V13. Las doce sedes tienen una capa móvil V14 nativa: se conservan las cinco anteriores y se añaden las siete restantes. [Recursos y procedencia](assets/README.md) documenta los archivos, recortes, dimensiones y prompts. `city-detail.js` carga destino actual y próximo y conserva V13 como fallback. Las manos tampoco cambian. La ciudad consulta localmente `prefers-reduced-motion` para los efectos ambientales. El acercamiento móvil y el recorrido guiado conservan su zoom suave con ambas preferencias; los viajes entre edificios mantienen el perfil de 1400–2100 ms y la entrada de tarjeta de 80–650 ms. La preferencia del teléfono no debe convertir el acercamiento ni el desplazamiento en un salto. Las posiciones finales, los gestos, la selección manual y la experiencia de manos se mantienen.

## Validación

Ejecutar `npm test`, `npm run build -- --base=/client-home/` y `npm run test:mobile-scroll`. El navegador usa Chrome con CDP `Input.dispatchTouchEvent` en 320 × 568, 390 × 844 y 430 × 932. Por defecto visita `http://127.0.0.1:4304/`; `MOBILE_SCROLL_URL` permite usar el preview con su base `/client-home/`. Capturas y reporte se guardan en `docs/mobile-snap-2026-10-02` (ignorado en Git).

La regresión rápida `MOBILE_SCROLL_URL=http://127.0.0.1:4314/client-home/ node tests/mobile-access.mjs` comprueba en el último build el fragmento en frío, movimiento normal/reducido, Cepsa, enlaces después de reducir la altura y Atrás/Adelante.

La prueba comprueba gestos lentos, largos, diagonales, horizontales y taps; mapa animado con documento fijo; residuos de rueda; swipe sobre tarjeta; salida proporcional e inversa; Cepsa y todas las empresas; artículos únicos y sus medidas; enlaces reales; entrada larga; carrusel horizontal; teclado; altura, escritorio/móvil y enlaces de capítulos. Los tests unitarios comprueban el estado y los límites sin depender del navegador. Chrome emulado no sustituye una prueba física de Safari/iOS, barra de URL dinámica ni gestos del sistema.

La regresión de este contrato es `MOBILE_SCROLL_URL=http://127.0.0.1:4314/client-home/ node tests/mobile-manual.mjs`. Comprueba los diez logos desde Puntoes y etapas del itinerario, BBVA ya enfocado, cambio Cepsa → Naturgy, reversa sin empresas intermedias y salida nativa breve.

`SCROLL_GUARD_URL=http://127.0.0.1:4310/client-home/ node tests/scroll-guard.mjs` comprueba la entrada fuerte, la salida con un gesto nuevo, el scroll libre de escritorio con rueda, navegación programática y teclado sobre el preview compilado.

La regresión `node tests/mobile-section-two-regression.mjs` comprueba gestos rápidos durante viajes, reversa al hub, ausencia de Naturgy al entrar BBVA, CTA una vez y salida nativa anticipada. Chromium usa input CDP nativo; WebKit usa eventos simulados sobre los handlers táctiles para los swipes y taps nativos, sin afirmar arbitraje táctil físico. Configurar `MOBILE_SECTION_TWO_URL`, `MOBILE_SECTION_TWO_OUT` y opcionalmente `MOBILE_SECTION_TWO_WEBKIT` para el ejecutable WebKit instalado.

`node tests/city-carousel-autoplay.mjs` comprueba avance automático con ambas preferencias, liberación tras contactos que terminan fuera y regreso de segundo plano en Chrome y WebKit. Configurar `CITY_CAROUSEL_URL`, `CITY_CAROUSEL_AUTOPLAY_OUT` y `CITY_CAROUSEL_WEBKIT_PATH` para el preview y runtime local; `CITY_CAROUSEL_EXPECT_FIXED=0` conserva el modo de diagnóstico de una versión anterior. Chrome utiliza gestos CDP reales; WebKit comprueba swipes mediante eventos simulados.

`node tests/mobile-office-zoom.mjs` comprueba la oficina a distintas escalas, el primer frame con carga lenta antes del anclaje, el zoom con ambas preferencias, la captura rápida desde la cámara visible y el respaldo si falla el tile. Configurar `MOBILE_OFFICE_URL`, `MOBILE_OFFICE_OUT` y `MOBILE_OFFICE_WEBKIT_PATH`. Las capturas verifican el encaje visual en Chrome y WebKit; los swipes de Chrome usan CDP y los de WebKit eventos simulados.

## Textos breves de las tarjetas

Los textos están en `case-studies.js`: título y resumen, cada uno de una o dos líneas a partir de 320 px. La caja usa altura natural y mínimo reducido; conserva la tipografía y no recorta el texto. No muestra avisos de contenido provisional.

Fuentes revisadas: [inicio y clientes](https://www.puntoes.es/), [quiénes somos](https://www.puntoes.es/quienes-somos/), [formación](https://www.puntoes.es/formacion/) y sus áreas de desarrollo, Agile, datos, Office y proyectos; [consultoría](https://www.puntoes.es/consultoria/), [conducción](https://www.puntoes.es/formacion/conduccion/) y [contacto](https://www.puntoes.es/contacto/). [BBVA](https://www.puntoes.es/bbva-customer-solutions/) publica colaboración desde 2009 y apoyo a la gestión de clientes. Para el resto de empresas listadas sin un caso detallado, los textos son frases generales sobre talento y tecnología, sin atribuir proyectos concretos. Sabadell procede de información directa del usuario: arquitectura front-end desde diciembre de 2025; se omiten los nombres de iniciativas por privacidad.

## Clientes añadidos desde la lista pública

Telefónica, Indra y Allianz están documentados en `tests/fixtures/additional-city-clients.json`, con sus denominaciones en puntoes.es y fuentes de logos. Se añaden en `city-clients.js` al mapa y carrusel, sin cambiar el itinerario automático. Para incluirlos en ese recorrido, editar únicamente `mobileTourOrder`. Sus tarjetas mantienen frases generales; no se atribuyen proyectos específicos.

Sus puntos usan edificios neutrales existentes, con coordenadas de escritorio en `city.js` y centros/encuadres móviles en `mobile-tour-config.js`. Los tres nuevos destinos muestran un barrio más amplio para evitar ampliar excesivamente la imagen base. No se presentan como reproducciones de sus sedes reales.
