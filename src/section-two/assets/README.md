# Ciudad de Puntoes · recursos y dirección visual

1 de octubre de 2026. Edición con la herramienta integrada image_gen, sin CLI ni API externa.

## Recursos activos

- Núcleo horizontal: `puntoes-city-v10.webp`, 1672 × 941, 956046 bytes. Conserva exactamente los edificios, sus puntos y su escala.
- Extensión horizontal: `puntoes-city-v11-expanded.webp`, 1672 × 941, 950966 bytes. Añade paisaje equivalente al 25 % original en cada borde; se muestra a 150 % del tamaño anterior con el núcleo V10 en el centro.
- Retrato móvil: `puntoes-city-mobile-v13-tour.webp`, 941 × 1672, 1023844 bytes. Sedes más separadas, casas entre ellas y barrios con plazas y bulevares para evitar una composición abarrotada.
- Los prompts exactos de V11/V13, dimensiones nativas, hashes y registros de encaje están en [city-art-provenance.json](city-art-provenance.json). Generación con la herramienta integrada image_gen, sin CLI/API externa. El registro V13 respecto a V12 conserva las doce sedes con desplazamientos medianos inferiores a un píxel; las medidas visuales se calibran en `../mobile-tour-config.js`.
- Archivos de referencia conservados en el worktree aislado de desarrollo, fuera del repositorio publicado. PNG originales: `review-section-two/city-source/puntoes-city-master-v10.png` y `puntoes-city-portrait-master-v10.png`.
- Prompts de esta revisión: `review-section-two/city-source/PROMPTS-NITIDEZ-OBRA.md`. La dirección anterior permanece en `PROMPTS-REVISION.md`.
- Fuentes de los edificios y del SVG de Sabadell: `review-section-two/REFERENCIAS-EDIFICIOS.md`.
- Fuentes y preparación de los diez logos actuales: [LOGOS-FUENTES.md](LOGOS-FUENTES.md).

WebP se codifica con Sharp a calidad 98 desde los PNG originales, sin pintar edificios con código. V9 recupera definición en ventanas, tejados y caminos; V10 añade la obra. Los tamaños anteriores son reales: pedir 4K al generador no produjo más píxeles. El acercamiento inicial pasa de 120 % a 150 % y mantiene el tamaño final. El fade ocupa 2,75 veces más recorrido de scroll y conserva el mismo punto de inicio. La prueba de nubes se descartó por parecer un velo blanco; no se carga su textura en la web. No se presenta una ampliación artificial como resolución nueva.

Picture descarga solo V13 en móvil; en ordenador carga V11 y el núcleo V10 cerca de la entrada. El núcleo ocupa los dos tercios centrales del mundo ampliado. Una transición de 48 px en coordenadas de V11 suaviza las cuatro uniones; la textura de agua comparte esa mezcla para conservar la continuidad de la costa.

El mar utiliza una capa WebGL con la dependencia Three.js existente: máscara de costa, desplazamiento suave de píxeles de agua, espuma y reflejos. La costa se suaviza mediante interpolación y distancia a la orilla, para evitar bandas angulares. No se carga un GIF ni un vídeo. La máscara distingue las playas de las piedras y espigones: limita la espuma a la arena y conserva movimiento suave en mar abierto. Excluye barcos y edificios; no genera anillos de espuma alrededor de barcos blancos. Los reflejos tienen variación en dos direcciones para evitar rayas uniformes en el mar ampliado. Se detiene fuera del mapa, con la ficha modal abierta o con la pestaña oculta. La imagen estática es la alternativa si WebGL no está disponible.

## Composición e interacción

Ciudad imaginaria con parque, río, puentes, playa y viviendas. Diez miniaturas interpretan fotografías: Accenture, BBVA, Canal, Cepsa, MAPFRE, Mediaset, Red Eléctrica, Siemens, Naturgy y Banco Sabadell. MAPFRE utiliza la torre de la fotografía aportada por David y reduce su altura aproximadamente a la mitad de V6. Varias oficinas se mezclan con casas y jardines. No es un plano de una ciudad real ni una reproducción CAD de las sedes.

Puntoes es una oficina pequeña de dos plantas en L, de piedra clara, con patio y marca .es discreta. No queda el gran campus circular ni el haz vertical; se conserva un halo tenue y un solo anillo. Imagen y fondo suavizado comparten saturación 0,82, contraste 0,96 y brillo 1,02. El azul intenso se reserva a los puntos de interacción.

Los carteles de fachadas se han retirado. Nueve logos vectoriales y el PNG oficial de Mediaset se presentan en blanco mediante CSS en el carrusel inferior; las fichas utilizan sus colores originales. Los SVG mantienen sus vectores sin pasar por limpieza en canvas. La normalización combina alturas ópticas por marca y límites comunes de ancho, manteniendo las proporciones. Compensa símbolos altos, nombres anchos y líneas secundarias. Los botones tienen más espacio para mostrar los logos ampliados.

El carrusel avanza, se detiene al pasar por un cliente y resalta su punto. Tanto logo como punto abren la misma ficha. La fila utiliza diez botones reales y recicla los que salen del borde, sin duplicar enlaces. El teclado pausa el movimiento y permite enfocar todos los clientes mediante desplazamiento horizontal. Los textos de las fichas son ilustrativos, por petición explícita del usuario, y están identificados como texto de muestra. Ver más amplía el relato dentro del diálogo.

El ratón permite arrastrar mapa, puntos y agua juntos dentro de la extensión, con cursor de mano abierta/cerrada. En móvil, el scroll acerca primero la cámara a Puntoes y luego recorre las sedes una a una. Acelera al salir, frena al llegar y solo después entra la tarjeta desde abajo. Las tarjetas anteriores siguen durante el viaje y las siguientes se superponen con una rotación mínima. Subir el scroll invierte el recorrido y descubre las anteriores. La lista `mobileTourOrder` permite elegir tres clientes u otro número y cambiar su orden sin modificar la animación; su duración se adapta al número de paradas. «Ver más» conserva el contenido completo de las fichas.

La perspectiva usa datos de orientación ya disponibles, se calibra al entrar y limita el giro a dos grados, con respuesta suavizada. Se pausa durante los trayectos, el arrastre de escritorio en dispositivos táctiles y las fichas modales, sin solicitar permisos ni añadir un botón.

En la zona superior izquierda hay una pequeña obra de dos plantas, con andamios y grúa, para representar nuevas colaboraciones. Su punto es el undécimo, independiente del carrusel de diez clientes. Abre «¿Quieres colaborar?», con «El próximo punto puede ser el tuyo» y un enlace «Hablemos» al contacto de Puntoes. La etiqueta conserva espacio junto al borde izquierdo en móvil.

## Procedencia y autorización

Referencia inicial: https://why.zero.university/, `assets/atlases/world.ktx2`, 8192 × 4096, 3154849 bytes. Su implementación utiliza una textura sobre un plano; no proporciona edificios independientes. No se ha supuesto un repositorio de Blender disponible.

La autorización aportada por David está archivada en `../reference-assets/zero-hand/comunicado-uso-aportado.txt`, respecto a la raíz del worktree. Confirmó que la recibió directamente de Zero. Concede uso personal y comercial, modificación y adaptación de los modelos y recursos asociados, sin pago ni atribución obligatoria.

La textura se decodificó con el transcodificador Basis existente y se orientó para usarla como referencia. Image_gen adapta composición, arquitectura e identidad. Las fotografías se conservan como referencias locales, excluidas de Git y sin servirse en la web.

V1 y las versiones entregadas V7/V8 permanecen en el historial como referencia. Los restantes másteres y WebP intermedios se conservan localmente y están excluidos de Git. El retrato V10 permanece como referencia de origen y no entra en la compilación actual; los tres activos cargados son V10 horizontal, V11 ampliado y V13 móvil. Las descargas y pruebas de extracción de logos se guardan en `review-section-two/brand-sources/`, excluido de Git y de la web.
