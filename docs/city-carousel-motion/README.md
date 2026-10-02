# Movimiento del carrusel de clientes

El controlador local está en `src/section-two/carousel-motion.js` y lo monta `city-carousel.js`. Conserva diez botones reales, uno por cliente. Al cruzar el ancho de un logo recicla su nodo y compensa su ancho y el espacio entre logos; durante el arrastre acumula el desplazamiento del dedo aparte del offset normalizado. Así la velocidad de suelta no cambia de signo ni de magnitud al reciclar.

Arrastrar horizontalmente sigue el dedo. En touch se bloquea el gesto horizontal después de reconocer el eje, mientras que los gestos verticales siguen desplazando la página. El último gesto pone a cero la espera de dos segundos; después la velocidad automática sube gradualmente. `data-paused` y `data-motion` en `.city-carousel` permiten inspeccionar el estado en DevTools. Los valores de `data-motion` incluyen `dragging`, `inertia`, `waiting`, `resuming`, `automatic`, `paused`, `reduced-motion` y `hidden`.

El carrusel conserva la pausa al pasar el puntero de ratón, pausa mientras hay foco visible de teclado o un diálogo abierto, y usa scroll nativo del viewport para que Tab revele cada botón. En touch ignora el hover sintético. La preferencia `prefers-reduced-motion` desactiva autoplay e inercia ornamental, pero deja activo el arrastre directo.

## Reproducir

Desde la raíz del checkout:

```sh
npm run dev -- --port 4305
```

En otra terminal:

```sh
node --test tests/carousel-motion.test.js
CITY_CAROUSEL_URL='http://127.0.0.1:4305/?city=0.99' node tests/city-carousel-browser.mjs
npm test
npm run build
```

La prueba de navegador usa Chrome y `Input.dispatchTouchEvent` por CDP. Arrastra más de dos anchos de logo a izquierda y derecha y guarda posiciones DOM por frame, `scrollY`, transform, fase e IDs en `REPORT.json`. También comprueba Tab para los diez clientes, pausa con el dedo sostenido más de dos segundos, inercia al soltar, reanudación automática, clic y selección en escritorio, hover, reduced-motion y ausencia de salto al simular `visibilitychange`.

La pausa de pestaña se simula sobrescribiendo `document.hidden` y enviando `visibilitychange`, porque el loop de render principal se suspende en una pestaña realmente oculta. El input táctil, el recorrido de los logos y el scroll del documento sí usan eventos y geometría reales del navegador.

## Evidencia

- `REPORT.json`: capturas temporales de la posición de los diez nodos; incluye las secuencias en ambos sentidos, la pausa sostenida y el estado tras soltar.
- `finger-left-resume.png`: carrusel después de un arrastre largo a izquierda y la reanudación automática.
- `finger-right-inertia.png`: carrusel después de arrastrar a derecha y soltar.
