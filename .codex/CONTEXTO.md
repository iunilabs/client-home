# Contexto

Objetivo: ajustar y publicar el texto «Esto ya lo hicimos. Y toca hacerlo otra vez.» de sección 3. Base pública: `4a7d81e`. Worktree aislado `puntoes-paper-copy-1900`; checkout principal y secciones anteriores intactos.

Entrada por scroll local: empieza a 1900 px, termina el fade a 2140 px. Se conserva la retirada al pasar a sección 4. Texto exacto solicitado sobre tareas repetidas. Caja glass con fondo blanco azulado al 60 %, blur de 14 px y borde suave; en móvil ocupa el ancho completo con padding de 24 px. El título usa los tamaños de sección 1. Altura mínima permite la entrada también en horizontal.

Archivos: `index.html`, `src/section-three/scene.js`, `src/section-three/style.css`. Comprobaciones: 118 pruebas y build `/client-home/` correctos; timing/ancho/tipografía verificados en 320, 390, 640 horizontal y 1440 px; capturas revisadas. Dev: puerto 4398. Siguiente: commit, push a `main` y confirmar GitHub Pages. No publicar si la rama remota avanzó sin integrar.
