# Contexto

Objetivo: retrasar salida del texto de sección 3 a 2900 px. Worktree aislado `puntoes-paper-copy-1900`; base pública `d5f9944`, con precarga de tarjetas y renderer compartido. Checkout principal intacto.

Entrada local conservada en 1900–2400 px. Fade out ahora 2900–3140 px, manteniendo duración de 240 px. Altura mínima ampliada a viewport + 3140 px para completar salida en horizontal. Blur máximo 3 px; texto plano, contenido y tipografía intactos.

Archivos: `src/section-three/scene.js`, `src/section-three/style.css`. Build `/client-home/` correcto. QA correcto en 390×844 y 844×390: salida 2900–3140 px y texto visible hasta 2900. Siguiente: commit, push y comprobar Pages.
