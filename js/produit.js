(function () {

  var STATUS_LABELS = {
    disponible: 'Disponible',
    peu_de_stock: 'Peu de stock',
    rupture: 'Rupture'
  };

  var CATEGORY_LABELS = {
    sacs: 'SACS',
    chaussures: 'CHAUSSURES'
  };

  var skeletonSection = document.getElementById('productSkeletonSection');
  var detailSection = document.getElementById('productDetailSection');
  var notFoundSection = document.getElementById('productNotFoundSection');

  var mainImageBtn = document.getElementById('productGalleryMain');
  var mainImage = document.getElementById('productMainImage');
  var thumbsContainer = document.getElementById('productGalleryThumbs');

  var categoryTextEl = document.getElementById('productCategoryText');
  var nameEl = document.getElementById('productName');
  var priceEl = document.getElementById('productPrice');
  var badgeEl = document.getElementById('productAvailabilityBadge');
  var badgeTextEl = document.getElementById('productAvailabilityText');
  var shortDescEl = document.getElementById('productShortDesc');
  var descriptionTextEl = document.getElementById('productDescriptionText');
  var descriptionSection = document.getElementById('productDescriptionSection');

  var whatsappBtn = document.getElementById('productWhatsappBtn');
  var whatsappLabel = document.getElementById('productWhatsappLabel');

  var lightbox = document.getElementById('productLightbox');
  var lightboxImg = document.getElementById('lightboxImg');
  var lightboxCounter = document.getElementById('lightboxCounter');
  var lightboxClose = document.getElementById('lightboxClose');
  var lightboxPrev = document.getElementById('lightboxPrev');
  var lightboxNext = document.getElementById('lightboxNext');

  var currentPhotos = [];
  var currentPhotoIndex = 0;
  var currentProduct = null;

  function formatPrice(prix) {
    return Number(prix).toLocaleString('fr-FR') + ' FCFA';
  }

  function getSiteBaseUrl() {
    var path = window.location.pathname;
    var dir = path.substring(0, path.lastIndexOf('/') + 1);
    return window.location.origin + dir;
  }

  function buildWhatsappUrl(produit) {
    var productUrl =
      getSiteBaseUrl() +
      'produit.html?id=' +
      encodeURIComponent(produit.id);

    var message;

    if (produit.disponibilite === 'rupture') {

      message =
        'Bonjour Tantie Pauline, je souhaite avoir des informations sur le produit « ' +
        produit.nom +
        ' ».\n' +
        'Référence : ' +
        produit.id +
        '\n\n' +
        'Voir le produit :\n' +
        productUrl;

    } else {

      message =
        'Bonjour Tantie Pauline, je suis intéressé(e) par le produit « ' +
        produit.nom +
        ' » au prix de ' +
        formatPrice(produit.prix) +
        '.\n' +
        'Référence : ' +
        produit.id +
        '\n\n' +
        'Voir le produit :\n' +
        productUrl;
    }

    return (
      'https://wa.me/22600000000?text=' +
      encodeURIComponent(message)
    );
  }

  function showSkeleton() {
    skeletonSection.hidden = false;
    detailSection.hidden = true;
    notFoundSection.hidden = true;
  }

  function showNotFound(title, text) {
    document.getElementById('notFoundTitle').textContent = title;
    document.getElementById('notFoundText').textContent = text;

    skeletonSection.hidden = true;
    detailSection.hidden = true;
    notFoundSection.hidden = false;
  }

  function renderGallery(produit) {

    currentPhotos =
      (produit.photos && produit.photos.length)
        ? produit.photos
        : [produit.imagePrincipale];

    currentPhotoIndex = 0;

    setMainImage(0, produit.nom);

    thumbsContainer.innerHTML = '';

    if (currentPhotos.length > 1) {

      currentPhotos.forEach(function (photoUrl, index) {

        var thumb = document.createElement('button');

        thumb.type = 'button';

        thumb.className =
          'product-thumb' +
          (index === 0 ? ' active' : '');

        thumb.setAttribute(
          'aria-label',
          'Photo ' +
          (index + 1) +
          ' sur ' +
          currentPhotos.length
        );

        var img = document.createElement('img');

        img.src = photoUrl;
        img.alt = '';

        thumb.appendChild(img);

        thumb.addEventListener(
          'click',
          function () {

            setMainImage(
              index,
              produit.nom
            );

            updateActiveThumb(index);
          }
        );

        thumbsContainer.appendChild(thumb);
      });
    }
  }

  function updateActiveThumb(index) {

    thumbsContainer
      .querySelectorAll('.product-thumb')
      .forEach(function (thumb, i) {

        thumb.classList.toggle(
          'active',
          i === index
        );

      });
  }

  function setMainImage(index, altBase) {

    currentPhotoIndex = index;

    mainImage.src =
      currentPhotos[index];

    mainImage.alt =
      altBase +
      ' — photo ' +
      (index + 1);
  }

  function openLightbox(index) {

    currentPhotoIndex = index;

    updateLightboxImage();

    lightbox.classList.add('open');

    lightbox.setAttribute(
      'aria-hidden',
      'false'
    );

    document.body.classList.add(
      'nav-locked'
    );
  }

  function closeLightbox() {

    lightbox.classList.remove('open');

    lightbox.setAttribute(
      'aria-hidden',
      'true'
    );

    document.body.classList.remove(
      'nav-locked'
    );
  }

  function updateLightboxImage() {

    lightboxImg.src =
      currentPhotos[currentPhotoIndex];

    if (currentPhotos.length > 1) {

      lightboxCounter.textContent =
        (currentPhotoIndex + 1) +
        ' / ' +
        currentPhotos.length;

      lightboxCounter.hidden = false;
      lightboxPrev.hidden = false;
      lightboxNext.hidden = false;

    } else {

      lightboxCounter.hidden = true;
      lightboxPrev.hidden = true;
      lightboxNext.hidden = true;
    }
  }

  function showPrevPhoto() {

    currentPhotoIndex =
      (
        currentPhotoIndex -
        1 +
        currentPhotos.length
      ) %
      currentPhotos.length;

    updateLightboxImage();

    setMainImage(
      currentPhotoIndex,
      nameEl.textContent
    );

    updateActiveThumb(
      currentPhotoIndex
    );
  }

  function showNextPhoto() {

    currentPhotoIndex =
      (
        currentPhotoIndex +
        1
      ) %
      currentPhotos.length;

    updateLightboxImage();

    setMainImage(
      currentPhotoIndex,
      nameEl.textContent
    );

    updateActiveThumb(
      currentPhotoIndex
    );
  }

  function renderDescription(text) {

    descriptionTextEl.innerHTML = '';

    if (!text || !text.trim()) {

      descriptionSection.hidden = true;

      return;
    }

    descriptionSection.hidden = false;

    text.split('\n').forEach(function (line) {

      if (!line.trim()) {
        return;
      }

      var p = document.createElement('p');

      p.textContent = line;

      descriptionTextEl.appendChild(p);
    });
  }

  function renderProduct(produit) {

    currentProduct = produit;

    categoryTextEl.textContent =
      CATEGORY_LABELS[produit.categorie] ||
      produit.categorie.toUpperCase();

    nameEl.textContent =
      produit.nom;

    priceEl.textContent =
      formatPrice(produit.prix);

    badgeEl.className =
      'prod-badge prod-badge-' +
      produit.disponibilite;

    badgeTextEl.textContent =
      STATUS_LABELS[produit.disponibilite] ||
      produit.disponibilite;

    shortDescEl.textContent =
      produit.descriptionCourte || '';

    renderDescription(
      produit.description
    );

    renderGallery(
      produit
    );

    whatsappBtn.href =
      buildWhatsappUrl(
        produit
      );

    whatsappLabel.textContent =
      produit.disponibilite === 'rupture'
        ? 'Demander des informations'
        : 'Écrire à Tantie Pauline sur WhatsApp';

    skeletonSection.hidden = true;
    notFoundSection.hidden = true;
    detailSection.hidden = false;
  }


  /*
   * ==========================================
   * MISE À JOUR AUTOMATIQUE
   * ==========================================
   *
   * Si api.js découvre que le catalogue a changé
   * pendant que cette fiche est ouverte, on cherche
   * le même produit dans les nouvelles données.
   *
   * Cela permet par exemple de mettre à jour :
   * - le prix ;
   * - la disponibilité ;
   * - les photos ;
   * - la description.
   */

  window.addEventListener(
    'catalogueUpdated',
    function (event) {

      if (
        !currentProduct ||
        !event.detail ||
        !Array.isArray(event.detail.products)
      ) {
        return;
      }

      var updatedProduct =
        event.detail.products.find(
          function (product) {
            return String(product.id) ===
              String(currentProduct.id);
          }
        );

      /*
       * Le produit n'existe plus dans le nouveau
       * catalogue : on affiche l'état introuvable.
       */
      if (!updatedProduct) {

        closeLightbox();

        showNotFound(
          'Produit introuvable',
          'Cette pièce n\'est peut-être plus disponible ou le lien n\'est plus valide.'
        );

        return;
      }

      /*
       * Le produit existe toujours :
       * on actualise simplement la fiche.
       */
      renderProduct(
        updatedProduct
      );
    }
  );


  /* ==============================
     INITIALISATION
     ============================== */

  function init() {

    var params =
      new URLSearchParams(
        window.location.search
      );

    var id =
      params.get('id');

    if (!id) {

      showSkeleton();

      setTimeout(
        function () {

          showNotFound(
            'Produit introuvable',
            'Aucun article n\'a été précisé. Retournez à la collection pour choisir un article.'
          );

        },
        300
      );

      return;
    }

    showSkeleton();

    window.PublicAPI
      .loadProductById(id)

      .then(function (produit) {

        renderProduct(
          produit
        );

      })

      .catch(function (err) {

        console.error(
          '[produit.js]',
          err
        );

        if (
          err.code ===
          'PRODUCT_NOT_FOUND'
        ) {

          showNotFound(
            'Produit introuvable',
            'Cette pièce n\'est peut-être plus disponible ou le lien n\'est plus valide.'
          );

        } else {

          showNotFound(
            'Chargement impossible',
            'La fiche produit n\'a pas pu être chargée pour le moment. Réessayez dans quelques instants.'
          );
        }
      });
  }


  /* ==============================
     GALERIE
     ============================== */

  mainImageBtn.addEventListener(
    'click',
    function () {

      openLightbox(
        currentPhotoIndex
      );

    }
  );

  lightboxClose.addEventListener(
    'click',
    closeLightbox
  );

  lightboxPrev.addEventListener(
    'click',
    showPrevPhoto
  );

  lightboxNext.addEventListener(
    'click',
    showNextPhoto
  );

  lightbox.addEventListener(
    'click',
    function (e) {

      if (e.target === lightbox) {
        closeLightbox();
      }

    }
  );

  document.addEventListener(
    'keydown',
    function (e) {

      if (
        !lightbox.classList.contains('open')
      ) {
        return;
      }

      if (e.key === 'Escape') {
        closeLightbox();
      }

      if (e.key === 'ArrowLeft') {
        showPrevPhoto();
      }

      if (e.key === 'ArrowRight') {
        showNextPhoto();
      }

    }
  );


  /* ==============================
     DÉMARRAGE
     ============================== */

  document.addEventListener(
    'DOMContentLoaded',
    init
  );

})();