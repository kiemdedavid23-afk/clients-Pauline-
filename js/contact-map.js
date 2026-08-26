/**
 * Carte interactive de la page Contact (OpenStreetMap + Leaflet).
 * Le visiteur reste sur contact.html : aucune redirection automatique
 * vers Google Maps. Le bouton "Voir l'itinéraire" (géré par contact.js)
 * reste le seul moyen d'ouvrir Google Maps, et uniquement sur demande.
 */
(function () {

  document.addEventListener('DOMContentLoaded', function () {
    var mapEl = document.getElementById('contactMap');
    var config = window.SHOP_CONFIG || {};
    var location = config.location;

    if (!mapEl || !location || typeof L === 'undefined') return;

    var map = L.map('contactMap', {
      scrollWheelZoom: false
    }).setView([location.lat, location.lng], 16);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
    }).addTo(map);

    var customIcon = L.divIcon({
      className: 'map-marker-tp',
      html: '<span class="map-marker-tp-pin"><span class="map-marker-tp-label">TP</span></span>',
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -38]
    });

    var marker = L.marker([location.lat, location.lng], { icon: customIcon }).addTo(map);
    marker.bindPopup('<strong>Chez Tantie Pauline</strong><br>Sacs & Chaussures');
  });

})();