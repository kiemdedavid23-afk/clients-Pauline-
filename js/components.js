document.addEventListener('DOMContentLoaded', function () {
  loadComponent('components/header.html', 'site-header', initHeaderBehavior);
  loadComponent('components/footer.html', 'site-footer', initSmartWhatsappWidget);
});

/**
 * Charge un composant HTML partagé dans un emplacement de la page.
 * @param {string} url - chemin du fichier composant
 * @param {string} placeholderId - id du <div> destiné à recevoir le composant
 * @param {function} [callback] - exécuté une fois le composant injecté
 */
function loadComponent(url, placeholderId, callback) {
  var el = document.getElementById(placeholderId);
  if (!el) return;

  fetch(url)
    .then(function (res) {
      if (!res.ok) throw new Error('Impossible de charger ' + url);
      return res.text();
    })
    .then(function (html) {
      el.innerHTML = html;
      setActiveNavLinks();
      if (callback) callback();
    })
    .catch(function (err) {
      console.error('[components.js]', err);
    });
}

/**
 * Ajoute la classe "active" au lien de menu correspondant à la page en cours.
 * Fonctionne pour la nav desktop ET le menu overlay mobile, sans duplication.
 */
function setActiveNavLinks() {
  var current = location.pathname.split('/').pop();
  if (!current) current = 'index.html';

  document.querySelectorAll('.nav-link, .nav-overlay-link').forEach(function (link) {
    var href = link.getAttribute('href');
    if (!href) return;
    var page = href.split('/').pop();
    link.classList.toggle('active', page === current);
  });
}

/**
 * Comportement du header : menu hamburger (overlay mobile) + légère
 * animation au scroll. Dépend du header injecté, donc appelé après le fetch.
 */
function initHeaderBehavior() {
  var header = document.getElementById('mainHeader');
  var hamburgerBtn = document.getElementById('hamburgerBtn');
  var navCloseBtn = document.getElementById('navCloseBtn');
  var navOverlay = document.getElementById('navOverlay');
  var body = document.body;

  if (!header || !hamburgerBtn || !navOverlay) return;

  function openNav() {
    navOverlay.classList.add('open');
    navOverlay.setAttribute('aria-hidden', 'false');
    hamburgerBtn.setAttribute('aria-expanded', 'true');
    body.classList.add('nav-locked');
  }

  function closeNav() {
    navOverlay.classList.remove('open');
    navOverlay.setAttribute('aria-hidden', 'true');
    hamburgerBtn.setAttribute('aria-expanded', 'false');
    body.classList.remove('nav-locked');
  }

  hamburgerBtn.addEventListener('click', openNav);
  if (navCloseBtn) navCloseBtn.addEventListener('click', closeNav);

  navOverlay.querySelectorAll('.nav-overlay-link').forEach(function (link) {
    link.addEventListener('click', closeNav);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeNav();
  });

  function handleHeaderScroll() {
    header.classList.toggle('scrolled', window.scrollY > 12);
  }
  window.addEventListener('scroll', handleHeaderScroll, { passive: true });
  handleHeaderScroll();
}

/**
 * Widget WhatsApp flottant "intelligent" : bascule son apparence selon
 * qu'il survole une zone claire ou une zone sombre/bleue du site.
 * Utilise IntersectionObserver (léger, pas de setInterval), en ne
 * surveillant que la bande basse de l'écran où le widget est ancré.
 */
function initSmartWhatsappWidget() {
  var widget = document.getElementById('waFloatBadge');
  var darkZones = document.querySelectorAll('[data-wa-contrast="dark"]');

  if (!widget || !darkZones.length || !('IntersectionObserver' in window)) return;

  var activeZones = new Set();

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        activeZones.add(entry.target);
      } else {
        activeZones.delete(entry.target);
      }
    });
    widget.classList.toggle('wa-float-badge-light', activeZones.size > 0);
  }, {
    root: null,
    // Ne considère que la bande basse de l'écran (là où le widget flotte)
    rootMargin: '-85% 0px 0px 0px',
    threshold: 0
  });

  darkZones.forEach(function (zone) { observer.observe(zone); });
}