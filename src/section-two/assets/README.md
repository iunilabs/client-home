# Ciudad de Puntoes · recursos y dirección visual

1 de octubre de 2026. Edición con la herramienta integrada image_gen, sin CLI ni API externa.

## Recursos activos

- Horizontal: `puntoes-city-v7.webp`, 1672 × 941, 727112 bytes.
- Retrato: `puntoes-city-mobile-v8.webp`, 941 × 1672, 688846 bytes; encuadre recompuesto.
- PNG originales: `review-section-two/city-source/puntoes-city-master-v7.png` y `puntoes-city-portrait-master-v8.png`.
- Prompts: `review-section-two/city-source/PROMPTS-REVISION.md`.
- Fuentes de los edificios y del SVG de Sabadell: `review-section-two/REFERENCIAS-EDIFICIOS.md`.

WebP se codifica con Sharp a calidad 95 desde los PNG originales, sin pintar edificios con código. Los tamaños anteriores son reales: pedir 4K al generador no produjo más píxeles. El acercamiento inicial se ha reducido de 134 % a 120 %. El fade ocupa 2,75 veces más recorrido de scroll y conserva el mismo punto de inicio. La prueba de nubes se descartó por parecer un velo blanco; no se carga su textura en la web. No se presenta una ampliación artificial como resolución nueva.

Picture descarga un único encuadre cerca de su entrada. El mar utiliza una capa WebGL con la dependencia Three.js existente: máscara de costa, desplazamiento suave de píxeles de agua, espuma y reflejos. No se carga un GIF ni un vídeo. La máscara excluye arena, barcos y edificios; no genera anillos de espuma alrededor de barcos blancos. Se detiene fuera del mapa, con la ficha abierta o con la pestaña oculta y se omite con movimiento reducido. La imagen estática es la alternativa si WebGL no está disponible.

## Composición e interacción

Ciudad imaginaria con parque, río, puentes, playa y viviendas. Diez miniaturas interpretan fotografías: Accenture, BBVA, Canal, Cepsa, MAPFRE, Mediaset, Red Eléctrica, Siemens, Naturgy y Banco Sabadell. MAPFRE utiliza la torre de la fotografía aportada por David y reduce su altura aproximadamente a la mitad de V6. Varias oficinas se mezclan con casas y jardines. No es un plano de una ciudad real ni una reproducción CAD de las sedes.

Puntoes es una oficina pequeña de dos plantas en L, de piedra clara, con patio y marca .es discreta. No queda el gran campus circular ni el haz vertical; se conserva un halo tenue y un solo anillo. Imagen y fondo suavizado comparten saturación 0,82, contraste 0,96 y brillo 1,02. El azul intenso se reserva a los puntos de interacción.

Los carteles de fachadas se han retirado. Los diez logos originales se presentan en blanco mediante CSS en el carrusel inferior; las fichas utilizan sus colores originales. La normalización combina alturas ópticas por marca y límites comunes de ancho, manteniendo las proporciones. Compensa símbolos altos, nombres anchos y líneas secundarias. Los botones tienen más espacio para mostrar los logos ampliados.

El carrusel avanza, se detiene al pasar por un cliente y resalta su punto. Tanto logo como punto abren la misma ficha. La fila utiliza diez botones reales y recicla los que salen del borde, sin duplicar enlaces. El teclado pausa el movimiento y permite enfocar todos los clientes mediante desplazamiento horizontal. La preferencia de movimiento reducido elimina el avance automático. Los textos de las fichas son ilustrativos, por petición explícita del usuario, y están identificados como texto de muestra. Ver más amplía el relato dentro del diálogo.

El ratón permite arrastrar mapa, puntos y agua juntos, dentro de unos límites suaves, con cursor de mano abierta/cerrada. El gesto táctil vertical sigue destinado al scroll. No hay controles visibles añadidos.

## Procedencia y autorización

Referencia inicial: https://why.zero.university/, `assets/atlases/world.ktx2`, 8192 × 4096, 3154849 bytes. Su implementación utiliza una textura sobre un plano; no proporciona edificios independientes. No se ha supuesto un repositorio de Blender disponible.

La autorización aportada por David está archivada en `../reference-assets/zero-hand/comunicado-uso-aportado.txt`, respecto a la raíz del worktree. Confirmó que la recibió directamente de Zero. Concede uso personal y comercial, modificación y adaptación de los modelos y recursos asociados, sin pago ni atribución obligatoria.

La textura se decodificó con el transcodificador Basis existente y se orientó para usarla como referencia. Image_gen adapta composición, arquitectura e identidad. Las fotografías se conservan como referencias locales, excluidas de Git y sin servirse en la web.

V1 permanece en el historial como referencia. Másteres y WebP intermedios V2–V7 de retrato se conservan localmente y están excluidos de Git. Solo los dos encuadres activos se añaden como resultado final.
