const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const baseUrl = new URL('https://' + fs.readFileSync(path.join(root, 'CNAME'), 'utf8').trim() + '/');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'js/catalog-data.js'), 'utf8'), context, { timeout: 1000 });
// Solo productos activos en el archivo; los vendidos siguen siendo indexables.
const { products, siteConfig } = context.window.catalogData;
const slugs = new Set();
for (const product of products) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(product.slug || '')) throw new Error('Slug inválido: ' + product.sku);
  if (slugs.has(product.slug)) throw new Error('Slug duplicado: ' + product.slug);
  slugs.add(product.slug);
}
const productPath = product => '/productos/' + product.slug + '/';
const absolute = value => new URL(value, baseUrl).href;
const escape = value => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
module.exports = { root, baseUrl, products, siteConfig, productPath, absolute, escape };
