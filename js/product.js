(function () {
  'use strict';
  var detail = document.getElementById('product-detail');
  var slug = detail.dataset.slug || new URLSearchParams(window.location.search).get('slug');
  var product = window.catalogData.products.find(function (item) { return item.slug === slug; });
  if (!product) {
    document.title = 'Producto no encontrado | Segunda Vida';
    detail.className = 'not-found';
    detail.innerHTML = '<h1>Producto no encontrado</h1><p>El producto solicitado no existe o el enlace es incorrecto.</p>';
    return;
  }
  if (!detail.dataset.slug) {
    window.location.replace('/productos/' + encodeURIComponent(product.slug) + '/' + window.location.hash);
    return;
  }
  // Mejorar el HTML generado sin reemplazar su contenido ni su SEO.
  function track(name, data) { if (typeof gtag === 'function') gtag('event', name, data); }
  track('view_item', { items: [{ item_id: String(product.sku), item_name: product.name, item_brand: product.brand, item_category: product.category, item_category2: product.subcategory, price: product.price, currency: 'MXN' }] });
  detail.querySelector('.contact-primary').addEventListener('click', function () {
    track('contact_facebook', { product_id: String(product.id), product_name: product.name, facebook_url: product.facebookUrl });
  });
  var publication = detail.querySelector('.product-facebook-link');
  if (publication) publication.addEventListener('click', function () {
    track('click_facebook_product', { product_id: String(product.id), product_name: product.name, facebook_url: product.facebookUrl, price: product.price, currency: 'MXN' });
  });
  var images = (product.images || []).filter(Boolean);
  var gallery = detail.querySelector('.carousel');
  var image = gallery.querySelector('.carousel-image');
  var frame = gallery.querySelector('.product-image-frame');
  var indicators = gallery.querySelectorAll('.indicator');
  var index = 0;
  function showImage(next) {
    if (!images.length) return;
    index = (next + images.length) % images.length;
    image.src = new URL(images[index], window.location.origin + '/').href;
    image.alt = product.name + ', imagen ' + (index + 1) + ' de ' + images.length;
    frame.classList.toggle('is-sold', product.stock === 'Vendido' && index === 0);
    indicators.forEach(function (button, i) { button.setAttribute('aria-current', String(i === index)); });
  }
  if (images.length > 1) {
    gallery.querySelector('.carousel-controls').hidden = false;
    gallery.querySelector('.carousel-indicators').hidden = false;
    indicators.forEach(function (button, i) { button.addEventListener('click', function () { showImage(i); }); });
    gallery.querySelector('.previous').addEventListener('click', function () { showImage(index - 1); });
    gallery.querySelector('.next').addEventListener('click', function () { showImage(index + 1); });
    gallery.addEventListener('keydown', function (event) {
      if (!event.target.closest('.indicator, .carousel-button')) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); showImage(index + (event.key === 'ArrowLeft' ? -1 : 1)); }
    });
    var touchStart = null;
    gallery.addEventListener('touchstart', function (event) { touchStart = event.changedTouches[0].screenX; }, { passive: true });
    gallery.addEventListener('touchend', function (event) {
      if (touchStart === null) return;
      var distance = event.changedTouches[0].screenX - touchStart;
      if (Math.abs(distance) > 40) showImage(index + (distance < 0 ? 1 : -1));
      touchStart = null;
    }, { passive: true });
  }
}());
