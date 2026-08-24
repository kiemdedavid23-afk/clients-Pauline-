/**
 * API PUBLIQUE — Chez Tantie Pauline
 *
 * Responsabilités :
 * - Accès unique au GAS Public
 * - Cache local du catalogue
 * - Affichage rapide depuis le cache
 * - Rafraîchissement périodique
 * - Secours hors connexion / GAS indisponible
 *
 * Aucun secret ici.
 */

(function () {

  var GAS_PUBLIC_URL =
    'https://script.google.com/macros/s/AKfycbxJ_t4uQ2f0x4D-jy5L9oHtA8m9VnjQebLY4s_8gQpSiQJSZ5dD4M-witLu0x2fOB2GNg/exec';

  /* ==============================
     CONFIGURATION DU CACHE
     ============================== */

  var CACHE_KEY = 'tp_catalogue_cache_v1';

  /*
   * Après cette durée, on considère le cache comme ancien.
   * Il reste utilisable, mais on tente une actualisation.
   *
   * 1 heure = bon compromis pour une petite boutique.
   */
  var CACHE_MAX_AGE = 60 * 60 * 1000;

  /*
   * Empêche plusieurs appels GAS simultanés
   * pendant le même chargement.
   */
  var refreshPromise = null;


  /* ==============================
     APPEL GAS
     ============================== */

  function callGasPublic_(route, extraParams) {

    var url = new URL(GAS_PUBLIC_URL);

    url.searchParams.set('route', route);

    if (extraParams) {
      Object.keys(extraParams).forEach(function (key) {
        url.searchParams.set(key, extraParams[key]);
      });
    }

    return fetch(url.toString(), {
      method: 'GET',
      cache: 'no-store'
    })
      .then(function (res) {

        if (!res.ok) {
          throw new Error('Erreur HTTP ' + res.status);
        }

        return res.json();
      })

      .then(function (json) {

        if (!json.success) {

          var err = new Error(
            (json.error && json.error.message) ||
            'Erreur inconnue.'
          );

          err.code = json.error && json.error.code;

          throw err;
        }

        return json.data;
      });
  }


  /* ==============================
     NORMALISATION PRODUIT
     ============================== */

  function normalizeProduct_(p) {

    var photos =
      (p.photos && Array.isArray(p.photos))
        ? p.photos.slice()
        : [];

    if (
      p.photoPrincipale &&
      photos.indexOf(p.photoPrincipale) === -1
    ) {
      photos.unshift(p.photoPrincipale);
    }

    return {

      id: p.id,

      nom: p.nom,

      prix: p.prix,

      categorie: p.categorie,

      disponibilite: p.disponibilite,

      description: p.description || '',

      /*
       * Le Catalogue ne fournit pas actuellement
       * de description courte séparée.
       */
      descriptionCourte: '',

      imagePrincipale:
        p.photoPrincipale ||
        (photos[0] || ''),

      photos: photos
    };
  }


  /* ==============================
     LECTURE DU CACHE
     ============================== */

  function readCache_() {

    try {

      var raw = localStorage.getItem(CACHE_KEY);

      if (!raw) {
        return null;
      }

      var cache = JSON.parse(raw);

      if (
        !cache ||
        !Array.isArray(cache.products) ||
        !cache.savedAt
      ) {
        return null;
      }

      return cache;

    } catch (err) {

      console.warn(
        '[PublicAPI] Cache local illisible.',
        err
      );

      return null;
    }
  }


  /* ==============================
     ÉCRITURE DU CACHE
     ============================== */

  function writeCache_(products) {

    try {

      var cache = {

        version: 1,

        savedAt: Date.now(),

        products: products

      };

      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify(cache)
      );

    } catch (err) {

      /*
       * Si le stockage local est indisponible
       * ou plein, le site continue simplement
       * à fonctionner sans cache.
       */

      console.warn(
        '[PublicAPI] Impossible d’enregistrer le cache.',
        err
      );
    }
  }


  /* ==============================
     ÉTAT DU CACHE
     ============================== */

  function isCacheFresh_(cache) {

    if (!cache || !cache.savedAt) {
      return false;
    }

    return (
      Date.now() - cache.savedAt
    ) < CACHE_MAX_AGE;
  }


  /* ==============================
     COMPARAISON DU CATALOGUE
     ============================== */

  function productsSignature_(products) {

    try {

      return JSON.stringify(
        products.map(function (p) {

          return {
            id: p.id,
            nom: p.nom,
            prix: p.prix,
            categorie: p.categorie,
            disponibilite: p.disponibilite,
            description: p.description,
            imagePrincipale: p.imagePrincipale,
            photos: p.photos
          };

        })
      );

    } catch (err) {

      return '';
    }
  }


  function catalogueChanged_(oldProducts, newProducts) {

    return (
      productsSignature_(oldProducts) !==
      productsSignature_(newProducts)
    );
  }


  /* ==============================
     RAFRAÎCHISSEMENT GAS
     ============================== */

  function refreshCatalogue_(existingProducts) {

    /*
     * Si un rafraîchissement est déjà en cours,
     * on réutilise la même Promise.
     */
    if (refreshPromise) {
      return refreshPromise;
    }

    refreshPromise = callGasPublic_('produits')

      .then(function (data) {

        var products =
          (data.products || []).map(
            normalizeProduct_
          );

        /*
         * On écrit le cache même si le catalogue
         * est identique : cela renouvelle son âge.
         */
        writeCache_(products);

        return {

          products: products,

          changed:
            !existingProducts ||
            catalogueChanged_(
              existingProducts,
              products
            )

        };

      })

      .finally(function () {

        refreshPromise = null;

      });

    return refreshPromise;
  }


  /* ==============================
     CATALOGUE
     ============================== */

  function loadProducts() {

    var cache = readCache_();

    /*
     * Aucun cache :
     * il faut obligatoirement récupérer le catalogue.
     */
    if (!cache) {

      return refreshCatalogue_(null)
        .then(function (result) {
          return result.products;
        });

    }


    /*
     * Cache disponible :
     * on peut immédiatement l'utiliser.
     */
    var cachedProducts = cache.products;


    /*
     * Cache encore frais :
     *
     * Pas besoin de contacter GAS.
     */
    if (isCacheFresh_(cache)) {

      return Promise.resolve(
        cachedProducts
      );
    }


    /*
     * Cache ancien :
     *
     * On affiche quand même immédiatement
     * l'ancien catalogue.
     *
     * Ensuite on tente une mise à jour.
     */
    refreshCatalogue_(cachedProducts)

      .then(function (result) {

        if (result.changed) {

          /*
           * Si la page est toujours ouverte,
           * on demande aux pages qui le souhaitent
           * de recharger les données.
           */
          try {

            window.dispatchEvent(
              new CustomEvent(
                'catalogueUpdated',
                {
                  detail: {
                    products: result.products
                  }
                }
              )
            );

          } catch (err) {
            /* Rien à faire */
          }
        }

      })

      .catch(function (err) {

        /*
         * GAS inaccessible :
         * le cache reste parfaitement utilisable.
         */
        console.warn(
          '[PublicAPI] Actualisation impossible. Utilisation du cache.',
          err
        );

      });


    return Promise.resolve(
      cachedProducts
    );
  }


  /* ==============================
     PRODUIT PAR ID
     ============================== */

  function loadProductById(id) {

    var cache = readCache_();

    /*
     * Si le produit existe déjà dans le cache,
     * on peut l'afficher immédiatement.
     */
    if (cache && Array.isArray(cache.products)) {

      var cachedProduct =
        cache.products.find(function (product) {
          return String(product.id) === String(id);
        });

      if (cachedProduct) {

        /*
         * Si le cache est ancien, on tente
         * parallèlement une actualisation du catalogue.
         */
        if (!isCacheFresh_(cache)) {

          refreshCatalogue_(cache.products)
            .then(function (result) {

              if (result.changed) {

                try {

                  window.dispatchEvent(
                    new CustomEvent(
                      'catalogueUpdated',
                      {
                        detail: {
                          products: result.products
                        }
                      }
                    )
                  );

                } catch (err) {
                  /* Rien à faire */
                }
              }

            })
            .catch(function () {
              /* Le cache reste disponible */
            });
        }

        return Promise.resolve(
          cachedProduct
        );
      }
    }


    /*
     * Produit absent du cache :
     * on demande directement au GAS.
     */
    return callGasPublic_(
      'produit',
      { id: id }
    )
      .then(function (data) {

        var product =
          normalizeProduct_(data.product);

        /*
         * On peut enrichir le cache avec
         * ce produit si nécessaire.
         */
        var currentCache = readCache_();

        if (currentCache) {

          var exists =
            currentCache.products.some(
              function (p) {
                return String(p.id) === String(product.id);
              }
            );

          if (!exists) {

            currentCache.products.push(
              product
            );

            currentCache.savedAt =
              Date.now();

            try {

              localStorage.setItem(
                CACHE_KEY,
                JSON.stringify(currentCache)
              );

            } catch (err) {
              /* Cache facultatif */
            }
          }
        }

        return product;
      });
  }


  /* ==============================
     API PUBLIQUE
     ============================== */

  window.PublicAPI = {

    loadProducts: loadProducts,

    loadProductById: loadProductById,

    /*
     * Utile plus tard pour forcer une mise à jour
     * depuis une interface particulière.
     */
    refreshProducts: function () {

      var cache = readCache_();

      return refreshCatalogue_(
        cache ? cache.products : null
      )
        .then(function (result) {
          return result.products;
        });
    },

    /*
     * Permet de supprimer manuellement
     * le cache si nécessaire.
     */
    clearCache: function () {

      try {

        localStorage.removeItem(
          CACHE_KEY
        );

      } catch (err) {

        console.warn(
          '[PublicAPI] Impossible de supprimer le cache.',
          err
        );
      }
    }

  };

})();