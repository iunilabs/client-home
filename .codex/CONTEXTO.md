# Contexto

Objetivo: entrada más lenta del texto de sección 3. Worktree aislado `puntoes-paper-copy-1900`; base pública `d9b9a8c`, que incorpora precarga de tarjetas y renderer compartido. Checkout principal intacto.

Entrada local de texto ampliada de 1900–2140 a 1900–2400 px (más del doble de duración). Salida conservada en 2500–2740 px; blur máximo 3 px, texto plano, contenido y tamaños intactos. Se mantiene altura mínima para horizontal y fondo nítido al salir.

Archivo editado: `src/section-three/scene.js`. Build `/client-home/` correcto. QA focal correcto en 390 y 1440 px: entrada 1900–2400, salida 2500–2740, sin errores. Siguiente: commit, push y comprobar Pages.
