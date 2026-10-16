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
activa el carrusel, los thumbnails, los contactos y la analítica sin reemplazar
el contenido estático. Los relacionados se generan por categoría o subcategoría
(máximo cuatro). `js/layout.js` renderiza el header y el footer y controla
la navegación global y el menú móvil accesible. Las páginas solo contienen
`<div id="site-header"></div>` y `<div id="site-footer"></div>`; el generador
no copia markup global. Para añadir páginas, incluir esos placeholders, un
`<main id="contenido">` y `<script src="/js/layout.js?v=15" defer></script>`.
Cargar `/js/catalog-data.js?v=14` antes del layout (en las plantillas actuales,
el script de datos se ejecuta durante el parseo y el layout usa `defer`).
Las URLs oficiales de Facebook e Instagram se mantienen únicamente en
`catalogData.siteConfig`; el layout consume esa configuración sin usar productos.
El layout no depende de los scripts de interacción del catálogo ni del producto y no modifica
el contenido SEO estático. Sus rutas parten de `/` para funcionar desde fichas
anidadas. El CSS reserva la altura del header para evitar saltos al renderizarlo.
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

La presentación principal se genera estáticamente: descripción breve y metadata
con SVG a la derecha de la galería. `scripts/render-product-details.js` resume
la descripción sin alterar los datos y muestra talla solo si está definida o
escrita explícitamente en el nombre. La descripción ampliada queda abajo cuando
aporta texto adicional; no se repite toda la ficha técnica.

`scripts/render-related-product.js` genera exclusivamente la variante compacta
`.related-product-card`; la selección de relacionados sigue en el generador,
sin cambios. No se necesita `product-ui.js` para reubicar contenido. El bloque de
beneficios sigue compartido desde `layout.js`.

## Catálogo y paginación

`PRODUCTS_PER_PAGE` en `js/catalog.js` define el tamaño de página. Primero se
filtra y ordena el catálogo; los cambios de página solo paginan el resultado
conservado en memoria. `categoria`, `subcategoria`, `busqueda` y `page` se
sincronizan en la URL para restaurar la vista al cargar o usar Atrás/Adelante.
Ejemplo: `/?categoria=Ropa&page=2`. La página 1 puede omitir `page`; las páginas
inválidas se normalizan con `replaceState` sin añadir historial.

Pruebas de integración sin dependencias, usando datos de prueba en memoria:

```sh
node --test tests/catalog-pagination.test.js
```
