# Contexto

Objetivo: fade in del texto de sección 3 desde 920 px locales. Worktree aislado `puntoes-paper-copy-1900`; base pública `076203b`, con precarga, renderer compartido y optimización de sección 4. Checkout principal intacto.

Entrada ahora 920–1420 px, conservando duración de 500 px. Fade out 2500–2740 px y blur 3 px intactos. Tarjetas: primera desde 80 px, siguiente tanda desde 350 px; a 500 ya están dentro del encuadre según QA móvil/escritorio anterior.

Archivo editado: `src/section-three/scene.js`. Único cambio funcional: límites de fade in; reutilizada QA previa de curva y CSS. Siguiente: build, commit, push y verificar Pages.
