# Páginas estáticas de Segunda Vida

La fuente de productos sigue siendo `js/catalog-data.js`. No hay backend,
frameworks, paquetes npm ni dependencias adicionales para generar las páginas.

Desde la raíz del proyecto:

```sh
node scripts/generate-products.js
python3 scripts/validate-products.py
git diff --check
```

El generador usa `product.html` como plantilla del sitio y las clases de
`css/styles.css`. Cada `productos/<slug>/index.html` contiene el producto visible,
SEO, Product y BreadcrumbList completos sin ejecutar JavaScript. `js/product.js`
activa el carrusel, los contactos y la analítica usando la misma fuente de datos.
La plantilla también conserva el acceso antiguo `product.html?slug=...`, que
redirige con JavaScript a la URL estática correspondiente.

`scripts/catalog.js` carga el catálogo, rechaza slugs inválidos o duplicados y
centraliza la URL base de `CNAME`. Los productos comentados quedan excluidos;
los vendidos conservan su página y declaran `OutOfStock`. No existen fechas
reales en los datos actuales, por eso no se emite `lastmod`.

El generador actualiza también `sitemap.xml`. Se puede regenerar únicamente el
sitemap con `node scripts/generate-sitemap.js`. El sitemap incluye inicio,
productos e imágenes, sin `priority`, `changefreq` ni `image:title`.

Después de modificar el catálogo o la plantilla, regenerar y versionar los HTML
y el sitemap junto con los cambios. Si se elimina o comenta un producto que ya
tenía página generada, retirar su carpeta de `productos/`; la validación detecta
carpetas sobrantes. GitHub Pages sirve directamente los archivos resultantes.

Ejemplo completo: `productos/suicide-squad-vol-7-drenar-el-pantano/index.html`.
