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
  var catalogContact = document.getElementById("catalog-contact");
  var currency = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
  var productsPerPage = 24;
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
  function renderCatalogContact() { var question = document.createElement("p"); question.textContent = "¿Te gustó alguno de nuestros artículos?"; var message = document.createElement("p"); message.append("Puedes contactarnos desde ", createFacebookLink(), ". 👈 Da click"); catalogContact.append(question, message); }
  function populateCategories() { data.categories.forEach(function (category) { addOption(categorySelect, category.name, category.name); }); }
  function populateSubcategories(categoryName) {
    var selectedValue = subcategorySelect.value;
    subcategorySelect.length = 1;
    var category = data.categories.find(function (item) { return item.name === categoryName; });
    var subcategories = category ? category.subcategories : data.categories.reduce(function (all, item) { return all.concat(item.subcategories); }, []);
    subcategories.forEach(function (subcategory) { addOption(subcategorySelect, subcategory, subcategory); });
    subcategorySelect.disabled = subcategories.length === 0;
    if (subcategories.indexOf(selectedValue) !== -1) subcategorySelect.value = selectedValue;
  }
  function createPageButton(label, page, disabled, current) {
    var button = document.createElement("button"); button.type = "button"; button.className = "pagination-button"; button.textContent = label; button.disabled = disabled;
    if (current) button.setAttribute("aria-current", "page");
    button.addEventListener("click", function () { currentPage = page; renderProducts(); });
    return button;
  }
  function renderPagination(totalPages) {
    pagination.replaceChildren(); pagination.hidden = totalPages <= 1;
    if (totalPages <= 1) return;
    pagination.appendChild(createPageButton("‹ Anterior", currentPage - 1, currentPage === 1));
    for (var page = 1; page <= totalPages; page += 1) pagination.appendChild(createPageButton(String(page), page, false, page === currentPage));
    pagination.appendChild(createPageButton("Siguiente ›", currentPage + 1, currentPage === totalPages));
  }
  function renderProducts() {
    var term = searchInput.value.trim().toLocaleLowerCase("es"); var category = categorySelect.value; var subcategory = subcategorySelect.value;
    var filtered = data.products.filter(function (product) { var searchable = (product.name + " " + product.description).toLocaleLowerCase("es"); return (!term || searchable.indexOf(term) !== -1) && (!category || product.category === category) && (!subcategory || product.subcategory === subcategory); });
    filtered.sort(function (first, second) { return Number(second.available) - Number(first.available); });
    var totalPages = Math.ceil(filtered.length / productsPerPage);
    if (currentPage > totalPages) currentPage = Math.max(totalPages, 1);
    var pageStart = (currentPage - 1) * productsPerPage;
    var pageProducts = filtered.slice(pageStart, pageStart + productsPerPage);
    productList.replaceChildren();
    pageProducts.forEach(function (product) {
      var article = document.createElement("article"); article.className = "product-card";
      var image = document.createElement("img"); image.src = product.images[0]; image.alt = product.name;
      var content = document.createElement("div"); content.className = "card-content";
      var categoryText = document.createElement("p"); categoryText.className = "card-category"; categoryText.textContent = product.category + " · " + product.subcategory;
      var title = document.createElement("h2"); title.className = "card-title";
      var titleLink = document.createElement("a"); titleLink.href = "product.html?id=" + encodeURIComponent(product.id); titleLink.textContent = product.name; title.appendChild(titleLink);
      var brand = document.createElement("p"); brand.className = "product-brand"; brand.textContent = product.brand;
      var price = document.createElement("p"); price.className = "price"; price.textContent = currency.format(product.price);
      var availability = document.createElement("p"); availability.className = "availability " + (product.available ? "available" : "unavailable"); availability.textContent = product.available ? "Disponible" : "No disponible";
      var detailLink = document.createElement("a"); detailLink.className = "detail-link"; detailLink.href = titleLink.href; detailLink.textContent = "Ver detalle";
      content.append(categoryText, title, brand, price, availability, detailLink); article.append(image, content); productList.appendChild(article);
    });
    resultsCount.textContent = filtered.length === 1 ? "1 producto encontrado" : filtered.length + " productos encontrados"; emptyState.hidden = filtered.length !== 0;
    renderPagination(totalPages);
  }
  renderCatalogContact(); populateCategories(); populateSubcategories(""); renderProducts();
  var searchTimeout;

  searchInput.addEventListener("input", function () {

    clearTimeout(searchTimeout);

    searchTimeout = setTimeout(function () {

      currentPage = 1;
      renderProducts();

      var term = searchInput.value.trim();

      if (term && typeof gtag === "function") {

        gtag("event", "search", {
          search_term: term
        });

      }

    }, 800);

  });
  categorySelect.addEventListener("change", function () { currentPage = 1; populateSubcategories(categorySelect.value); renderProducts(); });
  subcategorySelect.addEventListener("change", function () { currentPage = 1; renderProducts(); });
}());
