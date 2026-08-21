/**
 * Modul Pelanggan - Citra NET Manager
 */

let editingId = null;
let deletingId = null;
let lokasiMap = null;
let dataTableInstance = null;

// Mapping paket ke harga (dalam Rupiah)
const paketHargaMap = {
  '10 Mbps': 150000,
  '25 Mbps': 200000,
  '30 Mbps': 250000,
  '50 Mbps': 350000,
  '100 Mbps': 500000,
  '150 Mbps': 650000,
  '200 Mbps': 800000,
  '300 Mbps': 1000000
};

// Parse coordinate dari alamat
function parseCoordinates(alamatText) {
  // Format: "-6.400064597825348, 106.97385676753991"
  const coordMatch = alamatText.match(/(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)/);
  if (coordMatch) {
    return {
      lat: parseFloat(coordMatch[1]),
      lng: parseFloat(coordMatch[2]),
      isCoordinate: true
    };
  }
  return null;
}

// Ambil koordinat pelanggan: dari kolom lokasi (JOIN) atau dari alamat berupa koordinat
function getPelangganCoords(p) {
  const lat = Number(p.latitude);
  const lng = Number(p.longitude);
  if (lat && lng) return { lat, lng };
  if (p.alamat) {
    const parsed = parseCoordinates(p.alamat);
    if (parsed) return { lat: parsed.lat, lng: parsed.lng };
  }
  return null;
}

// Buka lokasi pelanggan di Google Earth Web (3D, satu klik di browser)
function openEarthWeb(lat, lng) {
  // format: @lat,lng,altitude(a),distance(d),tilt(y),heading(h),tilt(t),roll(r)
  const url = `https://earth.google.com/web/@${lat},${lng},150a,1200d,35y,0h,0t,0r`;
  window.open(url, '_blank', 'noopener');
}

// Unduh file KML satu pelanggan (dibuka di Google Earth Pro desktop)
function downloadKML(lat, lng, nama, alamat) {
  const safeName = escapeXml(nama || 'Pelanggan');
  const desc = escapeXml(alamat || '');
  const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${safeName} - Citra NET</name>
    <Placemark>
      <name>${safeName}</name>
      <description>${desc}</description>
      <Point>
        <coordinates>${lng},${lat},0</coordinates>
      </Point>
    </Placemark>
  </Document>
</kml>`;
  const blob = new Blob([kml], { type: 'application/vnd.google-earth.kml+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `lokasi-${(nama || 'pelanggan').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.kml`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Escape teks untuk konten XML/KML
function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Bangun tombol aksi lokasi (Maps + Earth Web + unduh KML) untuk satu baris pelanggan
function buildLokasiButtons(p) {
  const coords = getPelangganCoords(p);
  const nama = escapeHtml(p.nama_pelanggan || '');
  const buttons = [];

  // Google Maps: pakai koordinat jika ada, kalau tidak pakai teks alamat
  if (coords || p.alamat) {
    const query = coords ? `${coords.lat},${coords.lng}` : encodeURIComponent(p.alamat);
    buttons.push(`<a href="https://www.google.com/maps/search/?api=1&query=${query}" target="_blank" rel="noopener" class="btn btn-outline-secondary btn-sm loc-btn" title="Buka di Google Maps" aria-label="Buka lokasi ${nama} di Google Maps"><i class="fas fa-map-marker-alt"></i></a>`);
  }

  // Google Earth Web + unduh KML hanya bila koordinat tersedia
  if (coords) {
    buttons.push(`<button type="button" class="btn btn-outline-primary btn-sm loc-btn" onclick="openEarthWeb(${coords.lat}, ${coords.lng})" title="Buka di Google Earth Web" aria-label="Buka lokasi ${nama} di Google Earth Web"><i class="fas fa-globe"></i></button>`);
    buttons.push(`<button type="button" class="btn btn-outline-secondary btn-sm loc-btn" onclick="downloadKML(${coords.lat}, ${coords.lng}, '${nama.replace(/'/g, "\\'")}', '${escapeHtml(p.alamat || '').replace(/'/g, "\\'")}')" title="Unduh KML (Google Earth Pro)" aria-label="Unduh file KML lokasi ${nama} untuk Google Earth Pro"><i class="fas fa-download"></i></button>`);
  }

  return buttons.length ? `<div class="loc-actions">${buttons.join('')}</div>` : '';
}

// Ambil data pelanggan dari API
async function loadPelanggan() {
  try {
    const res = await axios.get('/pelanggan', { params: { limit: 10000 } });
    
    if (res.data.success) {
      const table = document.getElementById('pelangganTable');
      
      if (dataTableInstance) {
        dataTableInstance.destroy();
      }
      
      if (!res.data.data || res.data.data.length === 0) {
        table.innerHTML = `
          <tr><td colspan="7" class="text-center py-5">
            <div class="empty-state">
              <i class="fas fa-inbox fa-2x mb-2" style="color:var(--text-secondary)"></i>
              <p class="mb-1" style="color:var(--text-secondary)">Belum ada pelanggan</p>
              <small style="color:var(--text-secondary)">Klik tombol "Tambah Pelanggan" untuk menambahkan data baru.</small>
            </div>
          </td></tr>`;
      } else {
        table.innerHTML = res.data.data.map(p => `
        <tr>
          <td>${escapeHtml(p.nama_pelanggan)}</td>
          <td>${escapeHtml(p.no_telepon)}</td>
          <td class="alamat-cell" title="${escapeHtml(p.alamat || '-')}">
            <div class="alamat-wrap">
              <span class="alamat-text">${escapeHtml(p.alamat || '-')}</span>
              ${buildLokasiButtons(p)}
            </div>
          </td>
          <td>${escapeHtml(p.paket_layanan)}</td>
          <td>${formatRupiah(p.harga_bulanan)}</td>
          <td>${getStatusBadge(p.status)}</td>
          <td>
            <button class="btn btn-primary btn-sm" onclick="editPelanggan('${p.id}')" aria-label="Edit pelanggan ${escapeHtml(p.nama_pelanggan)}"><i class="fas fa-edit"></i> Edit</button>
            <button class="btn btn-danger btn-sm" onclick="openDeleteModal('${p.id}')" aria-label="Hapus pelanggan ${escapeHtml(p.nama_pelanggan)}"><i class="fas fa-trash"></i> Hapus</button>
          </td>
        </tr>
      `).join('');
      }

      dataTableInstance = new DataTable('#mainTable', {
        language: { search: "Cari:", lengthMenu: "Tampilkan _MENU_ data", info: "Menampilkan _START_ sampai _END_ dari _TOTAL_ data" },
        columnDefs: [
          { className: "text-start", targets: "_all" }
        ]
      });
    }
  } catch (error) {
    console.error('Error loading pelanggan:', error);
    showNotification('Gagal memuat data pelanggan', 'error');
  }
}

// Fungsi Modal
function openModal(id = null) {
  const form = document.getElementById('pelangganForm');
  const title = document.getElementById('modalTitle');
  
  if (id) {
    // Edit mode
    editingId = id;
    title.textContent = 'Edit Pelanggan';
    loadPelangganData(id);
  } else {
    // Tambah mode
    editingId = null;
    title.textContent = 'Tambah Pelanggan';
    form.reset();
  }
  
  document.getElementById('tambahModal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('tambahModal').style.display = 'none';
  editingId = null;
  document.getElementById('pelangganForm').reset();
}

// Auto-fill harga berdasarkan paket
function updateHargaFromPaket() {
  const paketSelect = document.getElementById('paket_layanan');
  const hargaInput = document.getElementById('harga_bulanan');
  const selectedPaket = paketSelect.value;

  if (selectedPaket && paketHargaMap[selectedPaket]) {
    hargaInput.value = paketHargaMap[selectedPaket];
  }
}

// Cek dan tampilkan lokasi di map
function checkAlamatLocation() {
  const alamat = document.getElementById('alamat').value.trim();
  
  if (!alamat) {
    showNotification('Silakan isi alamat terlebih dahulu', 'warning');
    return;
  }

  // Cek apakah format koordinat
  const coords = parseCoordinates(alamat);
  
  if (coords) {
    // Format koordinat ditemukan
    displayLocationMap(coords.lat, coords.lng, alamat);
  } else {
    // Text address - gunakan Nominatim untuk geocoding
    geocodeAddress(alamat);
  }
}

// Geocode text address menggunakan Nominatim (OpenStreetMap)
async function geocodeAddress(address) {
  try {
    showNotification('Mencari lokasi...', 'info');
    
    const res = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: address,
        format: 'json',
        limit: 1
      }
    });

    if (res.data && res.data.length > 0) {
      const result = res.data[0];
      const lat = parseFloat(result.lat);
      const lng = parseFloat(result.lon);
      displayLocationMap(lat, lng, address);
      showNotification('Lokasi ditemukan!', 'success');
    } else {
      showNotification('Alamat tidak ditemukan. Gunakan format koordinat: lat, lng', 'warning');
    }
  } catch (error) {
    console.error('Geocoding error:', error);
    showNotification('Gagal geocode alamat. Gunakan format koordinat: -6.xxx, 106.xxx', 'error');
  }
}

// Tampilkan peta lokasi
function displayLocationMap(lat, lng, address) {
  document.getElementById('lokasiModal').style.display = 'flex';
  
  // Destroy existing map jika ada
  if (lokasiMap) {
    lokasiMap.remove();
  }

  // Initialize Leaflet map
  const mapContainer = document.getElementById('mapContainer');
  mapContainer.innerHTML = '';
  
  const osmMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
    maxZoom: 19
  });

  const esriSatellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: '&copy; Esri, Maxar, Earthstar Geographics',
    maxZoom: 19
  });

  lokasiMap = L.map(mapContainer, {
    center: [lat, lng],
    zoom: 15,
    layers: [esriSatellite]
  });

  const baseMaps = {
    "ESRI Satelit": esriSatellite,
    "OpenStreetMap": osmMap
  };

  L.control.layers(baseMaps, null, { position: 'topright' }).addTo(lokasiMap);
  L.control.scale({ imperial: false }).addTo(lokasiMap);

  // Add marker
  L.marker([lat, lng], {
    icon: L.icon({
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      shadowSize: [41, 41]
    })
  }).addTo(lokasiMap).bindPopup(escapeHtml(address));

  // Display coordinates
  document.getElementById('coordDisplay').textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  
  // Trigger map resize
  setTimeout(() => lokasiMap.invalidateSize(), 100);
}

function closeLokasiModal() {
  document.getElementById('lokasiModal').style.display = 'none';
  if (lokasiMap) {
    lokasiMap.remove();
    lokasiMap = null;
  }
}

async function loadPelangganData(id) {
  try {
    const res = await axios.get(`/pelanggan/${id}`);
    if (res.data.success) {
      const p = res.data.data;
      document.getElementById('nama').value = p.nama_pelanggan;
      document.getElementById('no_telepon').value = p.no_telepon;
      document.getElementById('alamat').value = p.alamat || '';
      document.getElementById('paket_layanan').value = p.paket_layanan;
      document.getElementById('harga_bulanan').value = p.harga_bulanan;
      document.getElementById('status').value = p.status;
    }
  } catch (error) {
    showNotification('Gagal memuat data pelanggan', 'error');
  }
}

async function savePelanggan() {
  try {
    const data = {
      nama_pelanggan: document.getElementById('nama').value,
      no_telepon: document.getElementById('no_telepon').value,
      alamat: document.getElementById('alamat').value,
      paket_layanan: document.getElementById('paket_layanan').value,
      harga_bulanan: parseInt(document.getElementById('harga_bulanan').value),
      status: document.getElementById('status').value
    };

    // Ekstrak koordinat jika user paste dari Google Maps
    const coords = parseCoordinates(data.alamat);
    if (coords) {
      data.latitude = coords.lat;
      data.longitude = coords.lng;
    }

    if (!data.nama_pelanggan || !data.no_telepon || !data.alamat || !data.paket_layanan || !data.harga_bulanan) {
      showNotification('Semua field harus diisi', 'error');
      return;
    }

    let res;
    if (editingId) {
      // Update
      res = await axios.put(`/pelanggan/${editingId}`, data);
      showNotification('Pelanggan berhasil diperbarui', 'success');
    } else {
      // Create
      res = await axios.post('/pelanggan', data);
      showNotification('Pelanggan berhasil ditambahkan', 'success');
    }

    closeModal();
    loadPelanggan();
  } catch (error) {
    showNotification(error.response?.data?.message || 'Gagal menyimpan pelanggan', 'error');
  }
}

function editPelanggan(id) {
  openModal(id);
}

function openDeleteModal(id) {
  // Get pelanggan data dari tabel
  const rows = document.querySelectorAll('#pelangganTable tr');
  let pelangganName = '';
  
  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    // Find the row with the delete button we clicked
    if (cells[0]) {
      const deleteBtn = row.querySelector(`button[onclick="openDeleteModal('${id}')"]`);
      if (deleteBtn) {
        pelangganName = cells[0].textContent;
      }
    }
  });

  deletingId = id;
  document.getElementById('deletePelangganName').textContent = pelangganName || 'Pelanggan';
  document.getElementById('deleteModal').style.display = 'flex';
}

function closeDeleteModal() {
  document.getElementById('deleteModal').style.display = 'none';
  deletingId = null;
}

async function confirmDelete() {
  try {
    const pelangganName = document.getElementById('deletePelangganName').textContent;
    await axios.delete(`/pelanggan/${deletingId}`);
    showNotification(`✓ Pelanggan "${pelangganName}" telah dihapus`, 'success');
    closeDeleteModal();
    loadPelanggan();
  } catch (error) {
    showNotification('Gagal menghapus pelanggan', 'error');
  }
}

async function exportCSV() {
  try {
    const res = await axios.get('/pelanggan', { params: { limit: 1000 } });
    
    if (!res.data.success || !res.data.data.length) {
      showNotification('Tidak ada data untuk diekspor', 'warning');
      return;
    }

    const data = res.data.data;
    const headers = ['Nama', 'No. Telepon', 'Paket Layanan', 'Harga Bulanan', 'Status'];
    const rows = data.map(p => [
      p.nama_pelanggan,
      p.no_telepon,
      p.paket_layanan,
      p.harga_bulanan,
      p.status
    ]);

    // Create CSV content
    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.map(cell => {
        // Escape quotes and wrap in quotes if contains comma
        if (typeof cell === 'string' && cell.includes(',')) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(',') + '\n';
    });

    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `pelanggan_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification('Data berhasil diunduh', 'success');
  } catch (error) {
    showNotification('Gagal mengekspor data', 'error');
  }
}



// Tutup modal dengan tombol ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
    closeDeleteModal();
    closeLokasiModal();
  }
});

// Tutup modal dengan klik background
document.getElementById('tambahModal')?.addEventListener('click', (e) => {
  if (e.target.id === 'tambahModal') closeModal();
});

document.getElementById('deleteModal')?.addEventListener('click', (e) => {
  if (e.target.id === 'deleteModal') closeDeleteModal();
});

document.getElementById('lokasiModal')?.addEventListener('click', (e) => {
  if (e.target.id === 'lokasiModal') closeLokasiModal();
});

// Auto-fill harga saat paket berubah
const paketSelect = document.getElementById('paket_layanan');
if (paketSelect) {
  paketSelect.addEventListener('change', updateHargaFromPaket);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    loadPelanggan();
    // Setup paket listener
    const paketSelect = document.getElementById('paket_layanan');
    if (paketSelect) {
      paketSelect.addEventListener('change', updateHargaFromPaket);
    }
  });
} else {
  loadPelanggan();
  // Setup paket listener
  const paketSelect = document.getElementById('paket_layanan');
  if (paketSelect) {
    paketSelect.addEventListener('change', updateHargaFromPaket);
  }
}
