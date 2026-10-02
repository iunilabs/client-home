# Contexto

Objetivo: sección 3 con texto plano, blur suave y salida desde 2500 px. Base pública: `b895438`. Worktree aislado `puntoes-paper-copy-1900`; checkout principal intacto.

Entrada local a 1900 px, fade completo a 2140 px. Texto empieza fade out a 2500 px y acaba a 2740 px. Altura mínima garantiza ese recorrido en horizontal. Variable compartida de texto y canvas: blur máximo reducido de 8 a 3 px, opacidad del canvas de 1 a .75; vuelve a verse nítido al salir. Conserva contenido y tipografía. Móvil mantiene ancho completo y padding de 24 px.

Archivos: `src/section-three/scene.js`, `src/section-three/style.css`. Build `/client-home/` correcto. QA correcto en 390×844, 1440×900 y 844×390: entrada, salida 2500–2740 px, blur máximo 3 px y sin errores. Siguiente: commit, push y verificar Pages.
