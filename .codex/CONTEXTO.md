# Contexto

Objetivo: añadir y publicar el texto de dolores empresariales en sección 3. Titular «Cada pendiente pesa.»; mensajes sin leer, incidencias repetidas, aprobaciones pendientes y versiones perdidas. Cierre: «El día se va en resolver lo urgente. Lo importante sigue esperando.» Prepara una futura sección de IA; esa sección todavía no se implementa.

Rama `fix/mobile-section-two` integrada con `origin/main` (`0fc131e`), conservando las nuevas tarjetas de clientes y su zoom. Copy a la izquierda, aparece al terminar la agrupación de papeles a la derecha; fallback visible sin WebGL.

Archivos: `index.html`, `src/main.js`, `src/section-three/scene.js` y `style.css`. QA visual en seis tamaños sin cortes ni solapamientos; pruebas unitarias y build `/client-home/` correctos. Vista local: http://127.0.0.1:4318/.

Publicación autorizada: https://iunilabs.github.io/client-home/, workflow `deploy.yml` desde main. Al retomar, comprobar el despliegue y estado Git antes de cambiar más cosas.
