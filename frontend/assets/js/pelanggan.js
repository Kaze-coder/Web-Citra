/**
 * Pelanggan (Customer) JavaScript
 */

let editingId = null;
let deletingId = null;
let lokasiMap = null;

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

async function loadPelanggan(page = 1) {
  try {
    const search = document.getElementById('searchPelanggan')?.value || '';
    const res = await axios.get('/pelanggan', { params: { page, search, limit: 10 } });
    
    if (res.data.success) {
      const table = document.getElementById('pelangganTable');
      table.innerHTML = res.data.data.map(p => `
        <tr>
          <td>${p.nama_pelanggan}</td>
          <td>${p.no_telepon}</td>
          <td style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${p.alamat || '-'}">${p.alamat || '-'}</td>
          <td>${p.paket_layanan}</td>
          <td>${formatRupiah(p.harga_bulanan)}</td>
          <td>${getStatusBadge(p.status)}</td>
          <td>
            <button class="btn btn-primary btn-sm" onclick="editPelanggan(${p.id})">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="openDeleteModal(${p.id})">Hapus</button>
          </td>
        </tr>
      `).join('');
      
      // Render pagination
      renderPagination(res.data.pagination);
    }
  } catch (error) {
    console.error('Error loading pelanggan:', error);
    showNotification('Gagal memuat data pelanggan', 'error');
  }
}

// Modal Functions
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

// Tampilkan map dengan marker
function displayLocationMap(lat, lng, address) {
  document.getElementById('lokasiModal').style.display = 'flex';
  
  // Destroy existing map jika ada
  if (lokasiMap) {
    lokasiMap.remove();
  }

  // Initialize Leaflet map
  const mapContainer = document.getElementById('mapContainer');
  mapContainer.innerHTML = '';
  
  lokasiMap = L.map(mapContainer).setView([lat, lng], 15);
  
  // Add tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(lokasiMap);

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
  }).addTo(lokasiMap).bindPopup(address);

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
      const deleteBtn = row.querySelector(`button[onclick="openDeleteModal(${id})"]`);
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

function renderPagination(pagination) {
  // TODO: Implement pagination
}

// Search event listener
const searchInput = document.getElementById('searchPelanggan');
if (searchInput) {
  let searchTimeout;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      loadPelanggan(1);
    }, 500);
  });
}

// Close modals on ESC key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
    closeDeleteModal();
    closeLokasiModal();
  }
});

// Close modals on background click
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
