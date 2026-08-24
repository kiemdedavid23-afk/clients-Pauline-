/**
 * Preloader global — centralisé, seul fichier à modifier pour tout
 * changement futur. Ce script doit être chargé en tout premier dans
 * <body>, sans defer/async, pour s'exécuter avant que la page
 * n'affiche quoi que ce soit d'autre (évite l'écran blanc).
 */
(function () {
  var LOGO_SRC = 'assets/logo/logo-pauline.png';
  var SAFETY_TIMEOUT_MS = 4000; // filet de sécurité, jamais un délai artificiel

  function buildMarkup() {
    return (
      '<div class="preloader-inner">' +
        '<span class="preloader-logo-wrap">' +
          '<img src="' + LOGO_SRC + '" alt="Chez Tantie Pauline" class="preloader-logo-real" ' +
            'onerror="this.style.display=\'none\'; this.nextElementSibling.style.display=\'block\';">' +
          '<svg class="preloader-logo-fallback" viewBox="0 0 60 60" aria-hidden="true">' +
            '<defs><linearGradient id="preloaderLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">' +
              '<stop offset="0%" stop-color="#2c5c8a" /><stop offset="100%" stop-color="#163a5c" />' +
            '</linearGradient></defs>' +
            '<circle cx="30" cy="30" r="29" fill="url(#preloaderLogoGrad)" />' +
            '<text x="30" y="37" font-family="\'Cormorant Garamond\', serif" font-style="italic" font-weight="700" font-size="22" fill="#fff" text-anchor="middle">TP</text>' +
            '<path d="M13 43 Q30 50 47 43" stroke="#d3a94c" stroke-width="1.4" fill="none" stroke-linecap="round" />' +
          '</svg>' +
        '</span>' +
        '<p class="preloader-text">Chez Tantie Pauline</p>' +
        '<span class="preloader-dots"><span></span><span></span><span></span></span>' +
      '</div>'
    );
  }

  var preloader = document.createElement('div');
  preloader.id = 'sitePreloader';
  preloader.className = 'site-preloader';
  preloader.setAttribute('aria-hidden', 'true');
  preloader.innerHTML = buildMarkup();

  document.documentElement.classList.add('preload-active');
  document.body.insertBefore(preloader, document.body.firstChild);

  var hidden = false;

  function hidePreloader() {
    if (hidden) return;
    hidden = true;
    var el = document.getElementById('sitePreloader');
    document.documentElement.classList.remove('preload-active');
    if (!el) return;
    el.classList.add('preloader-hidden');
    setTimeout(function () {
      if (el && el.parentNode) el.parentNode.removeChild(el);
    }, 500);
  }

  // Se cache dès que la page (y compris ses images) est prête...
  window.addEventListener('load', hidePreloader);
  // ...et JAMAIS bloqué indéfiniment même en cas de souci JS ailleurs.
  setTimeout(hidePreloader, SAFETY_TIMEOUT_MS);
})();