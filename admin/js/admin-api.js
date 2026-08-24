/**
 * Couche unique d'accès au GAS Administration.
 * Toutes les pages admin passent par ici — aucun fetch() ailleurs dans le code.
 */
(function () {

  // URL du Web App GAS Administration déployé.
  var GAS_ADMIN_URL = 'https://script.google.com/macros/s/AKfycbxEPgKNxBaIFyu1InjsLBsK9x_rcbHUfD4epsJtFSkDoUG6LpNofQe9YbtCBM0tmv56lA/exec';

  var TOKEN_STORAGE_KEY = 'ctp_admin_token';

  function getToken() {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  }

  function setToken(token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  }

  function clearToken() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }

  function mergePayload_(base, extra) {
    var result = {};
    var key;
    for (key in base) { if (base.hasOwnProperty(key)) result[key] = base[key]; }
    for (key in extra) { if (extra.hasOwnProperty(key)) result[key] = extra[key]; }
    return result;
  }

  function withToken_(payload) {
    return mergePayload_({ token: getToken() }, payload || {});
  }

  /**
   * Appel générique au GAS. Content-Type "text/plain" volontaire :
   * évite le préflight CORS, qu'Apps Script ne gère pas.
   */
  function callGas_(action, payload) {
    var body = mergePayload_({ action: action }, payload || {});

    return fetch(GAS_ADMIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body)
    })
      .then(function (res) { return res.json(); })
      .then(function (json) {
        if (!json.success) {
          var err = new Error((json.error && json.error.message) || 'Erreur inconnue.');
          err.code = json.error && json.error.code;
          throw err;
        }
        return json.data;
      });
  }

  window.AdminAPI = {

    login: function (identifiant, password) {
      return callGas_('login', { identifiant: identifiant, password: password })
        .then(function (data) {
          setToken(data.token);
          return data;
        });
    },

    logout: function () {
      return callGas_('logout', withToken_())
        .then(function (data) { clearToken(); return data; })
        .catch(function (err) { clearToken(); throw err; });
    },

    checkSession: function () {
      if (!getToken()) return Promise.resolve(false);
      return callGas_('checkSession', withToken_())
        .then(function (data) { return !!data.valid; })
        .catch(function () { return false; });
    },

    getProducts: function () {
      return callGas_('getProducts', withToken_());
    },

    getProduct: function (id) {
      return callGas_('getProduct', withToken_({ id: id }));
    },

    createProduct: function (product) {
      return callGas_('createProduct', withToken_(product));
    },

    updateProduct: function (id, product) {
      return callGas_('updateProduct', withToken_(mergePayload_({ id: id }, product)));
    },

    publishProduct: function (id) {
      return callGas_('publishProduct', withToken_({ id: id }));
    },

    unpublishProduct: function (id) {
      return callGas_('unpublishProduct', withToken_({ id: id }));
    },

    deleteProduct: function (id) {
      return callGas_('deleteProduct', withToken_({ id: id }));
    },

    uploadImage: function (imageBase64) {
      return callGas_('uploadImage', withToken_({ imageBase64: imageBase64 }));
    },

    getToken: getToken,
    clearToken: clearToken
  };

})();