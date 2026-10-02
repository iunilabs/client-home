# Contexto

Objetivo: publicar sección 4 como continuación de «Cada pendiente pesa.» Las mismas 47 tarjetas se alinean a la izquierda y pasan una a una a la derecha, con estados, bordes y checks verdes. El texto comercial sobre IA queda para después.

Rama `fix/mobile-section-two`, conservando clientes y zoom publicados. Un solo canvas comparte secciones 3 y 4; las profundidades permanentes evitan intersecciones. Scroll reversible, fallback sin WebGL y orientación móvil que conserva progreso. Renderer se detiene en composición estática.

Archivos: `index.html`, `src/main.js`, `src/section-three/`, nuevo `src/section-four/workflow.js`; `city.js` limita conjuntamente ambas secciones durante el recorrido móvil. Tests: unitarias, sección 3 integrada y 47 transferencias en cuatro tamaños, input vivo, swipe y fallback. Build `/client-home/` correcto.

Dev: http://127.0.0.1:4318/?resolution=.32; producción local puerto 4392. Publicación autorizada: https://iunilabs.github.io/client-home/, workflow `deploy.yml` desde main. Al retomar, contrastar Git y despliegue.
