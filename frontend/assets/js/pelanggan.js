/**
 * Pelanggan (Customer) JavaScript
 */

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
          <td>${p.paket_layanan}</td>
          <td>${formatRupiah(p.harga_bulanan)}</td>
          <td>${getStatusBadge(p.status)}</td>
          <td>
            <button class="btn btn-primary btn-sm" onclick="editPelanggan(${p.id})">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="deletePelanggan(${p.id})">Hapus</button>
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

function editPelanggan(id) {
  alert('Edit pelanggan ' + id);
}

function deletePelanggan(id) {
  if (!confirm('Yakin ingin menghapus pelanggan ini?')) return;
  
  axios.delete('/pelanggan/' + id)
    .then(res => {
      showNotification('Pelanggan berhasil dihapus', 'success');
      loadPelanggan();
    })
    .catch(err => {
      showNotification('Gagal menghapus pelanggan', 'error');
    });
}

function exportCSV() {
  showNotification('Fitur export akan segera hadir', 'info');
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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => loadPelanggan());
} else {
  loadPelanggan();
}
