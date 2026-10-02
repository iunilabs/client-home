# Auditoría de nitidez móvil V14 completa

2 de octubre de 2026. Checkout aislado `puntoes-city-detail-v2`, base `edd5f61957216b3b1f10315e0bc6a3f0998690f7`. Sin cambios en city.js, estilos, navegación, tarjetas, carrusel o manos; sin publicación ni push. El commit local se entrega congelado para un único integrador.

Doce destinos cubiertos: diez clientes + hub Puntoes + colaboración. Los siete pendientes usan el mismo flujo de recorte exacto → reconstrucción integrada image_gen → PNG nativo intacto → WebP q92. Las cinco texturas aprobadas están preservadas byte a byte y sus SHA se comprueban en la prueba dedicada.

## Cobertura y resolución real

El rectángulo usa `[x,y,ancho,alto]` en los 941 × 1672 píxeles de V13. Su SHA verificado es `fa4cd4f0979e35cae8e58361dd723fccd38062e3b509578be612bb4739651c35`. Las dimensiones siguientes son las recibidas del generador, sin resize, warp ni pintura.

| Destino | Rect V13 | Nativo | WebP bytes | Mediana registro px V13 | Nativo/píxel dispositivo DPR3 |
|---|---|---:|---:|---:|---:|
| puntoes | `[346, 418, 300, 532]` | 941 × 1670 | 591390 | 0.312 | 0.50 |
| bbva | `[332, 70, 280, 496]` | 942 × 1669 | 687164 | 0.382 | 0.58 |
| naturgy | `[297, 777, 280, 496]` | 942 × 1669 | 649394 | 0.432 | 0.66 |
| sabadell | `[72, 962, 280, 496]` | 943 × 1668 | 636300 | 0.414 | 0.68 |
| collaborate | `[0, 0, 252, 448]` | 941 × 1672 | 618044 | 0.301 | 0.64 |
| canal | `[155, 257, 140, 240]` | 958 × 1642 | 417268 | 0.814 | 1.02 |
| cepsa | `[654, 218, 140, 240]` | 958 × 1642 | 378088 | 1.078 | 1.33 |
| mapfre | `[711, 437, 220, 200]` | 1315 × 1196 | 438518 | 1.265 | 1.06 |
| ree | `[637, 700, 280, 280]` | 1254 × 1254 | 552006 | 0.328 | 0.80 |
| siemens | `[568, 937, 360, 320]` | 1330 × 1182 | 505548 | 0.426 | 0.96 |
| mediaset | `[73, 652, 280, 380]` | 1076 × 1461 | 485444 | 0.330 | 1.06 |
| accenture | `[45, 410, 290, 280]` | 1277 × 1232 | 454270 | 0.989 | 0.84 |

Total WebP: **6413434 bytes** (6,41 MB decimales), además de V13 (1023844 bytes). Los originales PNG, variantes descartadas, referencias y QA están en `docs/city-detail-v2/`, ignorados por Git. El bundle contiene doce WebP de detalle y **cero PNG maestros/QA**. Los originales del generador, SHA, bytes, dimensiones, escala y prompts están en `city-detail-provenance.json` y `PROMPTS-NITIDEZ-V14.md`.

Una relación inferior a 1 significa que el navegador interpola esa textura para ese DPR, especialmente las cinco capas anteriores. Esto es presentación de la salida nativa generada, no una ampliación ficticia usada como activo de detalle. No se promete 4K ni muestreo nativo completo a todos los DPR; se ha revisado la definición visual en el encuadre real.

## Registro, arquitectura y límites

Se inspeccionaron el máster, los doce recortes, las salidas nativas y las doce comparaciones a escala CSS del máximo encuadre 390 × 844. Las siete capas nuevas tienen medianas de desplazamiento de 0,33–1,26 px V13. SIFT/RANSAC se utiliza solo para medir: los WebP no reciben corrección geométrica ni interpolación. Los inliers no prueban por sí solos siluetas, antenas, tejados ni plantas; se cotejaron visualmente. MAPFRE es el registro nuevo menos preciso (p95 2,65 px V13); el borde suave reduce la unión visible y se conserva el encuadre/silueta corta. Los edificios siguen siendo miniaturas plausibles, no una certificación arquitectónica de las sedes reales.

La primera MAPFRE convirtió los huecos circulares en cuadrados y se descartó. La edición localizada restauró círculos, pero mantenía peor registro horizontal; se descartó también. La tercera salida regenerada desde V13 conserva círculos, altura corta y mejor registro y es la seleccionada. Se conservan los tres originales/hashes y prompts. La placa roja de Siemens ya existe en V13; recorte exacto `[699,1117,32,28]`. El coordinador confirmó esa evidencia y no se retocó Siemens.

## Capas, carga y fallback

Las doce capas son hijas del mismo mundo; ninguna introduce un transform propio. `z-index:2` del destino activo lo sitúa encima de todas las vecinas (`1`), independientemente del orden de carga/DOM. Las cotas calibradas del edificio completo quedan dentro de la meseta opaca; Accenture, MAPFRE y Siemens usan bordes adaptados a sus recortes compactos. El detalle entra gradualmente entre zoom 1,7 y 2,3 y tras la carga en 500 ms. Siemens alcanza opacidad 1 en el encuadre final ancho, en los tres móviles. El fallback conserva V13 y retira la imagen fallida, sin iniciar reintentos por fotograma.

| Escenario compilado | Descargas detalle |
|---|---:|
| Página inicial, cada móvil | 0 |
| Entrada al hub, cada móvil | 2 (Puntoes + BBVA) |
| Todas las doce visitas + retorno al hub | 12 únicas, sin repeticiones |
| Escritorio 1440 × 900 dentro de ciudad | 0 |
| Fallo forzado BBVA | capa retirada, V13 intacto, ciudad utilizable |

La prueba toma capturas con y sin vecinas dentro de la región opaca y registra las diferencias RGB. Chrome puede variar rasterizado/antialias al cambiar las capas GPU: se conservan mediciones y PNG para revisión visual, sin exigir igualdad byte a byte ni usar esas métricas como certificado de arquitectura. Se comprueban por separado prioridad, opacidad, máscara completa y transform común.

## Validación y reproducción

`npm run build`: PASS (aviso preexistente de chunks >500 kB). `npm test`: **62/62 PASS**, incluidas dos pruebas dedicadas para cobertura, máscara, SHA de los cinco existentes, carga diferida, prioridad, fundido, campus y fallback. `node tests/city-detail-browser.mjs`: **PASS** sobre preview compilado, tres móviles 320 × 568 DPR2, 390 × 844 DPR3, 430 × 932 DPR3, los doce destinos más retorno al hub; cero errores JS en esos recorridos. Se registran 39 encuadres móviles (doce destinos y retorno al hub en cada móvil), con 36 PNG por destino/anchura; se conservan doce controles base únicos y el fallback, además de clips de comparación de vecinas. `BROWSER-REPORT.json` contiene cajas reales, zoom, muestreo y solicitudes por parada.

Preview local: `http://127.0.0.1:4306/?city=0`; se sirve `dist` con `npm run preview -- --port 4306 --strictPort`. La URL puede cambiar mediante `CITY_DETAIL_URL`; directorio de QA mediante `CITY_DETAIL_OUT`. La prueba usa Chrome instalado en macOS.

La revisión independiente final de todos los encuadres integrados corresponde al coordinador/integrador único. No se ha modificado la geometría/cámara ni componentes propiedad de otros trabajos.
