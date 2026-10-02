# Sección 3 integrada en la web

La escena aprobada de papeles aparece después de la ciudad (`#confianza`), en `#posibilidades`. Sustituye el marcador anterior «La inteligencia, puesta en práctica» y utiliza la cabecera y el indicador de capítulo de la web.

La primera tarjeta es un **mensaje interno**: «Oye, ¿has conseguido automatizar eso? Lo necesitábamos ayer.», con el icono de conversación y el estado «Pendiente» del resto de mensajes. La frase se compone como un solo bloque de dos líneas, con la misma tipografía, tamaño y color en ambas. El texto aprovecha hasta el 85 % del ancho y se centra verticalmente en su zona de lectura. Empieza a entrar a los **90 px de scroll local**, independientemente del tamaño de pantalla. Desde el marcador **0180** se aleja y permanece al fondo.

## Revisar

- Web completa: http://127.0.0.1:5185/
- Primer papel: http://127.0.0.1:5185/?paper=0.155
- Ciudad: http://127.0.0.1:5185/?city=0

Para reiniciar la vista local desde este directorio:

```sh
npm run dev -- --port 5185
```

## Integración

Rama `feature/section3-paper-flow` en el worktree `puntoes-section3-integration`. La base `c514374` conserva los siete archivos que estaban modificados localmente en la web principal. El checkout `puntoes-home` permanece intacto.

La nueva escena se carga al aproximarse a la sección, comparte el bucle de animación y el scroll de la web, y suspende su renderizado y sensor al salir. Las fuentes, cabecera y estilos globales se conservan. No incluye controles del laboratorio.

Se mantienen los 75 asuntos diferentes, el papel mate con reverso sin impresión, torsión y esquinas flexibles en reposo, la luz del cursor y el paralaje con ratón o inclinación. No hay desenfoque de profundidad ni cristales. La reducción de movimiento detiene el movimiento decorativo.

## Comprobación

```sh
npm test
npm run build
npm run test:paper-integration
```

La prueba de navegador comprueba carga diferida, nuevo texto, scroll reversible, luz y paralaje, deformación en reposo, giroscopio simulado, límite contiguo entre ciudad y papeles, recorrido de clientes con gestos táctiles, salida y regreso, y reducción de movimiento. Las capturas y `report.json` se guardan aquí. El sensor se comprueba con eventos simulados; no se ha probado un teléfono físico.
