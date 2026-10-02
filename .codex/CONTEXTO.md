# Contexto

Objetivo: última sección de contacto, integrada con el estilo de Puntoes y publicada en GitHub Pages. Rama `feature/contact-section`, base inicial `10189cd`, integrado con `53b4e67`, checkout `puntoes-mobile-card-readability`.

Nueva sección `#contacto` tras los papeles: titular serif, fondo azul suave y formulario responsive. Campos nombre, email, tema y mensaje; envío al Contact Form 7 existente de puntoes.es (formulario 119), multipart sin credenciales. Validación real vacía confirma CORS y rechazo sin correo. Éxito solo con `mail_sent`; errores conservan texto, controles bloqueados durante envío y aviso accesible. Alternativa email y fallback nativo. Invitación del mapa enlaza aquí.

Archivos: `index.html`, `main.js`, `contact.js`, `contact.css`, `mobile-tour-deck.js`, prueba de contacto. 128 pruebas/build correctos. Chrome: escritorio, 320, 390 y horizontal; respuestas interceptadas para validación/error/éxito, sin enviar correos reales. Resize conserva contacto. Intercepción y viewport restaurados. Siguiente: publicar y verificar web pública.
