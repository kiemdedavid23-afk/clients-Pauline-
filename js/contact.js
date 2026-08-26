/**
 * Injection centralisée des liens de contact réels, à partir de
 * window.SHOP_CONFIG uniquement. Aucune coordonnée n'est jamais
 * écrite en dur dans le HTML.
 */
(function () {

  function formatPrice_(prix) {
    return Number(prix).toLocaleString('fr-FR') + ' FCFA';
  }

  function formatPhoneDisplay_(phone) {
    var match = phone.match(/^(\+\d{3})(\d+)$/);
    if (!match) return phone;
    var groups = match[2].match(/.{1,2}/g) || [];
    return match[1] + ' ' + groups.join(' ');
  }

  function fillTemplate_(template, el) {
    if (!template) return '';
    var nom = el.getAttribute('data-product-nom') || '';
    var id = el.getAttribute('data-product-id') || '';
    var prix = el.getAttribute('data-product-prix');
    var url = el.getAttribute('data-product-url') || window.location.href;

    return template
      .replace(/{{nom}}/g, nom)
      .replace(/{{id}}/g, id)
      .replace(/{{prix}}/g, prix ? formatPrice_(prix) : '')
      .replace(/{{url}}/g, url);
  }

  function applyContactLinks(root) {
    var config = window.SHOP_CONFIG;
    if (!config) {
      console.warn('[contact.js] SHOP_CONFIG introuvable.');
      return;
    }

    var scope = root || document;

    scope.querySelectorAll('[data-contact-role="call"]').forEach(function (el) {
      if (!config.phone) { el.hidden = true; return; }
      el.href = 'tel:' + config.phone;
      el.hidden = false;
    });

    scope.querySelectorAll('[data-contact-role="sms"]').forEach(function (el) {
      if (!config.phone) { el.hidden = true; return; }
      var body = fillTemplate_(el.getAttribute('data-contact-body'), el);
      el.href = 'sms:' + config.phone + (body ? '?body=' + encodeURIComponent(body) : '');
      el.hidden = false;
    });

    scope.querySelectorAll('[data-contact-role="mail"]').forEach(function (el) {
      if (!config.email) { el.hidden = true; return; }
      var subject = fillTemplate_(el.getAttribute('data-contact-subject'), el);
      var body = fillTemplate_(el.getAttribute('data-contact-body'), el);
      var params = [];
      if (subject) params.push('subject=' + encodeURIComponent(subject));
      if (body) params.push('body=' + encodeURIComponent(body));
      el.href = 'mailto:' + config.email + (params.length ? '?' + params.join('&') : '');
      el.hidden = false;
    });

    scope.querySelectorAll('[data-contact-role="whatsapp"]').forEach(function (el) {
      if (!config.whatsapp) { el.hidden = true; return; }
      var body = fillTemplate_(el.getAttribute('data-contact-body'), el);
      el.href = 'https://wa.me/' + config.whatsapp + (body ? '?text=' + encodeURIComponent(body) : '');
      el.hidden = false;
    });

    scope.querySelectorAll('[data-contact-role="facebook"]').forEach(function (el) {
      if (!config.facebook) { el.hidden = true; return; }
      el.href = config.facebook;
      el.hidden = false;
    });

    scope.querySelectorAll('[data-contact-role="itinerary"]').forEach(function (el) {
      if (!config.mapsUrl) { el.hidden = true; return; }
      el.href = config.mapsUrl;
      el.hidden = false;
    });

    scope.querySelectorAll('[data-contact-fill="phone"]').forEach(function (el) {
      if (config.phone) el.textContent = formatPhoneDisplay_(config.phone);
    });

    scope.querySelectorAll('[data-contact-fill="email"]').forEach(function (el) {
      if (config.email) el.textContent = config.email;
    });
  }

  window.applyContactLinks = applyContactLinks;

  document.addEventListener('DOMContentLoaded', function () {
    applyContactLinks(document);
  });

})();