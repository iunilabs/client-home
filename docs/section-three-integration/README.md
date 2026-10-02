# Sección 3 integrada en la web

La escena aprobada de papeles aparece después de la ciudad (`#confianza`), en `#posibilidades`. Sustituye el marcador anterior «La inteligencia, puesta en práctica» y utiliza la cabecera y el indicador de capítulo de la web.

El primer papel dice **«Era urgente. Sigue pendiente.»**. Su etiqueta es «BLOQUEADO» y el detalle «El cliente vuelve a preguntar». Este mensaje presenta el coste de una tarea atascada antes de que lleguen los demás correos, mensajes, incidencias y documentos.

## Revisar

- Web completa: http://127.0.0.1:5185/
- Primer papel: http://127.0.0.1:5185/?paper=0.155
- Ciudad: http://127.0.0.1:5185/?city=0

Para reiniciar la vista local desde este directorio:

```sh
npm run dev -- --port 5185
```

## Integración

Rama `feature/section3-paper-flow` en el worktree `puntoes-section3-integration`. La base `c514374` conserva los siete archivos que estaban modificados localmente en la web principal. El checkout `puntoes-home` permanece intacto. El primer papel también está actualizado en la propuesta aislada `puntoes-section3-lab`.

La nueva escena se carga al aproximarse a la sección, comparte el bucle de animación y el scroll de la web, y suspende su renderizado y sensor al salir. Las fuentes, cabecera y estilos globales se conservan. No incluye controles del laboratorio.

Se mantienen los 75 asuntos diferentes, el papel mate con reverso sin impresión, torsión y esquinas flexibles en reposo, la luz del cursor y el paralaje con ratón o inclinación. No hay desenfoque de profundidad ni cristales. La reducción de movimiento detiene el movimiento decorativo.

## Comprobación

```sh
npm test
npm run build
npm run test:paper-integration
```

La prueba de navegador comprueba carga diferida, nuevo texto, scroll reversible, luz y paralaje, deformación en reposo, giroscopio simulado, límite contiguo entre ciudad y papeles, recorrido de clientes con gestos táctiles, salida y regreso, y reducción de movimiento. Las capturas y `report.json` se guardan aquí. El sensor se comprueba con eventos simulados; no se ha probado un teléfono físico.
