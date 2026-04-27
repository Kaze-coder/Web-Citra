/**
 * Tagihan (Invoice) JavaScript
 */

let editingId = null;
let deletingId = null;
let markPaidId = null;

async function loadTagihan(page = 1) {
  try {
    const status = document.getElementById('filterStatus')?.value || '';
    const bulan = document.getElementById('filterBulan')?.value || '';
    
    const params = { page, limit: 10 };
    if (status) params.status = status;
    if (bulan) params.bulan = bulan;
    
    const res = await axios.get('/tagihan', { params });
    
    if (res.data.success) {
      const table = document.getElementById('tagihanTable');
      table.innerHTML = res.data.data.map(t => `
        <tr>
          <td>${t.nama_pelanggan}</td>
          <td>${t.no_telepon}</td>
          <td>${formatRupiah(t.jumlah_tagihan)}</td>
          <td>${getStatusBadge(t.status_pembayaran)}</td>
          <td>${formatDateShort(t.bulan_tagihan)}</td>
          <td>
            <button class="btn btn-success btn-sm" onclick="openMarkPaidModal(${t.id}, '${t.nama_pelanggan}')" title="Tandai Lunas">
              <i class="fas fa-check-circle"></i>
            </button>
            <button class="btn btn-primary btn-sm" onclick="editTagihan(${t.id})" title="Edit">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-danger btn-sm" onclick="openDeleteTagihanModal(${t.id}, '${t.nama_pelanggan}', '${t.bulan_tagihan}')" title="Hapus">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>
      `).join('');
    }
  } catch (error) {
    console.error('Error loading tagihan:', error);
    showNotification('Gagal memuat data tagihan', 'error');
  }
}

// Load pelanggan untuk dropdown
async function loadPelangganDropdown() {
  try {
    const res = await axios.get('/pelanggan', { params: { limit: 1000 } });
    if (res.data.success) {
      const select = document.getElementById('pelanggan_id');
      select.innerHTML = '<option value="">-- Pilih Pelanggan --</option>';
      res.data.data.forEach(p => {
        const option = document.createElement('option');
        option.value = p.id;
        option.textContent = `${p.nama_pelanggan} (${p.no_telepon})`;
        select.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error loading pelanggan:', error);
  }
}

function openCreateModal() {
  editingId = null;
  document.getElementById('modalTitle').textContent = 'Buat Tagihan Baru';
  document.getElementById('tagihanForm').reset();
  document.getElementById('tagihanModal').style.display = 'flex';
}

function closeTagihanModal() {
  document.getElementById('tagihanModal').style.display = 'none';
  editingId = null;
  document.getElementById('tagihanForm').reset();
}

async function editTagihan(id) {
  try {
    editingId = id;
    document.getElementById('modalTitle').textContent = 'Edit Tagihan';
    
    // Load tagihan data
    const res = await axios.get(`/tagihan/${id}`);
    if (res.data.success) {
      const t = res.data.data;
      document.getElementById('pelanggan_id').value = t.pelanggan_id;
      document.getElementById('bulan_tagihan').value = t.bulan_tagihan;
      document.getElementById('jumlah_tagihan').value = t.jumlah_tagihan;
      document.getElementById('status_pembayaran').value = t.status_pembayaran;
      document.getElementById('metode_pembayaran').value = t.metode_pembayaran || '';
      document.getElementById('catatan').value = t.catatan || '';
      document.getElementById('tagihanModal').style.display = 'flex';
    }
  } catch (error) {
    showNotification('Gagal memuat data tagihan', 'error');
  }
}

async function saveTagihan() {
  try {
    const data = {
      pelanggan_id: document.getElementById('pelanggan_id').value,
      bulan_tagihan: document.getElementById('bulan_tagihan').value,
      jumlah_tagihan: parseInt(document.getElementById('jumlah_tagihan').value),
      status_pembayaran: document.getElementById('status_pembayaran').value,
      metode_pembayaran: document.getElementById('metode_pembayaran').value,
      catatan: document.getElementById('catatan').value
    };

    if (!data.pelanggan_id || !data.bulan_tagihan || !data.jumlah_tagihan) {
      showNotification('Semua field wajib diisi', 'error');
      return;
    }

    if (editingId) {
      // Update
      await axios.put(`/tagihan/${editingId}`, data);
      showNotification('Tagihan berhasil diperbarui', 'success');
    } else {
      // Create
      await axios.post('/tagihan', data);
      showNotification('Tagihan berhasil dibuat', 'success');
    }

    closeTagihanModal();
    loadTagihan();
  } catch (error) {
    showNotification(error.response?.data?.message || 'Gagal menyimpan tagihan', 'error');
  }
}

function openMarkPaidModal(id, pelangganName) {
  markPaidId = id;
  document.getElementById('markPaidPelanggan').textContent = pelangganName;
  document.getElementById('markPaidDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('markPaidModal').style.display = 'flex';
}

function closeMarkPaidModal() {
  document.getElementById('markPaidModal').style.display = 'none';
  markPaidId = null;
}

async function confirmMarkPaid() {
  try {
    const data = {
      status_pembayaran: 'lunas',
      tanggal_pembayaran: document.getElementById('markPaidDate').value,
      metode_pembayaran: document.getElementById('markPaidMethod').value
    };

    await axios.put(`/tagihan/${markPaidId}`, data);
    showNotification('Tagihan berhasil ditandai lunas', 'success');
    closeMarkPaidModal();
    loadTagihan();
  } catch (error) {
    showNotification('Gagal mengupdate tagihan', 'error');
  }
}

function openDeleteTagihanModal(id, pelanggan, bulan) {
  deletingId = id;
  document.getElementById('deleteTagihanInfo').textContent = `${pelanggan} - ${formatDateShort(bulan)}`;
  document.getElementById('deleteTagihanModal').style.display = 'flex';
}

function closeDeleteTagihanModal() {
  document.getElementById('deleteTagihanModal').style.display = 'none';
  deletingId = null;
}

async function confirmDeleteTagihan() {
  try {
    await axios.delete(`/tagihan/${deletingId}`);
    showNotification('Tagihan berhasil dihapus', 'success');
    closeDeleteTagihanModal();
    loadTagihan();
  } catch (error) {
    showNotification('Gagal menghapus tagihan', 'error');
  }
}

async function exportTagihanCSV() {
  try {
    const res = await axios.get('/tagihan', { params: { limit: 1000 } });
    
    if (!res.data.success || !res.data.data.length) {
      showNotification('Tidak ada data untuk diekspor', 'warning');
      return;
    }

    const data = res.data.data;
    const headers = ['Pelanggan', 'No. HP', 'Jumlah', 'Status', 'Bulan', 'Metode'];
    const rows = data.map(t => [
      t.nama_pelanggan,
      t.no_telepon,
      t.jumlah_tagihan,
      t.status_pembayaran,
      t.bulan_tagihan,
      t.metode_pembayaran || '-'
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.map(cell => {
        if (typeof cell === 'string' && cell.includes(',')) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `tagihan_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification('Data berhasil diunduh', 'success');
  } catch (error) {
    showNotification('Gagal mengekspor data', 'error');
  }
}

// Filter handlers
const filterStatus = document.getElementById('filterStatus');
const filterBulan = document.getElementById('filterBulan');

if (filterStatus) {
  filterStatus.addEventListener('change', () => loadTagihan());
}

if (filterBulan) {
  filterBulan.addEventListener('change', () => loadTagihan());
}

// Close modals on ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeTagihanModal();
    closeMarkPaidModal();
    closeDeleteTagihanModal();
  }
});

// Close modals on background click
document.getElementById('tagihanModal')?.addEventListener('click', (e) => {
  if (e.target.id === 'tagihanModal') closeTagihanModal();
});

document.getElementById('markPaidModal')?.addEventListener('click', (e) => {
  if (e.target.id === 'markPaidModal') closeMarkPaidModal();
});

document.getElementById('deleteTagihanModal')?.addEventListener('click', (e) => {
  if (e.target.id === 'deleteTagihanModal') closeDeleteTagihanModal();
});

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    loadTagihan();
    loadPelangganDropdown();
  });
} else {
  loadTagihan();
  loadPelangganDropdown();
}
