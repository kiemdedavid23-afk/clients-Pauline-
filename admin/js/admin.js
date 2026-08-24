(function () {

  var STATUS_LABELS = { disponible: 'Disponible', peu_de_stock: 'Peu de stock', rupture: 'Rupture' };
  var CATEGORY_LABELS = { sacs: 'Sacs', chaussures: 'Chaussures' };

  function formatPrice(prix) {
    return Number(prix).toLocaleString('fr-FR') + ' FCFA';
  }

  /* ===================== NAVIGATION ADMIN (centralisée ici) ===================== */

  function renderAdminNav() {
    var mount = document.getElementById('admin-nav');
    if (!mount) return;

    var current = location.pathname.split('/').pop() || 'index.html';

    mount.innerHTML =
      '<nav class="admin-nav">' +
        '<div class="admin-nav-container">' +
          '<a href="index.html" class="admin-nav-brand">' +
            '<img src="../assets/logo/logo-pauline.png" alt="Chez Tantie Pauline" class="admin-nav-logo" onerror="this.style.display=\'none\'; this.nextElementSibling.style.display=\'block\';">' +
            '<svg class="admin-nav-logo-fallback" viewBox="0 0 60 60" aria-hidden="true"><circle cx="30" cy="30" r="29" fill="#163a5c"/><text x="30" y="37" font-family="Cormorant Garamond, serif" font-style="italic" font-weight="700" font-size="22" fill="#fff" text-anchor="middle">TP</text></svg>' +
            '<span class="admin-nav-brand-text">Administration</span>' +
          '</a>' +
          '<div class="admin-nav-links">' +
            '<a href="index.html" class="admin-nav-link' + (current === 'index.html' ? ' active' : '') + '">Dashboard</a>' +
            '<a href="produits.html" class="admin-nav-link' + (current === 'produits.html' ? ' active' : '') + '">Produits</a>' +
            '<a href="produit.html" class="admin-nav-link' + (current === 'produit.html' ? ' active' : '') + '">Ajouter un produit</a>' +
            '<a href="../index.html" class="admin-nav-public-link" target="_blank" rel="noopener">Voir le site public &rarr;</a>' +
            '<button type="button" id="adminLogoutBtn" class="admin-nav-public-link admin-nav-logout-btn">Se déconnecter</button>' +
          '</div>' +
        '</div>' +
      '</nav>';
  }

  function initLogoutButton_() {
    var btn = document.getElementById('adminLogoutBtn');
    if (!btn) return;
    btn.addEventListener('click', function () {
      btn.disabled = true;
      AdminAPI.logout().finally(function () {
        window.location.href = 'connexion.html';
      });
    });
  }

  /* ===================== PROTECTION DES PAGES ===================== */

  function guardProtectedPage_() {
    return AdminAPI.checkSession().then(function (valid) {
      if (!valid) {
        AdminAPI.clearToken();
        window.location.href = 'connexion.html';
        return false;
      }
      return true;
    });
  }

  /* ===================== PAGE : CONNEXION ===================== */

  function initLoginPage() {
    var form = document.getElementById('adminLoginForm');
    if (!form) return;

    // Si une session valide existe déjà, inutile de repasser par le formulaire.
    AdminAPI.checkSession().then(function (valid) {
      if (valid) window.location.href = 'index.html';
    });

    var submitBtn = document.getElementById('adminLoginSubmit');
    var label = submitBtn.querySelector('.admin-btn-label');
    var spinner = submitBtn.querySelector('.admin-btn-spinner');
    var errorZone = document.getElementById('adminLoginError');

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var identifiant = document.getElementById('loginIdentifiant').value.trim();
      var password = document.getElementById('loginPassword').value;

      errorZone.hidden = true;
      submitBtn.disabled = true;
      label.textContent = 'Connexion...';
      spinner.hidden = false;

      AdminAPI.login(identifiant, password)
        .then(function () {
          window.location.href = 'index.html';
        })
        .catch(function (err) {
          submitBtn.disabled = false;
          label.textContent = 'Se connecter';
          spinner.hidden = true;
          errorZone.textContent = err.message || 'Identifiant ou mot de passe incorrect.';
          errorZone.hidden = false;
        });
    });
  }

  /* ===================== PAGE : DASHBOARD ===================== */

  function initDashboardPage() {
    var statsGrid = document.getElementById('adminStatsGrid');
    if (!statsGrid) return;

    statsGrid.innerHTML = '<p class="admin-page-lead">Chargement des statistiques...</p>';

    AdminAPI.getProducts()
      .then(function (data) {
        var products = data.products || [];

        var stats = [
          { label: 'Produits', value: products.length },
          { label: 'Disponibles', value: products.filter(function (p) { return p.disponibilite === 'disponible'; }).length },
          { label: 'Peu de stock', value: products.filter(function (p) { return p.disponibilite === 'peu_de_stock'; }).length },
          { label: 'Rupture', value: products.filter(function (p) { return p.disponibilite === 'rupture'; }).length }
        ];

        statsGrid.innerHTML = '';
        stats.forEach(function (stat) {
          var card = document.createElement('div');
          card.className = 'admin-stat-card';
          var value = document.createElement('p');
          value.className = 'admin-stat-value';
          value.textContent = stat.value;
          var label = document.createElement('p');
          label.className = 'admin-stat-label';
          label.textContent = stat.label;
          card.appendChild(value);
          card.appendChild(label);
          statsGrid.appendChild(card);
        });
      })
      .catch(function (err) {
        statsGrid.innerHTML = '<p class="admin-page-lead">Impossible de charger les statistiques (' + err.message + ').</p>';
      });
  }

  /* ===================== PAGE : MES PRODUITS ===================== */

  function initProductsListPage() {
    var list = document.getElementById('adminProductsList');
    if (!list) return;

    var emptyState = document.getElementById('adminProductsEmpty');
    var searchInput = document.getElementById('adminSearchInput');
    var filterButtons = document.querySelectorAll('.admin-filters-container .filter-pill');

    var allProducts = [];
    var currentFilter = 'tous';
    var currentSearch = '';

    function matchesFilter(produit) {
      if (currentFilter === 'tous') return true;
      if (['sacs', 'chaussures'].indexOf(currentFilter) !== -1) return produit.categorie === currentFilter;
      return produit.disponibilite === currentFilter;
    }

    function matchesSearch(produit) {
      if (!currentSearch) return true;
      return produit.nom.toLowerCase().indexOf(currentSearch.toLowerCase()) !== -1;
    }

    function renderList() {
      var filtered = allProducts.filter(function (p) {
        return matchesFilter(p) && matchesSearch(p);
      });

      list.innerHTML = '';

      if (!filtered.length) {
        list.hidden = true;
        emptyState.hidden = false;
        return;
      }

      list.hidden = false;
      emptyState.hidden = true;

      filtered.forEach(function (produit) {
        var card = document.createElement('div');
        card.className = 'admin-product-card' + (produit.publie ? '' : ' is-masque');

        var thumb = document.createElement('div');
        thumb.className = 'admin-product-thumb';
        var img = document.createElement('img');
        img.src = produit.photoPrincipale || (produit.photos && produit.photos[0]) || '';
        img.alt = produit.nom;
        thumb.appendChild(img);

        var info = document.createElement('div');
        info.className = 'admin-product-main-info';
        var nameEl = document.createElement('p');
        nameEl.className = 'admin-product-name';
        nameEl.textContent = produit.nom;
        var metaEl = document.createElement('p');
        metaEl.className = 'admin-product-meta';
        metaEl.textContent = CATEGORY_LABELS[produit.categorie] + ' · ' + STATUS_LABELS[produit.disponibilite] + (produit.publie ? '' : ' · Masqué');
        var priceEl = document.createElement('p');
        priceEl.className = 'admin-product-price';
        priceEl.textContent = formatPrice(produit.prix);
        info.appendChild(nameEl);
        info.appendChild(metaEl);
        info.appendChild(priceEl);

        var actions = document.createElement('div');
        actions.className = 'admin-product-actions';

        var editLink = document.createElement('a');
        editLink.className = 'btn-mini btn-mini-primary';
        editLink.href = 'produit.html?id=' + encodeURIComponent(produit.id);
        editLink.textContent = 'Modifier';

        var toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'btn-mini btn-mini-secondary';
        toggleBtn.textContent = produit.publie ? 'Masquer' : 'Publier';
        toggleBtn.addEventListener('click', function () {
          toggleBtn.disabled = true;
          var action = produit.publie ? AdminAPI.unpublishProduct(produit.id) : AdminAPI.publishProduct(produit.id);
          action
            .then(function () { return loadProducts(); })
            .catch(function (err) { window.alert('Erreur : ' + err.message); toggleBtn.disabled = false; });
        });

        var deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'btn-mini btn-mini-danger';
        deleteBtn.textContent = 'Supprimer';
        deleteBtn.addEventListener('click', function () {
          if (!window.confirm('Supprimer « ' + produit.nom + ' » ? Cette action est définitive.')) return;
          deleteBtn.disabled = true;
          AdminAPI.deleteProduct(produit.id)
            .then(function () { return loadProducts(); })
            .catch(function (err) { window.alert('Erreur : ' + err.message); deleteBtn.disabled = false; });
        });

        actions.appendChild(editLink);
        actions.appendChild(toggleBtn);
        actions.appendChild(deleteBtn);

        card.appendChild(thumb);
        card.appendChild(info);
        card.appendChild(actions);
        list.appendChild(card);
      });
    }

    function loadProducts() {
      list.innerHTML = '<p class="admin-page-lead">Chargement des produits...</p>';
      emptyState.hidden = true;

      return AdminAPI.getProducts()
        .then(function (data) {
          allProducts = data.products || [];
          renderList();
        })
        .catch(function (err) {
          list.innerHTML = '<p class="admin-page-lead">Impossible de charger les produits (' + err.message + ').</p>';
        });
    }

    filterButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        currentFilter = btn.dataset.filter;
        filterButtons.forEach(function (b) { b.classList.toggle('active', b === btn); });
        renderList();
      });
    });

    searchInput.addEventListener('input', function () {
      currentSearch = searchInput.value;
      renderList();
    });

    loadProducts();
  }

  /* ===================== PAGE : AJOUTER / MODIFIER UN PRODUIT ===================== */

  function initProductFormPage() {
    var form = document.getElementById('adminProductForm');
    if (!form) return;

    var params = new URLSearchParams(window.location.search);
    var editId = params.get('id');

    var titleEl = document.getElementById('adminProductFormTitle');
    var submitBtn = document.getElementById('adminProductSubmit');
    var feedback = document.getElementById('adminFormFeedback');
    var thumbsContainer = document.getElementById('photoThumbs');
    var photoInput = document.getElementById('photoInput');
    var photoAddLabel = document.querySelector('.photo-add-btn span');

    var photos = [];
    var isUploading = false;

    function showFeedback(message, isError) {
      feedback.hidden = false;
      feedback.textContent = message;
      feedback.style.color = isError ? '#8a3428' : '';
    }

    function renderThumbs() {
      thumbsContainer.innerHTML = '';
      photos.forEach(function (src, index) {
        var thumb = document.createElement('div');
        thumb.className = 'photo-thumb';

        var img = document.createElement('img');
        img.src = src;
        img.alt = '';

        var removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'photo-thumb-remove';
        removeBtn.setAttribute('aria-label', 'Supprimer cette photo');
        removeBtn.textContent = '×';
        removeBtn.addEventListener('click', function () {
          photos.splice(index, 1);
          renderThumbs();
        });

        thumb.appendChild(img);
        thumb.appendChild(removeBtn);
        thumbsContainer.appendChild(thumb);
      });
    }

    function setUploading(state) {
      isUploading = state;
      photoInput.disabled = state;
      if (photoAddLabel) photoAddLabel.textContent = state ? 'Envoi...' : '+ Ajouter une photo';
    }

    photoInput.addEventListener('change', function () {
      var file = photoInput.files[0];
      if (!file) return;

      setUploading(true);
      var reader = new FileReader();
      reader.onload = function (e) {
        var base64 = String(e.target.result).split(',')[1];
        AdminAPI.uploadImage(base64)
          .then(function (data) {
            photos.push(data.url);
            renderThumbs();
          })
          .catch(function (err) {
            showFeedback('Échec de l\'envoi de la photo : ' + err.message, true);
          })
          .finally(function () {
            setUploading(false);
            photoInput.value = '';
          });
      };
      reader.readAsDataURL(file);
    });

    if (editId) {
      titleEl.textContent = 'Chargement du produit...';
      AdminAPI.getProduct(editId)
        .then(function (data) {
          var product = data.product;
          titleEl.textContent = 'Modifier « ' + product.nom + ' »';
          submitBtn.textContent = 'Enregistrer les modifications';
          document.getElementById('productNom').value = product.nom;
          document.getElementById('productCategorie').value = product.categorie;
          document.getElementById('productPrix').value = product.prix;
          document.getElementById('productDisponibilite').value = product.disponibilite;
          document.getElementById('productDescription').value = product.description || '';
          photos = product.photoPrincipale
            ? [product.photoPrincipale].concat(product.photos || [])
            : (product.photos || []).slice();
          renderThumbs();
        })
        .catch(function (err) {
          titleEl.textContent = 'Produit introuvable';
          showFeedback('Impossible de charger ce produit : ' + err.message, true);
        });
    } else {
      renderThumbs();
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      if (isUploading) {
        showFeedback('Merci d\'attendre la fin de l\'envoi de la photo en cours.', true);
        return;
      }

      var payload = {
        nom: document.getElementById('productNom').value.trim(),
        categorie: document.getElementById('productCategorie').value,
        prix: Number(document.getElementById('productPrix').value),
        disponibilite: document.getElementById('productDisponibilite').value,
        description: document.getElementById('productDescription').value.trim(),
        photos: photos
      };

      submitBtn.disabled = true;
      var action = editId ? AdminAPI.updateProduct(editId, payload) : AdminAPI.createProduct(payload);

      action
        .then(function () {
          showFeedback(editId ? 'Modifications enregistrées.' : 'Produit enregistré (non publié pour l\'instant).', false);
          setTimeout(function () { window.location.href = 'produits.html'; }, 900);
        })
        .catch(function (err) {
          showFeedback('Erreur : ' + err.message, true);
          submitBtn.disabled = false;
        });
    });
  }

  /* ===================== ORCHESTRATION ===================== */

  document.addEventListener('DOMContentLoaded', function () {
    var isLoginPage = !!document.getElementById('adminLoginForm');

    if (isLoginPage) {
      initLoginPage();
      return;
    }

    guardProtectedPage_().then(function (allowed) {
      if (!allowed) return;

      document.body.classList.remove('admin-guard-pending');
      renderAdminNav();
      initLogoutButton_();
      initDashboardPage();
      initProductsListPage();
      initProductFormPage();
    });
  });

})();