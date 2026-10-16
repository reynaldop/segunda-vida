// Ejecutar desde cualquier directorio: node scripts/generate-products.js
const fs = require('node:fs');
const path = require('node:path');
const { root, products, siteConfig, productPath, absolute, escape: e } = require('./catalog');
const template = fs.readFileSync(path.join(root, 'product.html'), 'utf8');
const currency = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });
const json = value => JSON.stringify(value, null, 2).replace(/</g, '\\u003c');
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
  const detail = `<section id="product-detail" class="product-detail" data-slug="${e(p.slug)}" aria-live="polite">
    <section class="carousel" aria-label="${e('Galería de imágenes de ' + p.name)}">
      <div class="product-image-frame${p.stock === 'Vendido' ? ' is-sold' : ''}"><img class="carousel-image" src="${e(image)}" alt="${e(p.name)}"></div>
    </section>
    <div class="product-info">
      <h1>${e(p.name)}</h1>
      <p class="price">${e(currency.format(p.price))}</p>
      <p class="availability ${p.available ? 'available' : 'unavailable'}">${e(p.available ? 'Disponible' : p.stock || 'No disponible')}</p>
      <p class="description">${e(p.description)}</p>
      <ul class="product-meta">${[['Marca', p.brand], ['Categoría', p.category], ['Subcategoría', p.subcategory], ['Condición', p.condition]].map(([label, value]) => `<li><strong>${label}:</strong> ${e(value)}</li>`).join('')}</ul>
      ${p.facebookUrl && p.facebookUrl !== '#' ? `<a class="product-facebook-link" href="${e(p.facebookUrl)}" target="_blank" rel="noopener noreferrer">Ver en Facebook</a>` : ''}
      <section class="product-contact" aria-label="Contacto sobre este artículo"><p>¿Te gustó este artículo?</p><a href="${e(siteConfig.facebookUrl)}" target="_blank" rel="noopener noreferrer">Contáctame por Facebook</a></section>
    </div>
  </section>`;
  let html = template.replace(/<title>.*?<\/title>/, () => `<title>${e(p.name)} | Segunda Vida</title>`)
    .replace(/<meta\s+name="description"\s+content="[^"]*"\s*>/, () => `<meta name="description" content="${e(p.description)}">`)
    .replace(/<link rel="canonical"[^>]*>/, () => `<link rel="canonical" href="${e(url)}">`);
  for (const [key, value] of Object.entries({ title: p.name + ' | Segunda Vida', description: p.description, url, image })) {
    html = html.replace(new RegExp('<meta property="og:' + key + '"[^>]*>'), () => `<meta property="og:${key}" content="${e(value)}">`);
  }
  html = html.replace('</head>', () => `  <meta name="twitter:card" content="summary_large_image">\n  <script type="application/ld+json">${json(schema)}</script>\n  <script type="application/ld+json">${json(breadcrumb)}</script>\n</head>`)
    .replace(/(href|src)="(images\/|css\/|js\/)/g, '$1="/$2')
    .replace(/href="index.html"/g, 'href="/"')
    .replace('<section id="product-detail" aria-live="polite"></section>', () => detail);
  const directory = path.join(root, 'productos', p.slug);
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'index.html'), html);
}
require('./generate-sitemap');
console.log(`Generadas ${products.length} páginas y sitemap.xml.`);
