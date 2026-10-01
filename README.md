# Puntoes — En tus manos

Landing de Puntoes con una escena 3D controlada por el scroll: mano humana, piedra, compás, llave inglesa y encuentro con una mano de porcelana.

## Desarrollo

Se recomienda Node.js 24 y npm.

    npm ci
    npm run dev

La portada está en /. Las utilidades de revisión de mano y modelos están en /mano.html y /modelos.html.

## Comprobación y compilación

    npm test
    npm run build
    npm run preview

La compilación se genera en dist. Los modelos, texturas, fuentes y decodificadores necesarios se incluyen como archivos estáticos.

## GitHub Pages

El workflow .github/workflows/deploy.yml comprueba y compila el proyecto al actualizar main, y publica dist en GitHub Pages. La compilación usa la base /client-home/ para resolver los recursos del sitio de proyecto.

Web: https://iunilabs.github.io/client-home/

## Modelos y licencias

Se conservan los créditos y avisos de procedencia junto a los modelos en public/models, las licencias tipográficas en public/fonts y los avisos de dependencias en public/licenses. Los créditos de los modelos también se muestran en la web.

## Punto de restauración

La sección de manos aprobada antes de esta revisión editorial está guardada en la referencia Git manos-cerradas-2026-10-01, commit 2065e0f4733dc4daadf3aa30a17dc74d42951834.

También existe una copia local independiente con código, modelos, texturas, web compilada y documentación. Su restauración completa fue comprobada antes de limpiar archivos. Los archivos generados y las pruebas visuales locales no forman parte del repositorio de publicación.

Para abrir ese estado en otra carpeta sin modificar la versión actual:

    git worktree add ../puntoes-manos-cerradas manos-cerradas-2026-10-01

Los scripts de preparación de fuentes y texturas conservados en tools necesitan los originales TTF/PNG de ese punto de restauración. La web publicada usa las fuentes WOFF2 y las texturas WebP sin pérdida que ya están en public.

## Sección 2: ciudad y clientes

La página principal continúa desde el encuentro hacia una ciudad con diez clientes y un undécimo punto para nuevas colaboraciones. Cada cliente abre una ficha con «Ver más», cierre con Escape y recuperación del foco; la obra abre «¿Quieres colaborar?» y el enlace «Hablemos». Los relatos de clientes están marcados como ejemplos ilustrativos. Se sirven solo los dos encuadres WebP V10 y los logos activos de `src/section-two/assets`, con [fuentes documentadas](src/section-two/assets/LOGOS-FUENTES.md).

La entrada empieza al 150 % y el scroll aleja el mapa. En móvil, un arrastre que empieza horizontal permite explorar ambos ejes, y dos dedos también desplazan el mapa; un gesto vertical normal conserva el scroll de la página. La inclinación del teléfono da una perspectiva suave, calibrada y limitada a dos grados, cuando el navegador ya permite acceder al sensor. Se conserva la activación automática sin botón ni solicitud de permisos; si no llegan datos, el mapa mantiene sus otras interacciones. El mapa, los puntos y el oleaje se transforman juntos, con margen real de imagen para cubrir los bordes. El agua anima espuma en las playas y textura en el mar abierto, con una máscara que excluye piedras, espigones, barcos y edificios, y se pausa fuera de la ciudad o con una ficha abierta.

`?scroll=0..1000` conserva los marcadores de la sección 1; `#encuentro` muestra su postura final y `?city=0.94` permite revisar la ciudad. El contador vuelve a 0..1000 al empezar la segunda sección. El punto cerrado de la primera sección está en la etiqueta `seccion-1-cerrada-2026-10-01` (`e0d14a3`). Los módulos de continuación usan los modelos y materiales actuales sin copiar su antiguo baseline.

Validación: `npm test` (44 pruebas), compilación con `npm run build -- --base=/client-home/`, revisión de las once fichas y del retorno al encuentro en 320, 390 y 1424 px, gestos táctiles con eventos reales de Chrome emulado y orientación con datos simulados. La emulación no verifica un sensor ni el rendimiento de un móvil físico.
