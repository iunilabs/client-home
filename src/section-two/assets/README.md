# Ciudad de Puntoes · recursos y dirección visual

1 de octubre de 2026. Edición con la herramienta integrada image_gen, sin CLI ni API externa.

## Recursos activos

- Horizontal: `puntoes-city-v10.webp`, 1672 × 941, 956046 bytes.
- Retrato: `puntoes-city-mobile-v10.webp`, 941 × 1672, 905628 bytes; encuadre recompuesto.
- Archivos de referencia conservados en el worktree aislado de desarrollo, fuera del repositorio publicado. PNG originales: `review-section-two/city-source/puntoes-city-master-v10.png` y `puntoes-city-portrait-master-v10.png`.
- Prompts de esta revisión: `review-section-two/city-source/PROMPTS-NITIDEZ-OBRA.md`. La dirección anterior permanece en `PROMPTS-REVISION.md`.
- Fuentes de los edificios y del SVG de Sabadell: `review-section-two/REFERENCIAS-EDIFICIOS.md`.
- Fuentes y preparación de los diez logos actuales: [LOGOS-FUENTES.md](LOGOS-FUENTES.md).

WebP se codifica con Sharp a calidad 98 desde los PNG originales, sin pintar edificios con código. V9 recupera definición en ventanas, tejados y caminos; V10 añade la obra. Los tamaños anteriores son reales: pedir 4K al generador no produjo más píxeles. El acercamiento inicial pasa de 120 % a 150 % y mantiene el tamaño final. El fade ocupa 2,75 veces más recorrido de scroll y conserva el mismo punto de inicio. La prueba de nubes se descartó por parecer un velo blanco; no se carga su textura en la web. No se presenta una ampliación artificial como resolución nueva.

Picture descarga un único encuadre cerca de su entrada. El mar utiliza una capa WebGL con la dependencia Three.js existente: máscara de costa, desplazamiento suave de píxeles de agua, espuma y reflejos. V10 aumenta la presencia de las olas y suaviza la costa mediante interpolación y distancia a la orilla, para evitar bandas angulares. No se carga un GIF ni un vídeo. La máscara excluye arena, barcos y edificios; no genera anillos de espuma alrededor de barcos blancos. Se detiene fuera del mapa, con la ficha abierta o con la pestaña oculta. La imagen estática es la alternativa si WebGL no está disponible.

## Composición e interacción

Ciudad imaginaria con parque, río, puentes, playa y viviendas. Diez miniaturas interpretan fotografías: Accenture, BBVA, Canal, Cepsa, MAPFRE, Mediaset, Red Eléctrica, Siemens, Naturgy y Banco Sabadell. MAPFRE utiliza la torre de la fotografía aportada por David y reduce su altura aproximadamente a la mitad de V6. Varias oficinas se mezclan con casas y jardines. No es un plano de una ciudad real ni una reproducción CAD de las sedes.

Puntoes es una oficina pequeña de dos plantas en L, de piedra clara, con patio y marca .es discreta. No queda el gran campus circular ni el haz vertical; se conserva un halo tenue y un solo anillo. Imagen y fondo suavizado comparten saturación 0,82, contraste 0,96 y brillo 1,02. El azul intenso se reserva a los puntos de interacción.

Los carteles de fachadas se han retirado. Nueve logos vectoriales y el PNG oficial de Mediaset se presentan en blanco mediante CSS en el carrusel inferior; las fichas utilizan sus colores originales. Los SVG mantienen sus vectores sin pasar por limpieza en canvas. La normalización combina alturas ópticas por marca y límites comunes de ancho, manteniendo las proporciones. Compensa símbolos altos, nombres anchos y líneas secundarias. Los botones tienen más espacio para mostrar los logos ampliados.

El carrusel avanza, se detiene al pasar por un cliente y resalta su punto. Tanto logo como punto abren la misma ficha. La fila utiliza diez botones reales y recicla los que salen del borde, sin duplicar enlaces. El teclado pausa el movimiento y permite enfocar todos los clientes mediante desplazamiento horizontal. Los textos de las fichas son ilustrativos, por petición explícita del usuario, y están identificados como texto de muestra. Ver más amplía el relato dentro del diálogo.

El ratón permite arrastrar mapa, puntos y agua juntos, dentro de unos límites suaves, con cursor de mano abierta/cerrada. En móvil, un gesto que empieza horizontal y el arrastre con dos dedos permiten moverse en ambos ejes; un inicio vertical sigue destinado al scroll. La perspectiva usa datos de orientación ya disponibles, se calibra al entrar y limita el giro a dos grados, con respuesta suavizada. Se pausa durante el arrastre y las fichas, sin solicitar permisos ni añadir un botón. No hay controles visibles añadidos.

En la zona superior izquierda hay una pequeña obra de dos plantas, con andamios y grúa, para representar nuevas colaboraciones. Su punto es el undécimo, independiente del carrusel de diez clientes. Abre «¿Quieres colaborar?», con «El próximo punto puede ser el tuyo» y un enlace «Hablemos» al contacto de Puntoes. La etiqueta conserva espacio junto al borde izquierdo en móvil.

## Procedencia y autorización

Referencia inicial: https://why.zero.university/, `assets/atlases/world.ktx2`, 8192 × 4096, 3154849 bytes. Su implementación utiliza una textura sobre un plano; no proporciona edificios independientes. No se ha supuesto un repositorio de Blender disponible.

La autorización aportada por David está archivada en `../reference-assets/zero-hand/comunicado-uso-aportado.txt`, respecto a la raíz del worktree. Confirmó que la recibió directamente de Zero. Concede uso personal y comercial, modificación y adaptación de los modelos y recursos asociados, sin pago ni atribución obligatoria.

La textura se decodificó con el transcodificador Basis existente y se orientó para usarla como referencia. Image_gen adapta composición, arquitectura e identidad. Las fotografías se conservan como referencias locales, excluidas de Git y sin servirse en la web.

V1 y las versiones entregadas V7/V8 permanecen en el historial como referencia. Los restantes másteres y WebP intermedios se conservan localmente y están excluidos de Git. V10 es la pareja activa. Las descargas y pruebas de extracción de logos se guardan en `review-section-two/brand-sources/`, excluido de Git y de la web.
