# Contexto

Objetivo: publicar sección 3 con texto plano y tarjetas del fondo difuminadas. Base pública: `9c99295`. Worktree aislado `puntoes-paper-copy-1900`; checkout principal intacto.

Texto exacto: «Esto ya lo hicimos. Y toca hacerlo otra vez.» y descripción de tareas repetidas. Entrada local a 1900 px, fade completo a 2140 px. Se eliminan fondo, borde, sombra y backdrop de la caja. En móvil conserva ancho completo y padding de 24 px. La variable compartida en `.paper-stage` anima desenfoque del canvas de 0 a 8 px y opacidad de 1 a .75. Al pasar a sección 4 vuelve a verse nítido. Timing y tipografía conservados.

Archivos: `src/section-three/scene.js`, `src/section-three/style.css`. Build `/client-home/` correcto. QA en 390 y 1440 px: texto plano, timing, desenfoque, salida nítida y ausencia de errores/desbordamiento; captura móvil revisada. Siguiente: commit, push y comprobar Pages.
