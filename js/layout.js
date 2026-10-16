(function () {
  'use strict';

  // Solo consume siteConfig para los enlaces globales; no usa datos de productos.
  function renderHeader(container) {
    container.innerHTML = `<a class="skip-link" href="#contenido">Saltar al contenido</a>
<header class="site-header">
  <div class="container header-content">
    <a class="logo brand" href="/" aria-label="Segunda Vida, inicio"><img src="/images/logo4.png" width="48" height="48" alt=""><span>Segunda Vida</span></a>
    <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="site-nav" hidden><span aria-hidden="true">☰</span> Menú</button>
    <nav id="site-nav" class="site-nav" aria-label="Navegación principal">
      <a href="/">Inicio</a><a href="/#catalogo">Catálogo</a>
      <a class="social-link" data-social="facebookUrl" target="_blank" rel="noopener noreferrer"><svg class="social-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14 21v-8h3l.5-4H14V7c0-1.1.4-2 2-2h2V1.5A22 22 0 0 0 15 1c-3 0-5 1.9-5 5v3H7v4h3v8Z"/></svg> Facebook</a>
      <a class="social-link" data-social="instagramUrl" target="_blank" rel="noopener noreferrer"><svg class="social-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none"/></svg> Instagram</a>
    </nav>
  </div>
</header>`;
  }

  function renderFooter(container) {
    container.innerHTML = `<footer class="site-footer">
  <div class="container footer-content">
    <div><a class="logo brand" href="/"><img src="/images/logo4.png" width="48" height="48" alt=""><span>Segunda Vida</span></a><p>Catálogo de productos de segunda mano</p></div>
    <nav aria-label="Enlaces del pie"><a href="/#catalogo">Catálogo</a><a data-social="facebookUrl" target="_blank" rel="noopener noreferrer">Facebook</a><a data-social="instagramUrl" target="_blank" rel="noopener noreferrer">Instagram</a><a href="https://reyko.site/">reyko.site</a></nav>
  </div>
</footer>`;
  }

  function renderBenefits(container) {
    container.innerHTML = `<span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z"/></svg>Piezas únicas</span><span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 4C9 2 3 9 7 15c5 7 15-1 13-11ZM4 21 16 9"/></svg>Consumo responsable</span><span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5c3-2 5-2 8 0 3-2 5-2 8 0v15c-3-2-5-2-8 0-3-2-5-2-8 0ZM12 5v15"/></svg>Nuevas historias</span>`;
  }

  function setupSocialLinks(container, config) {
    container.querySelectorAll('[data-social]').forEach(function (link) {
      var url = config[link.dataset.social];
      if (url) link.href = url;
      else link.remove();
    });
  }

  function setupMenu(header) {
    var toggle = header.querySelector('.menu-toggle');
    var nav = header.querySelector('#site-nav');
    if (!toggle || !nav) return;
    toggle.hidden = false;
    document.documentElement.classList.add('has-menu');
    function close() { toggle.setAttribute('aria-expanded', 'false'); }
    toggle.addEventListener('click', function () {
      toggle.setAttribute('aria-expanded', String(toggle.getAttribute('aria-expanded') !== 'true'));
    });
    nav.addEventListener('click', function (event) { if (event.target.closest('a')) close(); });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        close();
        toggle.focus();
      }
    });
    document.addEventListener('click', function (event) { if (!header.contains(event.target)) close(); });
  }

  var config = window.catalogData ? window.catalogData.siteConfig : {};
  var header = document.getElementById('site-header');
  var footer = document.getElementById('site-footer');
  if (header) {
    renderHeader(header);

    setupMenu(header);
  }
  document.querySelectorAll('[data-site-benefits]').forEach(renderBenefits);
  if (footer) {
    renderFooter(footer);

  }
  setupSocialLinks(document, config);
}());
