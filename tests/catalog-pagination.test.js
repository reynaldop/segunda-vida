const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js/catalog.js'), 'utf8');
const catalogContext = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'js/catalog-data.js'), 'utf8'), catalogContext);
const originalData = JSON.parse(JSON.stringify(catalogContext.window.catalogData));

// DOM y History mínimos para ejecutar el módulo real completo sin servidor ni dependencias.
class Element {
  constructor(tag, id = '') {
    this.tag = tag; this.id = id; this.children = []; this.dataset = {}; this.attributes = {};
    this.listeners = {}; this.className = ''; this._value = ''; this.scrolls = [];
    this.classList = { add: name => { this.className += ' ' + name; } };
  }
  append(...children) { children.forEach(child => { if (child instanceof Element) child.parent = this; this.children.push(child); }); }
  appendChild(child) { this.append(child); }
  replaceChildren(...children) { this.children = []; this.append(...children); }
  get options() { return this.children; }
  set length(value) { this.children.length = value; }
  get value() { return this.tag === 'select' && !this.options.some(option => option.value === this._value) ? '' : this._value; }
  set value(value) { this._value = value; }
  setAttribute(key, value) { this.attributes[key] = value; }
  addEventListener(type, listener) { (this.listeners[type] ||= []).push(listener); }
  matches(selector) {
    if (selector.startsWith('.')) return this.className.split(' ').includes(selector.slice(1));
    const match = selector.match(/^(\w+)?(?:\[([\w-]+)(?:="([^"]*)")?\])?$/);
    if (!match || (match[1] && this.tag !== match[1])) return false;
    if (!match[2]) return true;
    const key = match[2].replace(/^data-/, '').replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    const value = match[2].startsWith('data-') ? this.dataset[key] : this.attributes[match[2]];
    return value !== undefined && (match[3] === undefined || value === match[3]);
  }
  closest(selector) { return this.matches(selector) ? this : this.parent?.closest(selector); }
  querySelectorAll(selector) { return this.children.flatMap(child => child instanceof Element ? [...(child.matches(selector) ? [child] : []), ...child.querySelectorAll(selector)] : []); }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  contains(node) { return node === this || this.children.some(child => child instanceof Element && child.contains(node)); }
  cloneNode() { const clone = new Element(this.tag); clone.dataset = { ...this.dataset }; return clone; }
  dispatch(type) {
    if (type === 'click' && this.disabled) return;
    const event = { target: this, preventDefault() {} };
    for (let node = this; node; node = node.parent) (node.listeners[type] || []).forEach(listener => listener(event));
  }
  getBoundingClientRect() { return this.id === 'site-header' ? { top: 0, bottom: 65 } : { top: 100, bottom: 160 }; }
  focus() { this.focused = true; }
  scrollIntoView(options) { this.scrolls.push(options); }
}
function fixture(count, overrides = {}) {
  return Array.from({ length: count }, (_, i) => ({ ...originalData.products[0], id: i + 100, sku: 'TEST-' + i,
    slug: 'articulo-' + i, name: 'Artículo ' + i, description: i < 3 ? 'Coincidencia especial' : 'Descripción general',
    category: 'Ropa', subcategory: 'Mujer', ...overrides }));
}
function setup(products = originalData.products, query = '', reducedMotion = false) {
  const data = { ...originalData, products: products.map(product => ({ ...product })) };
  const elements = {};
  for (const id of ['search', 'product-list', 'results-count', 'empty-state', 'pagination', 'category-shortcuts', 'catalogo', 'catalog-contact', 'site-header']) elements[id] = new Element('div', id);
  for (const id of ['category-filter', 'subcategory-filter']) { elements[id] = new Element('select', id); const option = new Element('option'); option.value = ''; elements[id].append(option); }
  const showcase = new Element('section'); showcase.className = 'category-showcase'; showcase.append(elements['category-shortcuts']);
  const icons = new Element('template'); icons.content = new Element('fragment');
  const defaultIcon = new Element('svg'); defaultIcon.dataset.categoryIcon = 'default'; icons.content.append(defaultIcon); elements['category-icons'] = icons;
  const hero = new Element('a');
  const windowListeners = {}; const timers = new Map(); let timerId = 0;
  let entries = ['https://reyko.site/' + query]; let entryIndex = 0;
  const history = {
    pushState(_, __, url) { entries = entries.slice(0, entryIndex + 1); entries.push(url); entryIndex++; },
    replaceState(_, __, url) { entries[entryIndex] = url; },
    back() { if (entryIndex > 0) { entryIndex--; (windowListeners.popstate || []).forEach(listener => listener()); } },
    forward() { if (entryIndex < entries.length - 1) { entryIndex++; (windowListeners.popstate || []).forEach(listener => listener()); } }
  };
  const window = { catalogData: data, history, innerHeight: 900,
    get location() { return new URL(entries[entryIndex]); },
    matchMedia() { return { matches: reducedMotion }; },
    addEventListener(type, listener) { (windowListeners[type] ||= []).push(listener); }
  };
  vm.runInNewContext(source, { window, document: { getElementById: id => elements[id], createElement: tag => new Element(tag), querySelector: () => hero },
    URL, URLSearchParams, Intl, console, setTimeout(callback) { const id = ++timerId; timers.set(id, callback); return id; }, clearTimeout(id) { timers.delete(id); } });
  return { data, elements, history, hero, get url() { return window.location; },
    get count() { return elements['product-list'].children.length; },
    get result() { return elements['results-count'].textContent; },
    get activePage() { return elements.pagination.children.find(node => node.attributes['aria-current'] === 'page')?.textContent; },
    get buttons() { return elements.pagination.querySelectorAll('button[data-page]'); },
    flush() { const callbacks = [...timers.values()]; timers.clear(); callbacks.forEach(callback => callback()); },
    page(label) { const button = elements.pagination.children.find(node => node.textContent === label); assert.ok(button, label); button.dispatch('click'); },
    filter(id, value) { elements[id].value = value; elements[id].dispatch(id === 'search' ? 'input' : 'change'); },
    shortcut(name) { const button = elements['category-shortcuts'].children.map(item => item.children[0]).find(button => button.children[1].textContent === name); assert.ok(button, name); button.dispatch('click'); }
  };
}

test('8 productos: contador total y paginador oculto', () => {
  const ui = setup(); assert.equal(ui.count, 8); assert.equal(ui.result, '8 productos encontrados'); assert.equal(ui.elements.pagination.hidden, true);
});
test('límites de cero y una página: sin navegación ni página inválida visible', () => {
  for (const count of [0, 12]) {
    const ui = setup(fixture(count), '?page=99'); assert.equal(ui.count, count); assert.equal(ui.elements.pagination.hidden, true);
    assert.equal(ui.url.searchParams.get('page'), '1'); assert.equal(ui.elements['empty-state'].hidden, count !== 0);
  }
});
test('URL directa ?page=2 abre la segunda página sin crear una entrada adicional de historial', () => {
  const ui = setup(fixture(13), '?page=2'); assert.equal(ui.count, 1); assert.equal(ui.activePage, '2');
  ui.history.back(); assert.equal(ui.activePage, '2');
});
test('13 productos: 12 + 1, botones, contador total, enlaces de fotografías y scroll', () => {
  const ui = setup(fixture(13)); assert.equal(ui.count, 12); assert.equal(ui.buttons[0].disabled, true);
  ui.page('Siguiente →'); assert.equal(ui.count, 1); assert.equal(ui.result, '13 productos encontrados'); assert.equal(ui.activePage, '2');
  assert.equal(ui.url.searchParams.get('page'), '2'); assert.equal(ui.buttons.at(-1).disabled, true);
  const card = ui.elements['product-list'].children[0]; assert.equal(card.children[0].children[0].href, card.children[1].children[5].href);
  assert.equal(ui.elements.catalogo.scrolls.at(-1).behavior, 'smooth'); assert.equal(ui.elements.catalogo.focused, true);
});
test('búsqueda con pocos resultados elimina paginador y vuelve a página 1', () => {
  const ui = setup(fixture(26), '?page=2'); ui.filter('search', 'Coincidencia'); ui.flush();
  assert.equal(ui.count, 3); assert.equal(ui.result, '3 productos encontrados'); assert.equal(ui.elements.pagination.hidden, true); assert.equal(ui.url.searchParams.get('page'), '1');
});
test('categoría con 13 resultados y cambio de categoría/subcategoría/tarjeta desde página 2', () => {
  const ui = setup([...fixture(13), ...fixture(13, { category: 'Hogar', subcategory: 'Muebles' })], '?page=2');
  ui.filter('category-filter', 'Ropa'); assert.equal(ui.result, '13 productos encontrados'); assert.equal(ui.activePage, '1');
  ui.page('2'); ui.filter('subcategory-filter', 'Mujer'); assert.equal(ui.activePage, '1');
  ui.page('2'); ui.shortcut('Hogar'); assert.equal(ui.activePage, '1'); assert.equal(ui.result, '13 productos encontrados'); assert.equal(ui.url.searchParams.get('categoria'), 'Hogar');
});
test('URL inicial aplica categoría y página sin filtrar después de paginar', () => {
  const ui = setup([...fixture(5, { category: 'Juguetes', subcategory: 'Retro' }), ...fixture(13)], '?categoria=Ropa&page=2');
  assert.equal(ui.count, 1); assert.equal(ui.result, '13 productos encontrados'); assert.equal(ui.activePage, '2');
  assert.ok(ui.elements['product-list'].children.every(card => card.children[1].children[0].textContent === 'Ropa · Mujer'));
});
test('página inválida se normaliza y una página demasiado alta se ajusta al máximo', () => {
  for (const [page, expected] of [['99', '2'], ['0', '1'], ['-2', '1'], ['1.5', '1'], ['abc', '1'], ['Infinity', '1'], ['9007199254740992', '1']]) {
    const ui = setup(fixture(13), '?page=' + page); assert.equal(ui.activePage, expected); assert.equal(ui.url.searchParams.get('page'), expected); assert.ok(ui.count > 0);
  }
  const small = setup(originalData.products, '?page=2'); assert.equal(small.count, 8); assert.equal(small.url.searchParams.get('page'), '1');
});
test('Atrás/Adelante restaura búsqueda, categoría, subcategoría y página, preservando otros parámetros y hash', () => {
  const ui = setup(fixture(26), '?categoria=Ropa&subcategoria=Mujer&busqueda=Artículo&page=2&ref=prueba#catalogo');
  ui.filter('search', 'Coincidencia'); ui.flush(); assert.equal(ui.count, 3);
  ui.history.back(); assert.equal(ui.activePage, '2'); assert.equal(ui.count, 12); assert.equal(ui.elements.search.value, 'Artículo');
  assert.equal(ui.elements['category-filter'].value, 'Ropa'); assert.equal(ui.elements['subcategory-filter'].value, 'Mujer');
  ui.history.forward(); assert.equal(ui.count, 3); assert.equal(ui.elements.search.value, 'Coincidencia');
  assert.equal(ui.url.searchParams.get('ref'), 'prueba'); assert.equal(ui.url.hash, '#catalogo');
});
test('30 páginas se presentan con primera/última, vecinos y puntos suspensivos', () => {
  const ui = setup(fixture(360), '?page=6');
  const numbers = ui.buttons.filter(button => /^\d+$/.test(button.textContent)).map(button => button.textContent);
  assert.deepEqual(numbers, ['1', '4', '5', '6', '7', '8', '30']); assert.equal(ui.elements.pagination.children.filter(node => node.textContent === '…').length, 2);
  assert.ok(ui.buttons.every(button => button.tag === 'button' && button.type === 'button')); assert.equal(ui.elements.pagination.listeners.click.length, 1);
});
test('cambiar de página reutiliza resultados filtrados, sin recorrer nuevamente el catálogo', () => {
  const ui = setup(fixture(26)); let filters = 0;
  ui.data.products.filter = function (callback) { filters++; return Array.prototype.filter.call(this, callback); };
  ui.page('2'); ui.page('3'); assert.equal(filters, 0);
});
test('búsqueda pendiente se aplica antes de navegar, sin resultados de un filtro anterior', () => {
  const ui = setup(fixture(26), '?page=2'); ui.filter('search', 'no-existe'); ui.page('← Anterior'); ui.flush();
  assert.equal(ui.count, 0); assert.equal(ui.elements['empty-state'].hidden, false); assert.equal(ui.elements.pagination.hidden, true); assert.equal(ui.url.searchParams.get('page'), '1');
});
test('Todos limpia los tres filtros y página; se respeta movimiento reducido', () => {
  const ui = setup(fixture(26), '?categoria=Ropa&subcategoria=Mujer&busqueda=Artículo&page=2', true); ui.shortcut('Todos');
  for (const id of ['search', 'category-filter', 'subcategory-filter']) assert.equal(ui.elements[id].value, '');
  assert.equal(ui.count, 12); assert.equal(ui.result, '26 productos encontrados'); assert.equal(ui.activePage, '1');
  for (const name of ['categoria', 'subcategoria', 'busqueda']) assert.equal(ui.url.searchParams.has(name), false);
  ui.page('2'); assert.equal(ui.elements.catalogo.scrolls.at(-1).behavior, 'auto');
});
