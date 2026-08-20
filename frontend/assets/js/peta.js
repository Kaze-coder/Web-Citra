/**
 * Peta (Map) JavaScript - Satellite Imagery Integration
 * Menggunakan Leaflet.js dengan ESRI World Imagery dan opsional GEE
 */

let map;
let geeAvailable = false;

// ===== TILE LAYER DEFINITIONS (GRATIS, TANPA API KEY) =====
const SATELLITE_LAYERS = {
  'ESRI Satelit': {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    options: {
      attribution: '&copy; Esri, Maxar, Earthstar Geographics',
      maxZoom: 19
    }
  },
  'OpenStreetMap': {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    options: {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }
  },
  'Minimalis (Carto)': {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    options: {
      attribution: '&copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 20
    }
  }
};

/**
 * Update status indicator di UI
 */
function updateMapStatusUI(status, message) {
  const indicator = document.getElementById('geeStatusIndicator');
  const text = document.getElementById('geeStatusText');

  if (!indicator || !text) return;

  indicator.className = 'gee-status-dot';
  switch (status) {
    case 'connected':
      indicator.classList.add('gee-connected');
      text.textContent = message || 'Satelit Connected';
      break;
    case 'loading':
      indicator.classList.add('gee-loading');
      text.textContent = message || 'Memuat peta satelit...';
      break;
    case 'gee':
      indicator.classList.add('gee-connected');
      text.textContent = message || 'Google Earth Engine Active';
      break;
  }
}

/**
 * Coba load GEE tile layers dari backend (opsional)
 * Return null jika GEE tidak tersedia
 */
async function tryLoadGeeLayers() {
  try {
    const res = await axios.get('/earth-engine/tiles', { timeout: 5000 });
    if (res.data.success && res.data.data && res.data.data.length > 0) {
      const geeTileLayers = {};
      res.data.data.forEach(layer => {
        geeTileLayers['GEE: ' + layer.name] = L.tileLayer(layer.url, {
          attribution: layer.attribution,
          maxZoom: 20,
          tileSize: 256
        });
      });
      geeAvailable = true;
      console.log('✅ GEE layers loaded:', Object.keys(geeTileLayers).length);
      return geeTileLayers;
    }
  } catch (err) {
    console.log('ℹ️ GEE tidak tersedia, menggunakan layer satelit gratis');
  }
  return null;
}

/**
 * Build semua tile layers (free + opsional GEE)
 */
async function buildTileLayers() {
  // 1. Buat free satellite layers
  const tileLayers = {};
  Object.entries(SATELLITE_LAYERS).forEach(([name, config]) => {
    tileLayers[name] = L.tileLayer(config.url, config.options);
  });

  // 2. Coba tambahkan GEE layers (opsional, non-blocking)
  const geeLayers = await tryLoadGeeLayers();
  if (geeLayers) {
    Object.assign(tileLayers, geeLayers);
  }

  return tileLayers;
}

/**
 * Initialize dan load peta
 */
async function loadMap() {
  try {
    // Show loading overlay
    const loadingOverlay = document.getElementById('mapLoadingOverlay');
    if (loadingOverlay) loadingOverlay.style.display = 'flex';

    updateMapStatusUI('loading', 'Memuat peta satelit...');

    if (!map) {
      // ---- FIRST INIT ----
      const tileLayers = await buildTileLayers();
      const layerNames = Object.keys(tileLayers);
      const defaultLayer = tileLayers[layerNames[0]]; // ESRI Satelit sebagai default

      // Initialize Leaflet map
      map = L.map('map', {
        center: [-6.4, 106.8],
        zoom: 12,
        layers: [defaultLayer]
      });

      // Add layer control
      L.control.layers(tileLayers, null, {
        position: 'topright',
        collapsed: true
      }).addTo(map);

      // Add scale control
      L.control.scale({ imperial: false }).addTo(map);

      // Update status
      const totalLayers = layerNames.length;
      const satCount = Object.keys(SATELLITE_LAYERS).length;
      if (geeAvailable) {
        updateMapStatusUI('gee', `GEE + ${satCount} layer gratis aktif`);
      } else {
        updateMapStatusUI('connected', `${totalLayers} layer peta tersedia`);
      }

    } else {
      // ---- REFRESH: Clear existing markers ----
      map.eachLayer(layer => {
        if (layer instanceof L.Marker) {
          map.removeLayer(layer);
        }
      });
    }

    // Show loading state pada button
    const refreshBtn = document.getElementById('refreshMapBtn');
    if (refreshBtn) {
      refreshBtn.disabled = true;
      refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    }

    // Load pelanggan locations
    const res = await axios.get('/pelanggan/peta/coordinates');

    if (!res.data || !res.data.success) {
      throw new Error(res.data?.message || 'Gagal mengambil data lokasi');
    }

    const pelangganList = res.data.data || [];

    if (pelangganList.length === 0) {
      showNotification('Tidak ada data pelanggan', 'warning');
      if (refreshBtn) {
        refreshBtn.disabled = false;
        refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh Peta';
      }
      if (loadingOverlay) loadingOverlay.style.display = 'none';
      return;
    }

    let markerCount = 0;
    let bounds = L.latLngBounds();

    pelangganList.forEach(pel => {
      const lat = parseFloat(pel.latitude);
      const lng = parseFloat(pel.longitude);

      if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
        console.warn('Koordinat tidak valid untuk:', pel.nama_pelanggan);
        return;
      }

      const namaCustomer = pel.nama_pelanggan || 'Tidak Ada Nama';
      const noTelepon = pel.no_telepon || '-';
      const paket = pel.paket_layanan || '-';
      const harga = pel.harga_bulanan ? formatRupiah(pel.harga_bulanan) : '-';
      const status = pel.status || '-';

      const popupContent = `
        <div class="popup-content-customer" style="min-width: 250px;">
          <b style="color: #0066CC; font-size: 15px;">${escapeHtml(namaCustomer)}</b>
          <hr style="margin: 8px 0; border: none; border-top: 1px solid #ddd;">
          <small>
            <div class="popup-info-item" style="margin: 5px 0;">
              <i class="fas fa-phone" style="color: #0066CC; margin-right: 8px;"></i>
              <span><strong>No. Telepon:</strong> ${escapeHtml(noTelepon)}</span>
            </div>
            <div class="popup-info-item" style="margin: 5px 0;">
              <i class="fas fa-wifi" style="color: #0066CC; margin-right: 8px;"></i>
              <span><strong>Paket:</strong> ${escapeHtml(paket)}</span>
            </div>
            <div class="popup-info-item" style="margin: 5px 0;">
              <i class="fas fa-money-bill" style="color: #0066CC; margin-right: 8px;"></i>
              <span><strong>Harga:</strong> ${escapeHtml(harga)}/bln</span>
            </div>
            <div class="popup-info-item" style="margin: 5px 0;">
              <i class="fas fa-check-circle" style="color: #0066CC; margin-right: 8px;"></i>
              <span><strong>Status:</strong> ${escapeHtml(status)}</span>
            </div>
          </small>
        </div>
      `;

      const customIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });

      const marker = L.marker([lat, lng], {
        icon: customIcon,
        title: namaCustomer
      }).bindPopup(popupContent, { maxWidth: 300 });

      marker.addTo(map);
      bounds.extend([lat, lng]);
      markerCount++;
    });

    // Fit map to all markers
    if (markerCount > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    if (markerCount === 0) {
      showNotification('Tidak ada pelanggan dengan lokasi valid', 'warning');
    } else {
      showNotification(`${markerCount} lokasi pelanggan ditampilkan`, 'success');
    }

    // Reset button state
    if (refreshBtn) {
      refreshBtn.disabled = false;
      refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh Peta';
    }

    // Hide loading overlay
    if (loadingOverlay) loadingOverlay.style.display = 'none';

  } catch (error) {
    console.error('Error loading map:', error);
    showNotification(`Gagal memuat peta: ${error.message}`, 'error');

    const refreshBtn = document.getElementById('refreshMapBtn');
    if (refreshBtn) {
      refreshBtn.disabled = false;
      refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh Peta';
    }

    const loadingOverlay = document.getElementById('mapLoadingOverlay');
    if (loadingOverlay) loadingOverlay.style.display = 'none';
  }
}

/**
 * Auto-geocode semua pelanggan yang belum punya koordinat
 */
async function autoGeocodeAll() {
  const geocodeBtn = document.getElementById('geocodeBtn');
  const statusDiv = document.getElementById('geocodeStatus');

  try {
    geocodeBtn.disabled = true;
    geocodeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    statusDiv.textContent = 'Sedang membuat koordinat...';

    const res = await axios.post('/pelanggan/geocode/auto-all');

    if (res.data.success) {
      showNotification(`✓ Geocoding selesai: ${res.data.geocoded} berhasil, ${res.data.failed} gagal`, 'success');
      statusDiv.textContent = `${res.data.geocoded} berhasil, ${res.data.failed} gagal`;

      setTimeout(() => { loadMap(); }, 1500);
    } else {
      showNotification('Gagal melakukan geocoding: ' + res.data.message, 'error');
      statusDiv.textContent = 'Gagal';
    }
  } catch (error) {
    console.error('Error:', error);
    showNotification('Error: ' + (error.response?.data?.message || error.message), 'error');
    statusDiv.textContent = 'Error';
  } finally {
    geocodeBtn.disabled = false;
    geocodeBtn.innerHTML = '<i class="fas fa-location-crosshairs"></i> Generate Koordinat';
  }
}

// ===== EVENT LISTENERS =====

document.addEventListener('DOMContentLoaded', () => {
  const refreshBtn = document.getElementById('refreshMapBtn');
  const geocodeBtn = document.getElementById('geocodeBtn');

  if (refreshBtn) refreshBtn.addEventListener('click', () => loadMap());
  if (geocodeBtn) geocodeBtn.addEventListener('click', () => autoGeocodeAll());

  loadMap();
});

// Fallback if DOM already loaded
if (document.readyState !== 'loading') {
  const refreshBtn = document.getElementById('refreshMapBtn');
  const geocodeBtn = document.getElementById('geocodeBtn');

  if (refreshBtn) refreshBtn.addEventListener('click', () => loadMap());
  if (geocodeBtn) geocodeBtn.addEventListener('click', () => autoGeocodeAll());

  loadMap();
}
