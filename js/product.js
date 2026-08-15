(function () {
  "use strict";

  var detail = document.getElementById("product-detail");
  var productSlug = new URLSearchParams(window.location.search).get("slug");
  var product = window.catalogData.products.find(function (item) { return item.slug === productSlug;  });

  var currency = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0
  });

  if (!product) {
    document.title = "Producto no encontrado | Segunda Vida";
    detail.className = "not-found";
    detail.innerHTML = "<h1>Producto no encontrado</h1><p>El producto solicitado no existe o el enlace es incorrecto.</p>";
    return;
  }

  // SEO dinámico del producto
  var productUrl = window.location.href;
  var productImage = product.images && product.images.length
      ? new URL(product.images[0], window.location.href).href
      : new URL("images/products/placeholder.svg", window.location.href).href;

  document.title = product.name + " | Segunda Vida";


  function setMeta(name, content) {

    var meta = document.querySelector('meta[name="' + name + '"]');

    if (!meta) {

      meta = document.createElement("meta");
      meta.name = name;
      document.head.appendChild(meta);

    }

    meta.content = content;

  }


  function setPropertyMeta(property, content) {

    var meta = document.querySelector('meta[property="' + property + '"]');

    if (!meta) {

      meta = document.createElement("meta");
      meta.setAttribute("property", property);
      document.head.appendChild(meta);

    }

    meta.content = content;

  }


  setMeta(
      "description",
      product.description + " Marca: " + product.brand + ". Disponible en Segunda Vida."
  );


  var canonical = document.querySelector('link[rel="canonical"]');

  if (!canonical) {

    canonical = document.createElement("link");
    canonical.rel = "canonical";
    document.head.appendChild(canonical);

  }

  canonical.href = window.location.origin + window.location.pathname + "?slug=" + product.slug;


  setPropertyMeta(
      "og:title",
      product.name + " | Segunda Vida"
  );


  setPropertyMeta(
      "og:description",
      product.description
  );


  setPropertyMeta(
      "og:url",
      productUrl
  );


  setPropertyMeta(
      "og:image",
      productImage
  );

  // Datos estructurados Schema.org - Product
  var productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description,
    "sku": String(product.sku),
    "brand": {
      "@type": "Brand",
      "name": product.brand
    },
    "additionalType": "https://schema.org/IndividualProduct",
    "category": product.category + " > " + product.subcategory,
    "image": product.images
        .filter(Boolean)
        .map(function (image) {
          return new URL(image, window.location.href).href;
        }),
    "itemCondition": product.condition === "Nuevos"
        ? "https://schema.org/NewCondition"
        : "https://schema.org/UsedCondition",
    "offers": {
      "@type": "Offer",
      "url": canonical.href,
      "mpn": product.slug,
      "priceCurrency": "MXN",
      "price": product.price.toFixed(2),
      "availability": product.available
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "Segunda Vida",
        "url": "https://reyko.site/"
      }
    }
  };

  var schemaScript = document.createElement("script");
  schemaScript.type = "application/ld+json";
  schemaScript.textContent = JSON.stringify(productSchema);
  document.head.appendChild(schemaScript);

  // Datos estructurados Schema.org - BreadcrumbList
  var breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Inicio",
        "item": "https://reyko.site/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": product.category,
        "item": "https://reyko.site/"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": product.name,
        "item": canonical.href
      }
    ]
  };


  var breadcrumbScript = document.createElement("script");
  breadcrumbScript.type = "application/ld+json";
  breadcrumbScript.textContent = JSON.stringify(breadcrumbSchema);
  document.head.appendChild(breadcrumbScript);

  // Google Analytics 4 - Vista de producto
  if (typeof gtag === "function") {
    gtag("event", "view_item", {
      items: [
        {
          item_id: String(product.sku),
          item_name: product.name,
          item_brand: product.brand,
          item_category: product.category,
          item_category2: product.subcategory,
          price: product.price,
          currency: "MXN"
        }
      ]
    });
  }


  document.title = product.name + " | Segunda Vida";
  detail.className = "product-detail";

  var images = Array.isArray(product.images) ? product.images.filter(Boolean) : [];
  var hasImages = images.length > 0;


  var gallery = document.createElement("section");
  gallery.className = "carousel";
  gallery.setAttribute("aria-label", "Galería de imágenes de " + product.name);


  var image = document.createElement("img");
  image.className = "carousel-image";


  var controls = document.createElement("div");
  controls.className = "carousel-controls";


  var previous = document.createElement("button");
  previous.type = "button";
  previous.className = "carousel-button";
  previous.textContent = "← Anterior";


  var next = document.createElement("button");
  next.type = "button";
  next.className = "carousel-button";
  next.textContent = "Siguiente →";


  controls.append(previous, next);


  var indicators = document.createElement("div");
  indicators.className = "carousel-indicators";
  indicators.setAttribute("aria-label", "Seleccionar imagen");


  var info = document.createElement("div");
  info.className = "product-info";


  var heading = document.createElement("h1");
  heading.textContent = product.name;


  var price = document.createElement("p");
  price.className = "price";
  price.textContent = currency.format(product.price);


  var availability = document.createElement("p");
  availability.className = "availability " + (product.available ? "available" : "unavailable");
  availability.textContent = product.available ? "Disponible" : "No disponible";


  var description = document.createElement("p");
  description.className = "description";
  description.textContent = product.description;


  var metadata = document.createElement("ul");
  metadata.className = "product-meta";


  var contact = document.createElement("section");
  contact.className = "product-contact";
  contact.setAttribute("aria-label", "Contacto sobre este artículo");


  var contactQuestion = document.createElement("p");
  contactQuestion.textContent = "¿Te gustó este artículo?";


  var contactLink = document.createElement("a");
  contactLink.href = window.catalogData.siteConfig.facebookUrl;
  contactLink.target = "_blank";
  contactLink.rel = "noopener noreferrer";
  contactLink.textContent = "Contáctame por Facebook";


  // Google Analytics 4 - Click contacto Facebook
  contactLink.addEventListener("click", function () {

    if (typeof gtag === "function") {
      gtag("event", "contact_facebook", {
        product_id: String(product.id),
        product_name: product.name,
        facebook_url: product.facebookUrl
      });
    }

  });



  [
    ["Marca", product.brand],
    ["Categoría", product.category],
    ["Subcategoría", product.subcategory],
    ["Condición", product.condition]
  ].forEach(function (item) {

    var row = document.createElement("li");

    var label = document.createElement("strong");
    label.textContent = item[0] + ":";

    row.append(label, " " + item[1]);

    metadata.appendChild(row);

  });



  var productFacebookLink = null;

  if (product.facebookUrl && product.facebookUrl !== "#") {

    productFacebookLink = document.createElement("a");

    productFacebookLink.className = "product-facebook-link";
    productFacebookLink.href = product.facebookUrl;
    productFacebookLink.textContent = "Ver en Facebook";

    productFacebookLink.target = "_blank";
    productFacebookLink.rel = "noopener noreferrer";


    // Google Analytics 4 - Click Facebook producto
    productFacebookLink.addEventListener("click", function () {

      if (typeof gtag === "function") {

        gtag("event", "click_facebook_product", {

          product_id: String(product.id),
          product_name: product.name,
          facebook_url: product.facebookUrl,
          price: product.price,
          currency: "MXN"

        });

      }

    });


    if (product.facebookUrl === "#") {

      productFacebookLink.setAttribute("aria-disabled", "true");

      productFacebookLink.addEventListener("click", function (event) {
        event.preventDefault();
      });

    } else {

      productFacebookLink.target = "_blank";
      productFacebookLink.rel = "noopener noreferrer";

    }
  }




  if (productFacebookLink) {
    metadata.appendChild(productFacebookLink);
  }


  contact.append(contactQuestion, contactLink);

  info.append(
      heading,
      price,
      availability,
      description,
      metadata,
      contact
  );


  gallery.append(image);

  if (images.length > 1) {
    gallery.append(controls, indicators);
  }


  detail.append(gallery, info);



  var currentIndex = 0;


  function showImage(index) {

    if (!hasImages) {

      image.src = "images/products/placeholder.svg";
      image.alt = "Imagen no disponible de " + product.name;

      return;

    }


    currentIndex = (index + images.length) % images.length;

    image.src = images[currentIndex];

    image.alt =
        product.name +
        ", imagen " +
        (currentIndex + 1) +
        " de " +
        images.length;


    Array.prototype.forEach.call(
        indicators.children,
        function (indicator, indicatorIndex) {

          indicator.setAttribute(
              "aria-current",
              String(indicatorIndex === currentIndex)
          );

        }
    );

  }



  if (images.length > 1) {

    images.forEach(function (_, index) {

      var indicator = document.createElement("button");

      indicator.type = "button";

      indicator.className = "indicator";

      indicator.setAttribute(
          "aria-label",
          "Mostrar imagen " + (index + 1)
      );


      indicator.addEventListener(
          "click",
          function () {
            showImage(index);
          }
      );


      indicators.appendChild(indicator);

    });



    previous.addEventListener(
        "click",
        function () {
          showImage(currentIndex - 1);
        }
    );


    next.addEventListener(
        "click",
        function () {
          showImage(currentIndex + 1);
        }
    );



    var touchStartX = null;


    gallery.addEventListener(
        "touchstart",
        function (event) {

          touchStartX = event.changedTouches[0].screenX;

        },
        {
          passive: true
        }
    );



    gallery.addEventListener(
        "touchend",
        function (event) {

          if (touchStartX === null) {
            return;
          }


          var distance =
              event.changedTouches[0].screenX -
              touchStartX;


          if (Math.abs(distance) > 40) {

            showImage(
                currentIndex +
                (distance < 0 ? 1 : -1)
            );

          }


          touchStartX = null;

        },
        {
          passive: true
        }
    );

  }


  showImage(0);

}());