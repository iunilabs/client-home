# Sección 3 integrada en la web

La escena aprobada de papeles aparece después de la ciudad (`#confianza`), en `#posibilidades`. Sustituye el marcador anterior «La inteligencia, puesta en práctica» y utiliza la cabecera y el indicador de capítulo de la web.

La primera tarjeta es un **mensaje interno**: «Oye, ¿has conseguido automatizar eso? Lo necesitábamos ayer.», con el icono de conversación y el estado «Pendiente» del resto de mensajes. La frase se compone como un solo bloque de dos líneas, con la misma tipografía, tamaño y color en ambas. El texto aprovecha hasta el 85 % del ancho y se centra verticalmente en su zona de lectura. Empieza a entrar a los **90 px de scroll local**, independientemente del tamaño de pantalla. Desde el marcador **0180** se aleja y permanece al fondo.

## Revisar

- Web completa del candidato: http://127.0.0.1:5186/
- Primer papel: http://127.0.0.1:5186/?paper=0.155
- Ciudad: http://127.0.0.1:5186/?city=0

Para reiniciar la vista local desde este directorio:

```sh
npm run dev -- --port 5186 --strictPort
```

## Integración

Rama `feature/section3-release` en el worktree `puntoes-section3-release`, sobre el candidato combinado `30ad7185d3c2e4328cbf5db3be4ea2c4d2122282`. Incorpora solamente los cambios de sección 3 de `852816e`, `1950e4d`, `b51beb9` y `1a23364`. El snapshot local `c514374` no se ha incorporado: sus siete modificaciones ajenas a esta sección permanecen en el checkout original `puntoes-home`.

Las fuentes de las manos y de la ciudad son idénticas a la base combinada. La unión en `main.js` conserva el límite de scroll nativo, la reconciliación antes y después del RAF de Lenis, su reset para navegación instantánea y la finalización de los saltos explícitos. El acceso por `?paper=` restaura primero la extensión completa del documento, calcula el destino y completa la navegación para permitir regresar a la ciudad.

Al aproximarse, el observador solo precarga el módulo de código. La escena, sus texturas, geometrías y contexto WebGL se crean cuando el escenario entra en el viewport y la ciudad ya no retiene la página. Comparte el bucle de animación y el scroll de la web; suspende renderizado y sensor al salir o mientras el tour o el límite final de ciudad está activo. Las fuentes, cabecera y estilos globales se conservan. No incluye controles del laboratorio.

Se mantienen los 75 asuntos diferentes, el papel mate con reverso sin impresión, torsión y esquinas flexibles en reposo, la luz del cursor y el paralaje con ratón o inclinación. No hay desenfoque de profundidad ni cristales. La reducción de movimiento detiene el movimiento decorativo.

## Comprobación

```sh
npm test
npm run build
SECTION3_URL=http://127.0.0.1:5186/ npm run test:paper-integration
```

La prueba de navegador comprueba carga diferida, nuevo texto y entrada a 90 px, scroll reversible, luz y paralaje, deformación en reposo, giroscopio simulado, límite contiguo entre ciudad y papeles, recorrido de clientes con gestos táctiles, salida y regreso, acceso explícito por query y fragmento, tecla End y reducción de movimiento. Cada viaje guiado espera su llegada observable (`moving === false`) en vez de una pausa fija de duración antigua.

Preparación de esta entrega: **92/92 pruebas unitarias**, compilación y `git diff --check` correctos. La compilación conserva el aviso conocido del chunk compartido mayor de 500 kB. No se ha ejecutado Chrome durante esta preparación: el gate independiente de escritorio y móvil sigue pendiente.

Las capturas y `report.json` presentes aquí son evidencia histórica de la integración anterior, sobre `c514374`; **no certifican este candidato combinado**. Las capturas del primer papel también reflejan el ajuste posterior a dos líneas de `1a23364`. La siguiente ejecución de la prueba de navegador actualiza esta evidencia. El sensor anterior se comprobó con eventos simulados; no se ha probado un teléfono físico ni el diálogo real de permisos iOS. La suavidad y el coste de la primera inicialización de WebGL requieren valoración del revisor en la unión S1 → S2 → S3 antes de publicar.
