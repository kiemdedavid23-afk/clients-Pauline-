(function () {

  var STATUS_LABELS = {
    disponible: 'Disponible',
    peu_de_stock: 'Peu de stock',
    rupture: 'Rupture'
  };

  var grid = document.getElementById('productsGrid');
  var emptyState = document.getElementById('productsEmptyState');
  var errorState = document.getElementById('productsErrorState');
  var retryButton = document.getElementById('retryButton');
  var filterButtons = document.querySelectorAll('.filter-pill');

  var allProducts = [];
  var currentFilter = 'tous';

  function formatPrice(prix) {
    return Number(prix).toLocaleString('fr-FR') + ' FCFA';
  }

  function renderSkeletons(count) {
    grid.hidden = false;
    emptyState.hidden = true;
    errorState.hidden = true;
    grid.classList.remove('prod-grid-visible');
    grid.innerHTML = '';

    for (var i = 0; i < count; i++) {
      var skeleton = document.createElement('div');
      skeleton.className = 'prod-skeleton';
      grid.appendChild(skeleton);
    }
  }

  function renderProducts(products) {
    grid.innerHTML = '';

    if (!products.length) {
      grid.hidden = true;
      emptyState.hidden = false;
      errorState.hidden = true;
      return;
    }

    grid.hidden = false;
    emptyState.hidden = true;
    errorState.hidden = true;

    products.forEach(function (produit) {
      var card = document.createElement('a');
      card.className = 'prod-card';
      card.href = 'produit.html?id=' + encodeURIComponent(produit.id);

      if (produit.disponibilite === 'rupture') {
        card.classList.add('prod-card-out');
      }

      var imgBox = document.createElement('div');
      imgBox.className = 'prod-img-box';

      var img = document.createElement('img');
      img.src = produit.imagePrincipale;
      img.alt = produit.nom;
      img.loading = 'lazy';

      imgBox.appendChild(img);

      var info = document.createElement('div');
      info.className = 'prod-info';

      var badge = document.createElement('span');
      badge.className = 'prod-badge prod-badge-' + produit.disponibilite;

      var dot = document.createElement('span');
      dot.className = 'prod-badge-dot';

      badge.appendChild(dot);
      badge.appendChild(document.createTextNode(STATUS_LABELS[produit.disponibilite] || produit.disponibilite));

      var name = document.createElement('h3');
      name.className = 'prod-name';
      name.textContent = produit.nom;

      var price = document.createElement('p');
      price.className = 'prod-price';
      price.textContent = formatPrice(produit.prix);

      var viewLink = document.createElement('span');
      viewLink.className = 'prod-view-link';
      viewLink.textContent = 'Voir le produit \u2192';

      info.appendChild(badge);
      info.appendChild(name);
      info.appendChild(price);
      info.appendChild(viewLink);

      card.appendChild(imgBox);
      card.appendChild(info);

      grid.appendChild(card);
    });

    requestAnimationFrame(function () {
      grid.classList.add('prod-grid-visible');
    });
  }

  function applyFilter(filter) {
    currentFilter = filter;

    filterButtons.forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.filter === filter);
    });

    var filtered = filter === 'tous'
      ? allProducts
      : allProducts.filter(function (p) { return p.categorie === filter; });

    renderProducts(filtered);
  }

  function showError() {
    grid.hidden = true;
    emptyState.hidden = true;
    errorState.hidden = false;
  }

  function loadProducts() {
    renderSkeletons(6);
    return window.PublicAPI.loadProducts();
  }

  function init() {
    loadProducts()
      .then(function (products) {
        allProducts = products;
        applyFilter(currentFilter);
      })
      .catch(function (err) {
        console.error('[produits.js]', err);
        showError();
      });
  }

  window.addEventListener('catalogueUpdated', function (event) {
    if (!event.detail || !Array.isArray(event.detail.products)) return;
    allProducts = event.detail.products;
    applyFilter(currentFilter);
  });

  filterButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      applyFilter(btn.dataset.filter);
    });
  });

  if (retryButton) {
    retryButton.addEventListener('click', init);
  }

  document.addEventListener('DOMContentLoaded', init);

})();
