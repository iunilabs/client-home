# Validación de la entrada luminosa y del recorrido

30 de septiembre de 2026.

La compilación nueva está en `dist-intro/`, puerto 4177. Las quince pruebas unitarias y las diecisiete comprobaciones generales pasan con Chrome y SwiftShader. La entrada tiene un registro independiente en [entrada-verde/VALIDACION.json](entrada-verde/VALIDACION.json) y una explicación de alcance en [entrada-verde/LEEME.md](entrada-verde/LEEME.md).

La cámara, la mano y el texto siguen el mismo progreso reversible. Los programas de los materiales se preparan antes del primer render. La ejecución de WebGL por software utiliza un presupuesto menor de píxeles, entre 0,35 y 0,7 de la resolución base, empezando en 0,45. La GPU convencional conserva el presupuesto anterior. El HTML mantiene su resolución nativa. Esta adaptación resolvió la comprobación de inercia que había fallado por escasez de fotogramas intermedios con la piel nueva en SwiftShader.

Escritorio 1440 × 900, entrada 1424 × 873 y emulación móvil de 320, 390 y 768 px. Las pruebas de software no certifican rendimiento en teléfonos físicos ni una tasa fija de fotogramas.

## Comprobaciones generales

- Carga inicial con WebGL y sin bloqueo.
- Rueda con inercia progresiva, cámara sincronizada y retorno.
- Recorrido de los 14 capítulos, un texto activo cada vez.
- Parallax de ratón conserva el contacto entre índices.
- Scroll reversible hasta el origen.
- Acceso directo a servicios.
- Detalle de servicio opcional, accesible y sin mover el fondo.
- Movimiento reducido desactiva parallax y ambiente.
- Consulta genera archivo local sin enviar datos.
- Modal accesible mediante teclado y Escape.
- Progresión mediante teclado e interrupción de la inercia con Home.
- Recarga sin progreso persistido ni cookies.
- Emulación móvil: sin desbordamiento, navegación y detalle táctil.
- Respeta preferencia del sistema de reducir movimiento.
- Contenido, navegación y detalle disponibles sin JavaScript.
- Sin errores JavaScript ni de shader en el recorrido.
- Fallback visible cuando WebGL no está disponible.

## Clientes

- Nueve marcas reales visibles en la pausa de clientes.
- La cámara cambia la perspectiva de los discos con diferencias según su profundidad.
- Lista completa con nueve imágenes, Escape y retorno del foco.
- Retroceder restaura servicios y permite volver a clientes.
- El acceso directo al contacto llega al nuevo capítulo con el formulario operativo.
- Móvil muestra todas las marcas en tres grupos mediante scroll, sin desbordamiento.
- Movimiento reducido en móvil muestra las nueve marcas simultáneamente.
- Los títulos de las 14 escenas caben en un ancho de 320 px.
- La URL #clientes abre la composición legible.
- Sin JavaScript permanecen los nueve logotipos en HTML.
- Sin errores JavaScript durante el recorrido.

## Capturas del recorrido

| Archivo | Pantalla | Progreso medido |
|---|---|---:|
| [01-inicio.png](capturas/01-inicio.png) | 1440 × 900 | 0.0000 |
| [02-piedra.png](capturas/02-piedra.png) | 1440 × 900 | 1.4003 |
| [03-compas.png](capturas/03-compas.png) | 1440 × 900 | 2.3497 |
| [04-mecanismo.png](capturas/04-mecanismo.png) | 1440 × 900 | 3.4502 |
| [05-raton.png](capturas/05-raton.png) | 1440 × 900 | 4.3005 |
| [06-contacto.png](capturas/06-contacto.png) | 1440 × 900 | 5.6799 |
| [07-entrega.png](capturas/07-entrega.png) | 1440 × 900 | 6.5197 |
| [08-criterio.png](capturas/08-criterio.png) | 1440 × 900 | 7.4203 |
| [09-formacion.png](capturas/09-formacion.png) | 1440 × 900 | 8.5005 |
| [10-consultoria.png](capturas/10-consultoria.png) | 1440 × 900 | 9.5005 |
| [11-aplicacion.png](capturas/11-aplicacion.png) | 1440 × 900 | 10.6502 |
| [12-metodo.png](capturas/12-metodo.png) | 1440 × 900 | 11.1000 |
| [13-clientes.png](capturas/13-clientes.png) | 1440 × 900 | 12.4797 |
| [14-cierre.png](capturas/14-cierre.png) | 1440 × 900 | 13.1797 |
| [M01-inicio.png](capturas/M01-inicio.png) | 390 × 844 | 0.0000 |
| [M02-piedra.png](capturas/M02-piedra.png) | 390 × 844 | 1.3995 |
| [M03-contacto.png](capturas/M03-contacto.png) | 390 × 844 | 5.6797 |
| [M04-entrega.png](capturas/M04-entrega.png) | 390 × 844 | 6.5196 |
| [M05-servicios.png](capturas/M05-servicios.png) | 390 × 844 | 8.5000 |
| [M06-metodo.png](capturas/M06-metodo.png) | 390 × 844 | 11.1004 |
| [M07-clientes.png](capturas/M07-clientes.png) | 390 × 844 | 12.4802 |
| [M08-cierre.png](capturas/M08-cierre.png) | 390 × 844 | 13.1797 |
| [F01-sin-javascript.png](capturas/F01-sin-javascript.png) | 390 × 844 | — |
| [F02-sin-webgl.png](capturas/F02-sin-webgl.png) | 1440 × 900 | 0.0000 |

## Alcance

Sin errores JavaScript o de shader en el recorrido comprobado. La rueda mantiene inercia progresiva y el teclado puede interrumpirla. La prueba de rueda registró diez muestras y siete posiciones distintas en esta ejecución; no acredita FPS de producción.

El contacto guarda un borrador local y no envía datos. Los modelos y agarres continúan su acabado en otra sesión. Los clientes corresponden a marcas publicadas por .es: no se atribuyen contratos vigentes ni proyectos de IA. El sitio continúa sin publicar.

Registro general: [VALIDACION.json](VALIDACION.json). Clientes: [clientes/VALIDACION.json](clientes/VALIDACION.json). Encuadres y alternativa sin WebGL: [clientes/ENCUADRES.json](clientes/ENCUADRES.json). Fuentes: [clientes/FUENTES.json](clientes/FUENTES.json).
