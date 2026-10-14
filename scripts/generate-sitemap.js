// Ejecutar desde cualquier directorio: node scripts/generate-sitemap.js
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const baseUrl = new URL("https://" + fs.readFileSync(path.join(root, "CNAME"), "utf8").trim() + "/");
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, "js/catalog-data.js"), "utf8"), context);

function escapeXml(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

const seenUrls = new Set();
function entry(url, images = []) {
  if (seenUrls.has(url)) throw new Error("URL duplicada: " + url);
  seenUrls.add(url);
  const lines = ["  <url>", "    <loc>" + escapeXml(url) + "</loc>"];
  for (const image of new Set(images.filter(Boolean).map(image => new URL(image, baseUrl).href))) {
    lines.push("    <image:image>", "      <image:loc>" + escapeXml(image) + "</image:loc>", "    </image:image>");
  }
  lines.push("  </url>");
  return lines.join("\n");
}

const entries = [entry(baseUrl.href)];
// Las fichas vendidas siguen siendo indexables; los productos comentados no se cargan.
// No hay fechas confiables en el catálogo: se omite lastmod.
for (const product of context.window.catalogData.products) {
  if (!product.slug) throw new Error("Producto sin slug: " + product.sku);
  const url = new URL("product.html?slug=" + encodeURIComponent(product.slug), baseUrl).href;
  entries.push(entry(url, product.images || []));
}

fs.writeFileSync(path.join(root, "sitemap.xml"), [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
  ...entries,
  "</urlset>",
  ""
].join("\n"));
