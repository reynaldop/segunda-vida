(function () {
  "use strict";
  var data = window.catalogData;
  var searchInput = document.getElementById("search");
  var categorySelect = document.getElementById("category-filter");
  var subcategorySelect = document.getElementById("subcategory-filter");
  var productList = document.getElementById("product-list");
  var resultsCount = document.getElementById("results-count");
  var emptyState = document.getElementById("empty-state");
  var pagination = document.getElementById("pagination");
  var categoryShortcuts = document.getElementById("category-shortcuts");
  var catalogSection = document.getElementById("catalogo");
  var catalogContact = document.getElementById("catalog-contact");
  var currency = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
  const PRODUCTS_PER_PAGE = 12;
  var filteredProducts = [];
  var searchTimeout = null;
  var currentPage = 1;
  function addOption(select, value, label) { var option = document.createElement("option"); option.value = value; option.textContent = label; select.appendChild(option); }
  function createFacebookLink() {
    var link = document.createElement("a");
    link.href = data.siteConfig.facebookUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Facebook";

    // Google Analytics 4 - Contacto Facebook desde catálogo
    link.addEventListener("click", function () {

      if (typeof gtag === "function") {

        gtag("event", "contact_facebook_catalog", {
          source: "catalog",
          facebook_url: data.siteConfig.facebookUrl
        });

      }

    });

    return link;
  }
  function renderCatalogContact() { var question = document.createElement("p"); question.textContent = "¿Te gustó alguno de nuestros artículos?"; var message = document.createElement("p"); message.append("Consultas y disponibilidad en ", createFacebookLink(), "."); catalogContact.append(question, message); }
  function populateCategories() { data.categories.forEach(function (category) { addOption(categorySelect, category.name, category.name); }); }
  function renderCategoryShortcuts() {
    if (!categoryShortcuts) return;
    var icons = document.getElementById("category-icons").content;
    var shortcuts = [{ name: "Todos", value: "" }].concat(data.categories.map(function (category) {
      return { name: category.name, value: category.name };
    }));
    shortcuts.forEach(function (category) {
      var item = document.createElement("li");
      var button = document.createElement("button");
      button.type = "button";
      button.dataset.category = category.value;
      button.setAttribute("aria-pressed", "false");
      button.setAttribute("aria-controls", "product-list");
      var icon = Array.from(icons.children).find(function (image) {
        return image.dataset.categoryIcon === category.name;
      }) || icons.querySelector('[data-category-icon="default"]');
      var frame = document.createElement("span");
      frame.className = "category-icon";
      frame.setAttribute("aria-hidden", "true");
      if (icon) frame.appendChild(icon.cloneNode(true));
      var label = document.createElement("span");
      label.textContent = category.name;
      button.append(frame, label);
      item.appendChild(button);
      categoryShortcuts.appendChild(item);
    });
    categoryShortcuts.closest(".category-showcase").hidden = false;
  }
  function updateCategoryShortcuts() {
    if (!categoryShortcuts) return;
    var hasFilters = Boolean(searchInput.value.trim() || categorySelect.value || subcategorySelect.value);
    categoryShortcuts.querySelectorAll("button[data-category]").forEach(function (button) {
      var active = button.dataset.category ? button.dataset.category === categorySelect.value : !hasFilters;
      button.setAttribute("aria-pressed", String(active));
    });
  }
  function resetFilters() {
    clearTimeout(searchTimeout);
    searchInput.value = "";
    subcategorySelect.value = "";
    applyCategory("");
    scrollToCatalog(true);
  }
  function setCategorySelection(name) {
    categorySelect.value = data.categories.some(function (category) { return category.name === name; }) ? name : "";
    populateSubcategories(categorySelect.value);
  }
  function applyCategory(name) {
    setCategorySelection(name);
    applyFilters();
  }
  function updateUrlState(mode) {
    var url = new URL(window.location.href);
    [["categoria", categorySelect.value], ["subcategoria", subcategorySelect.value], ["busqueda", searchInput.value.trim()]].forEach(function (entry) {
      if (entry[1]) url.searchParams.set(entry[0], entry[1]);
      else url.searchParams.delete(entry[0]);
    });
    // La ausencia de page significa página 1; conservar un page explícito.
    if (currentPage > 1 || url.searchParams.has("page")) url.searchParams.set("page", String(currentPage));
    if (url.href !== window.location.href) window.history[mode + "State"](null, "", url.href);
  }
  function restoreUrlState() {
    clearTimeout(searchTimeout);
    searchTimeout = null;
    var params = new URLSearchParams(window.location.search);
    searchInput.value = params.get("busqueda") || "";
    subcategorySelect.value = "";
    setCategorySelection(params.get("categoria") || "");
    var subcategory = params.get("subcategoria") || "";
    if (Array.from(subcategorySelect.options).some(function (option) { return option.value === subcategory; })) subcategorySelect.value = subcategory;
    var requestedPage = Number(params.get("page") || 1);
    currentPage = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    refreshCatalog("replace");
  }
  function scrollToCatalog(onlyIfNeeded) {
    if (onlyIfNeeded) {
      var bounds = catalogSection.getBoundingClientRect();
      var header = document.getElementById("site-header");
      var headerBottom = header ? header.getBoundingClientRect().bottom : 0;
      if (bounds.top >= headerBottom && bounds.bottom <= window.innerHeight) return;
    }
    catalogSection.focus({ preventScroll: true });
    catalogSection.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start"
    });
  }
  function populateSubcategories(categoryName) {
    var selectedValue = subcategorySelect.value;
    subcategorySelect.length = 1;
    var category = data.categories.find(function (item) { return item.name === categoryName; });
    var subcategories = category ? category.subcategories : data.categories.reduce(function (all, item) { return all.concat(item.subcategories); }, []);
    subcategories.forEach(function (subcategory) { addOption(subcategorySelect, subcategory, subcategory); });
    subcategorySelect.disabled = subcategories.length === 0;
    if (subcategories.indexOf(selectedValue) !== -1) subcategorySelect.value = selectedValue;
  }
  function paginateProducts(products, page, perPage) {
    var totalPages = Math.max(1, Math.ceil(products.length / perPage));
    var validPage = Math.min(Math.max(page, 1), totalPages);
    var start = (validPage - 1) * perPage;
    return { products: products.slice(start, start + perPage), page: validPage, totalPages: totalPages };
  }
  function createPageButton(label, page, disabled, current) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "pagination-button";
    button.textContent = label;
    button.dataset.page = String(page);
    button.disabled = disabled;
    button.setAttribute("aria-controls", "product-list");
    if (current) button.setAttribute("aria-current", "page");
    return button;
  }
  function renderPagination(totalPages) {
    pagination.replaceChildren();
    pagination.hidden = totalPages <= 1;
    if (pagination.hidden) return;
    pagination.appendChild(createPageButton("← Anterior", currentPage - 1, currentPage === 1));
    var pages = new Set([1, totalPages]);
    for (var page = Math.max(1, currentPage - 2); page <= Math.min(totalPages, currentPage + 2); page += 1) pages.add(page);
    var previous = 0;
    Array.from(pages).sort(function (a, b) { return a - b; }).forEach(function (page) {
      if (previous && page - previous > 1) {
        var ellipsis = document.createElement("span");
        ellipsis.className = "pagination-ellipsis";
        ellipsis.textContent = "…";
        ellipsis.setAttribute("aria-hidden", "true");
        pagination.appendChild(ellipsis);
      }
      pagination.appendChild(createPageButton(String(page), page, false, page === currentPage));
      previous = page;
    });
    pagination.appendChild(createPageButton("Siguiente →", currentPage + 1, currentPage === totalPages));
  }
  function filterProducts() {
    var term = searchInput.value.trim().toLocaleLowerCase("es");
    var category = categorySelect.value;
    var subcategory = subcategorySelect.value;
    return data.products.filter(function (product) {
      return (!term || (product.name + " " + product.description).toLocaleLowerCase("es").indexOf(term) !== -1) &&
        (!category || product.category === category) && (!subcategory || product.subcategory === subcategory);
    }).sort(function (first, second) { return Number(second.available) - Number(first.available); });
  }
  function refreshCatalog(urlMode) {
    filteredProducts = filterProducts();
    renderCurrentPage(urlMode);
  }
  function applyFilters() {
    clearTimeout(searchTimeout);
    searchTimeout = null;
    currentPage = 1;
    refreshCatalog("push");
  }
  function renderCurrentPage(urlMode) {
    var result = paginateProducts(filteredProducts, currentPage, PRODUCTS_PER_PAGE);
    currentPage = result.page;
    renderProducts(result.products);
    resultsCount.textContent = filteredProducts.length === 1 ? "1 producto encontrado" : filteredProducts.length + " productos encontrados";
    emptyState.hidden = filteredProducts.length !== 0;
    renderPagination(result.totalPages);
    updateCategoryShortcuts();
    updateUrlState(urlMode);
  }
  function changePage(page) {
    // Aplicar una búsqueda pendiente antes de navegar por los resultados.
    if (searchTimeout !== null) applyFilters();
    else {
      if (page === currentPage) return;
      currentPage = page;
      renderCurrentPage("push");
    }
    scrollToCatalog();
  }
  function getProductUrl(slug) { return "/productos/" + encodeURIComponent(slug) + "/"; }
  function renderProducts(products) {
    productList.replaceChildren();
    products.forEach(function (product) {
      var productUrl = getProductUrl(product.slug);
      var article = document.createElement("article"); article.className = "product-card";
      var image = document.createElement("img"); image.src = product.images[0]; image.loading = "lazy"; image.width = 400; image.height = 500; image.alt = product.name;
      var imageLink = document.createElement("a");
      imageLink.className = "product-card__image-link";
      imageLink.href = productUrl;
      imageLink.setAttribute("aria-label", "Ver detalle de " + product.name);
      imageLink.appendChild(image);
      var imageFrame = document.createElement("div"); imageFrame.className = "product-image-frame"; imageFrame.appendChild(imageLink);
      if (product.stock === "Vendido") imageFrame.classList.add("is-sold");
      var content = document.createElement("div"); content.className = "card-content";
      var categoryText = document.createElement("p"); categoryText.className = "card-category"; categoryText.textContent = product.category + " · " + product.subcategory;
      var title = document.createElement("h2"); title.className = "card-title";
      var titleLink = document.createElement("a"); titleLink.href = productUrl; titleLink.textContent = product.name; title.appendChild(titleLink);
      var brand = document.createElement("p"); brand.className = "product-brand"; brand.textContent = product.brand;
      var price = document.createElement("p"); price.className = "price"; price.textContent = currency.format(product.price);
      var availability = document.createElement("p"); availability.className = "availability " + (product.available ? "available" : "unavailable"); availability.textContent = product.available ? "Disponible" : (product.stock || "No disponible");
      var detailLink = document.createElement("a"); detailLink.className = "detail-link"; detailLink.href = productUrl; detailLink.textContent = "Ver detalle";
      content.append(categoryText, title, brand, price, availability, detailLink); article.append(imageFrame, content); productList.appendChild(article);
    });
  }
  renderCatalogContact();
  populateCategories();
  renderCategoryShortcuts();
  restoreUrlState();
  pagination.addEventListener("click", function (event) {
    var button = event.target.closest("button[data-page]");
    if (!button || !pagination.contains(button) || button.disabled) return;
    changePage(Number(button.dataset.page));
  });
  if (categoryShortcuts) categoryShortcuts.addEventListener("click", function (event) {
    var button = event.target.closest("button[data-category]");
    if (!button || !categoryShortcuts.contains(button)) return;
    if (button.dataset.category === "") {
      resetFilters();
      return;
    }
    subcategorySelect.value = "";
    applyCategory(button.dataset.category);
    scrollToCatalog();
  });
  document.querySelector('.hero-copy a[href="#catalogo"]').addEventListener("click", function (event) {
    event.preventDefault();
    scrollToCatalog();
  });
  window.addEventListener("popstate", restoreUrlState);

  searchInput.addEventListener("input", function () {

    clearTimeout(searchTimeout);
    updateCategoryShortcuts();

    searchTimeout = setTimeout(function () {

      applyFilters();

      var term = searchInput.value.trim();

      if (term && typeof gtag === "function") {

        gtag("event", "search", {
          search_term: term
        });

      }

    }, 800);

  });
  categorySelect.addEventListener("change", function () { applyCategory(categorySelect.value); });
  subcategorySelect.addEventListener("change", applyFilters);
}());
