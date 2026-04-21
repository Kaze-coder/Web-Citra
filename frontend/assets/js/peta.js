/**
 * Peta (Map) JavaScript
 */

let map;

async function loadMap() {
  try {
    // Initialize Leaflet map
    map = L.map('map').setView([-6.4, 106.8], 12);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    // Load pelanggan locations
    const res = await axios.get('/lokasi');
    if (res.data.success) {
      res.data.data.forEach(loc => {
        if (loc.latitude && loc.longitude) {
          L.marker([loc.latitude, loc.longitude])
            .bindPopup(`<b>${loc.nama_pelanggan}</b><br>${loc.keterangan_lokasi}`)
            .addTo(map);
        }
      });
    }
  } catch (error) {
    console.error('Error loading map:', error);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadMap);
} else {
  loadMap();
}
