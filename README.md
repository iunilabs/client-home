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
