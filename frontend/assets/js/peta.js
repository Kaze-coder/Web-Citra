/**
 * Peta (Map) JavaScript
 */

let map;
let markers = [];

async function loadMap() {
  try {
    // Initialize Leaflet map
    map = L.map('map').setView([-6.4, 106.8], 12);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    // Load locations
    await loadLocationMarkers();
  } catch (error) {
    console.error('Error loading map:', error);
    showNotification('Gagal memuat peta', 'error');
  }
}

async function loadLocationMarkers() {
  try {
    // Clear existing markers
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];

    // Load pelanggan locations from API
    const res = await axios.get('/lokasi');
    if (res.data.success) {
      const lokasiData = res.data.data;
      
      if (lokasiData.length === 0) {
        showNotification('Belum ada lokasi pelanggan. Tambahkan alamat dengan koordinat di Data Pelanggan.', 'info');
        return;
      }

      lokasiData.forEach(loc => {
        // Convert to number if string
        const lat = parseFloat(loc.latitude);
        const lng = parseFloat(loc.longitude);
        
        if (lat && lng) {
          const marker = L.marker([lat, lng], {
            icon: L.icon({
              iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
              shadowSize: [41, 41]
            })
          })
          .bindPopup(`
            <div style="min-width: 200px;">
              <b>${loc.nama_pelanggan}</b><br>
              <small>${loc.no_telepon}</small><br>
              <hr style="margin: 5px 0;">
              <small>${loc.keterangan_lokasi}</small><br>
              <small style="color: #6B7280;">
                ${lat.toFixed(4)}, ${lng.toFixed(4)}
              </small>
            </div>
          `)
          .addTo(map);
          
          markers.push(marker);
        }
      });
    }
  } catch (error) {
    console.error('Error loading location markers:', error);
    showNotification('Gagal memuat lokasi dari server', 'error');
  }
}

function refreshMapLocations() {
  showNotification('Memperbarui lokasi...', 'info');
  loadLocationMarkers().then(() => {
    showNotification('Peta berhasil diperbarui', 'success');
  }).catch(err => {
    showNotification('Gagal memperbarui peta', 'error');
  });
}

// Initialize map on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadMap);
} else {
  loadMap();
}

// Auto-refresh setiap 30 detik (optional, uncomment untuk auto-refresh)
// setInterval(loadLocationMarkers, 30000);
