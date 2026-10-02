# Contexto

Objetivo: fade out de sección 3 desde 2500 px. Worktree aislado `puntoes-paper-copy-1900`; base pública `69e4013`, con precarga de tarjetas y renderer compartido. Checkout principal intacto.

Entrada local conservada en 1200–1700 px. Fade out ahora 2500–2740 px, manteniendo duración de 240 px. Altura mínima viewport + 3140 px conservada. Blur máximo 3 px; texto plano, contenido y tipografía intactos.

Archivo editado: `src/section-three/scene.js`. Único cambio funcional: límites del fade out. Reutilizada QA previa de curva de entrada/salida en móvil y escritorio. Build `/client-home/` y diff correctos. Siguiente: commit, push y comprobar Pages.
