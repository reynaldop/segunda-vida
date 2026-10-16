"""Validación local sin dependencias: python3 scripts/validate-products.py."""
import json
from html.parser import HTMLParser
from pathlib import Path
import subprocess
from urllib.parse import urlparse, unquote
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
products = json.loads(subprocess.check_output(['node', '-e', "console.log(JSON.stringify(require('./scripts/catalog').products))"], cwd=ROOT))
VOID = set('area base br col embed hr img input link meta param source track wbr'.split())

class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack, self.links, self.metas, self.schemas = [], [], {}, []
        self.h1, self.title, self.canonical = '', '', ''
        self.script = None
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag not in VOID:
            self.stack.append(tag)
        for key in ('href', 'src'):
            if key in a:
                self.links.append(a[key])
        if tag == 'meta':
            self.metas[a.get('name', a.get('property'))] = a.get('content')
        if tag == 'link' and a.get('rel') == 'canonical':
            self.canonical = a['href']
        if tag == 'script' and a.get('type') == 'application/ld+json':
            self.script = ''
    def handle_endtag(self, tag):
        if tag == 'script' and self.script is not None:
            self.schemas.append(json.loads(self.script))
            self.script = None
        assert self.stack and self.stack.pop() == tag, f'Etiqueta desbalanceada: {tag}'
    def handle_data(self, data):
        if self.stack and self.stack[-1] == 'h1':
            self.h1 += data
        if self.stack and self.stack[-1] == 'title':
            self.title += data
        if self.script is not None:
            self.script += data

slugs = [p['slug'] for p in products]
assert len(slugs) == len(set(slugs))
assert {p.name for p in (ROOT / 'productos').iterdir() if p.is_dir()} == set(slugs)
ns = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9', 'i': 'http://www.google.com/schemas/sitemap-image/1.1'}
sitemap = ET.parse(ROOT / 'sitemap.xml')
urls = sitemap.findall('s:url', ns)
entries = {entry.find('s:loc', ns).text: entry for entry in urls}
assert len(entries) == len(urls), 'URLs duplicadas en el sitemap'
assert all(not urlparse(url).query and 'product.html' not in url for url in entries)
assert len(entries) == len(products) + 1
assert not any(node.tag.split('}')[-1] in ('priority', 'changefreq', 'title', 'lastmod') for node in sitemap.iter())
for p in products:
    url = 'https://reyko.site/productos/' + p['slug'] + '/'
    page = Page()
    html = (ROOT / 'productos' / p['slug'] / 'index.html').read_text()
    assert html.lower().startswith('<!doctype html>')
    page.feed(html)
    assert not page.stack
    assert page.h1 == p['name'] and p['name'] in page.title
    assert page.canonical == url and page.metas['og:url'] == url
    for key in ('description', 'og:title', 'og:description', 'og:image', 'twitter:card'):
        assert page.metas[key]
    schema = next(s for s in page.schemas if s['@type'] == 'Product')
    for key in ('name', 'description', 'sku'):
        assert schema[key] == p[key]
    assert schema['brand']['name'] == p['brand']
    assert float(schema['offers']['price']) == p['price']
    assert schema['offers']['priceCurrency'] == 'MXN'
    assert schema['offers']['availability'].endswith('InStock' if p['available'] else 'OutOfStock')
    seo_images = [page.metas['og:image'], *schema['image']]
    assert all(i.startswith('https://reyko.site/') for i in seo_images)
    assert {i.text for i in entries[url].findall('i:image/i:loc', ns)} == {'https://reyko.site/' + i for i in p['images']}
    for link in page.links + seo_images:
        parsed = urlparse(link)
        if parsed.netloc and parsed.netloc != 'reyko.site':
            continue
        local = ROOT / unquote(parsed.path).lstrip('/')
        if parsed.path.endswith('/'):
            local /= 'index.html'
        assert local.is_file(), f'Enlace roto: {link}'
assert '"/productos/" + encodeURIComponent(product.slug) + "/"' in (ROOT / 'js/catalog.js').read_text()
assert 'product.html?slug=' not in (ROOT / 'js/catalog.js').read_text()
print(f'OK: {len(products)} carpetas, HTML, SEO, JSON-LD, enlaces e imágenes; sitemap con {len(entries)} URLs.')
