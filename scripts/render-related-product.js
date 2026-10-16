// Presentación compacta; la selección de relacionados permanece en el generador.
const { productPath, absolute, escape: e } = require('./catalog');
const currency = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });
module.exports = function renderRelatedProduct(product) {
  const image = absolute((product.images || [])[0] || '/images/products/placeholder.svg');
  return `<article class="related-product-card">
    <div class="product-image-frame${product.stock === 'Vendido' ? ' is-sold' : ''}"><img src="${e(image)}" alt="${e(product.name)}" loading="lazy" width="360" height="270"></div>
    <div class="related-product-card__content">
      <p class="related-product-card__category">${e(product.category)} · ${e(product.subcategory)}</p>
      <h3 class="related-product-card__title"><a href="${e(productPath(product))}">${e(product.name)}</a></h3>
      <p class="price">${e(currency.format(product.price))}</p>
      <p class="availability ${product.available ? 'available' : 'unavailable'}">${e(product.available ? 'Disponible' : product.stock || 'No disponible')}</p>
      <a class="button" href="${e(productPath(product))}">Ver detalle</a>
    </div>
  </article>`;
};
