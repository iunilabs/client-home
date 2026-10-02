# Contexto

Objetivo: adelantar fade in de sección 3 a 1200 px. Worktree aislado `puntoes-paper-copy-1900`; base pública `c96bcb2`, con precarga de tarjetas y renderer compartido. Checkout principal intacto.

Entrada local ahora 1200–1700 px: conserva duración de 500 px. Fade out conservado en 2900–3140 px. Altura mínima viewport + 3140 px garantiza salida en horizontal. Blur máximo 3 px; texto plano, contenido y tipografía intactos.

Archivo editado: `src/section-three/scene.js`. Build `/client-home/` correcto. QA correcto en 390 y 1440 px: entrada 1200–1700 y salida 2900–3140. Siguiente: commit, push y comprobar Pages.
