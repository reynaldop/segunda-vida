// Helpers de presentación: no modifican el catálogo ni generan URLs.
const { escape: e } = require('./catalog');
const icons = {
  brand: '<path d="m3 3 8 1 10 10-7 7L4 11Z"/><circle cx="8" cy="8" r="1.5"/>',
  category: '<path d="M3 6h7l2 2h9v12H3Z"/>',
  subcategory: '<path d="m12 3 10 5-10 5L2 8Zm-10 9 10 5 10-5M2 16l10 5 10-5"/>',
  size: '<path d="m3 16 13-13 5 5L8 21ZM7 12l3 3m1-7 3 3m1-7 3 3"/>',
  condition: '<path d="M12 3 3 7v6c0 5 9 8 9 8s9-3 9-8V7Z"/><path d="m8 12 3 3 5-6"/>',
  sku: '<path d="m8 5-6 7 6 7m8-14 6 7-6 7m-3-16-2 18"/>'
};
function renderProductMetadata(product) {
  // Una talla escrita explícitamente en el nombre es información del catálogo.
  const size = product.size || product.talla || (product.name.match(/\btalla\s+(.+)$/iu) || [])[1];
  const rows = [
    ['Marca', product.brand, 'brand'], ['Categoría', product.category, 'category'],
    ['Subcategoría', product.subcategory, 'subcategory'], ['Talla', size, 'size'],
    ['Condición', product.condition, 'condition'], ['SKU', product.sku, 'sku']
  ];
  return '<ul class="product-meta">' + rows.filter(([, value]) => value !== undefined && value !== null && value !== '').map(([label, value, icon]) =>
    `<li><svg class="product-meta__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[icon]}</svg><span><strong>${label}:</strong> ${e(value)}</span></li>`
  ).join('') + '</ul>';
}
function summarizeDescription(product) {
  const text = String(product.shortDescription || product.description || '').trim();
  const characters = Array.from(text);
  if (characters.length <= 180) return text;
  const excerpt = characters.slice(0, 177).join('');
  const lastSpace = excerpt.lastIndexOf(' ');
  return (lastSpace > 0 ? excerpt.slice(0, lastSpace) : excerpt) + '…';
}
module.exports = { renderProductMetadata, summarizeDescription };
