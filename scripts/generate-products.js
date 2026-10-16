// Ejecutar desde cualquier directorio: node scripts/generate-products.js
const fs = require('node:fs');
const path = require('node:path');
const { root, products, siteConfig, productPath, absolute, escape: e } = require('./catalog');
const template = fs.readFileSync(path.join(root, 'product.html'), 'utf8');
const currency = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });
const json = value => JSON.stringify(value, null, 2).replace(/</g, '\\u003c');
const renderRelatedProduct = require('./render-related-product');
const { renderProductMetadata, summarizeDescription } = require('./render-product-details');

for (const p of products) {
  const url = absolute(productPath(p));
  const images = (p.images || []).filter(Boolean).map(absolute);
  const image = images[0] || absolute('/images/products/placeholder.svg');
  const schema = {
    '@context': 'https://schema.org', '@type': 'Product',
    name: p.name, description: p.description,
    ...(p.sku ? { sku: String(p.sku) } : {}),
    ...(p.brand ? { brand: { '@type': 'Brand', name: p.brand } } : {}),
    image: images.length ? images : [image],
    category: p.category + ' > ' + p.subcategory,
    itemCondition: 'https://schema.org/' + (p.condition === 'Nuevos' ? 'NewCondition' : 'UsedCondition'),
    ...(typeof p.price === 'number' && Number.isFinite(p.price) ? { offers: {
      '@type': 'Offer', url, price: p.price.toFixed(2), priceCurrency: 'MXN',
      availability: 'https://schema.org/' + (p.available ? 'InStock' : 'OutOfStock'),
      seller: { '@type': 'Organization', name: 'Segunda Vida', url: absolute('/') }
    } } : {})
  };
  const breadcrumb = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Inicio', item: absolute('/') },
    { '@type': 'ListItem', position: 2, name: p.category, item: absolute('/') },
    { '@type': 'ListItem', position: 3, name: p.name, item: url }
  ] };
  const summary = summarizeDescription(p);
  const fullDescription = summary === p.description.trim()
    ? '<p>La descripción completa de este artículo está en la ficha principal. <a href="#product-detail">Volver a la ficha</a>.</p>'
    : `<p class="description">${e(p.description)}</p>`;
  const detail = `<section id="product-detail" class="product-detail product-hero" data-slug="${e(p.slug)}" aria-live="polite">
    <section class="carousel" aria-label="${e('Galería de imágenes de ' + p.name)}">
      <div class="product-image-frame${p.stock === 'Vendido' ? ' is-sold' : ''}"><img class="carousel-image" src="${e(image)}" alt="${e(p.name)}"></div>
      ${images.length > 1 ? `<div class="carousel-controls" hidden><button class="carousel-button previous" type="button">← Anterior</button><button class="carousel-button next" type="button">Siguiente →</button></div><div class="carousel-indicators" aria-label="Seleccionar imagen" hidden>${images.map((src, index) => `<button class="indicator" type="button" aria-label="Mostrar imagen ${index + 1}" aria-current="${index === 0}"><img src="${e(src)}" alt="" loading="lazy" width="54" height="66"></button>`).join('')}</div>` : ''}
    </section>
    <div class="product-info">
      <nav class="breadcrumb" aria-label="Ruta de navegación"><a href="/">Inicio</a> / <a href="/#catalogo">Catálogo</a> / <span>${e(p.category)}</span></nav>
      <p class="product-category">${e(p.category)} · ${e(p.subcategory)}</p>
      <p class="availability ${p.available ? 'available' : 'unavailable'}">${e(p.available ? 'Disponible' : p.stock || 'No disponible')}</p>
      <h1>${e(p.name)}</h1>
      <p class="price">${e(currency.format(p.price))}</p>
      <p class="product-summary">${e(summary)}</p>
      ${renderProductMetadata(p)}
      <section class="product-contact" aria-label="Contacto sobre este artículo"><a class="button contact-primary" href="${e(siteConfig.facebookUrl)}" target="_blank" rel="noopener noreferrer">Me interesa este artículo</a>
      ${p.facebookUrl && p.facebookUrl !== '#' ? `<a class="button button-secondary product-facebook-link" href="${e(p.facebookUrl)}" target="_blank" rel="noopener noreferrer">Ver publicación en Facebook</a>` : ''}</section>
    </div>
  </section>`;
  const related = products.filter(item => item.slug !== p.slug && (item.category === p.category || item.subcategory === p.subcategory)).slice(0, 4);
  const relatedHtml = related.length ? `<section class="related-products" aria-labelledby="related-title"><h2 id="related-title">Productos relacionados</h2><div class="related-products-grid">${related.map(renderRelatedProduct).join('')}</div></section>` : '';
  let html = template.replace(/<title>.*?<\/title>/, () => `<title>${e(p.name)} | Segunda Vida</title>`)
    .replace(/<meta\s+name="description"\s+content="[^"]*"\s*>/, () => `<meta name="description" content="${e(p.description)}">`)
    .replace(/<link rel="canonical"[^>]*>/, () => `<link rel="canonical" href="${e(url)}">`);
  for (const [key, value] of Object.entries({ title: p.name + ' | Segunda Vida', description: p.description, url, image })) {
    html = html.replace(new RegExp('<meta property="og:' + key + '"[^>]*>'), () => `<meta property="og:${key}" content="${e(value)}">`);
  }
  html = html.replace('</head>', () => `  <meta name="twitter:card" content="summary_large_image">\n  <script type="application/ld+json">${json(schema)}</script>\n  <script type="application/ld+json">${json(breadcrumb)}</script>\n</head>`)
    .replace(/(href|src)="(images\/|css\/|js\/)/g, '$1="/$2')
    .replace(/href="index.html"/g, 'href="/"')
    .replace('<section id="product-detail" aria-live="polite"></section>', () => detail)
    .replace('<!-- product-description -->', () => fullDescription)
    .replace('  <!-- related-products -->', () => relatedHtml ? '  ' + relatedHtml : '');
  const directory = path.join(root, 'productos', p.slug);
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'index.html'), html);
}
require('./generate-sitemap');
console.log(`Generadas ${products.length} páginas y sitemap.xml.`);
