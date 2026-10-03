// Rendered by Vite in development and at build time: navigation works without JS.
export const pages = [
  ['consultoria', 'Consultoría'], ['ia-automatizacion', 'IA y automatización'],
  ['formacion', 'Formación'], ['clientes', 'Clientes'], ['nosotros', 'Nosotros'], ['hablemos', 'Hablemos'],
];

export function siteHeader(current, base) {
  const links = mobile => pages.map(([slug, label], i) => `<li><a href="${base}${slug}/"${current === slug ? ' aria-current="page"' : ''}${slug === 'hablemos' ? ' class="header-contact"' : ''}>${mobile ? `<span class="header-menu-number" aria-hidden="true">0${i + 1}</span><span class="header-menu-label">${label}</span>` : label}${slug === 'hablemos' ? `<span${mobile ? ' class="header-menu-arrow"' : ''} aria-hidden="true">↗</span>` : ''}</a></li>`).join('\n');
  return `<header class="header">
    <a class="brand" href="${current ? base : '#inicio'}" aria-label="Puntoes, inicio"><img src="/images/logo-puntoes.png" width="118" height="51" alt="Puntoes" /></a>
    <nav class="header-desktop-nav" aria-label="Principal"><ul class="header-links">${links(false)}</ul></nav>
    <button class="header-menu-toggle" type="button" aria-label="Abrir menú" aria-haspopup="dialog" aria-controls="header-mobile-menu" aria-expanded="false" hidden><span class="header-menu-symbol" aria-hidden="true"><span></span><span></span></span></button>
    <dialog class="header-mobile-menu" id="header-mobile-menu" aria-label="Menú de Puntoes" data-lenis-prevent>
      <div class="header-menu-top"><img src="/images/logo-puntoes.png" width="118" height="51" alt="Puntoes" /><button class="header-menu-close" type="button" aria-label="Cerrar menú"><span class="header-menu-symbol header-menu-symbol--close" aria-hidden="true"><span></span><span></span></span></button></div>
      <p class="header-menu-eyebrow">FORMACIÓN · CONSULTORÍA · IA</p>
      <nav aria-label="Menú móvil"><ul class="header-links">${links(true)}</ul></nav>
      <p class="header-menu-footer"><span class="blue-dot" aria-hidden="true"></span>Desde 1999. Mirando hacia delante.</p>
    </dialog>
  </header>`;
}

export function siteFooter(base) {
  return `<footer class="site-footer"><div class="footer-top"><a class="brand" href="${base}" aria-label="Puntoes, inicio"><img src="/images/logo-puntoes.png" width="118" height="51" alt="Puntoes" /></a><p>Tecnología que avanza.<br>Personas que la hacen posible.</p><a href="mailto:puntoes@puntoes.es">puntoes@puntoes.es ↗</a></div><nav aria-label="Pie de página">${pages.map(([slug, label]) => `<a href="${base}${slug}/">${label}</a>`).join('')}</nav><div class="footer-bottom"><span>© ${new Date().getFullYear()} Puntoes · Formación y consultoría</span><a href="https://www.puntoes.es/wp-content/uploads/2017/08/politicapuntoes.pdf" target="_blank" rel="noopener noreferrer">Política de privacidad ↗</a><a href="#contenido">Volver arriba ↑</a></div></footer>`;
}
