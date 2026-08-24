/**
 * Perangkat (Device) JavaScript
 */

let editingPerangkatId = null;
let deletingPerangkatId = null;
let dataTableInstance = null;

async function loadPelangganList() {
  try {
    const res = await axios.get('/pelanggan', { params: { limit: 1000 } });
    if (res.data.success) {
      const select = document.getElementById('pelanggan_id');
      select.innerHTML = '<option value="">-- Pilih Pelanggan --</option>' + 
        res.data.data.map(p => `<option value="${p.id}">${escapeHtml(p.nama_pelanggan)}</option>`).join('');
    }
  } catch (error) {
    console.error('Error loading pelanggan:', error);
  }
}

async function loadPerangkat() {
  try {
    const res = await axios.get('/perangkat', { params: { limit: 10000 } });
    if (res.data.success) {
      const table = document.getElementById('perangkatTable');
      
      if (dataTableInstance) {
        dataTableInstance.destroy();
      }
      
      if (!res.data.data || res.data.data.length === 0) {
        table.innerHTML = `
          <tr><td colspan="7" class="text-center py-5">
            <div class="empty-state">
              <i class="fas fa-inbox fa-2x mb-2" style="color:var(--text-secondary)"></i>
              <p class="mb-1" style="color:var(--text-secondary)">Belum ada perangkat</p>
              <small style="color:var(--text-secondary)">Klik tombol "Tambah Perangkat" untuk menambahkan data baru.</small>
            </div>
          </td></tr>`;
      } else {
        table.innerHTML = res.data.data.map(p => `
        <tr>
          <td>${p.nama_pelanggan ? escapeHtml(p.nama_pelanggan) : '-'}</td>
          <td>${escapeHtml(p.nama_perangkat)}</td>
          <td>${escapeHtml(p.tipe_perangkat)}</td>
          <td>${escapeHtml(p.ip_address || '-')}</td>
          <td>${escapeHtml(p.mac_address || '-')}</td>
          <td>${getStatusBadge(p.status_perangkat)}</td>
          <td>
            <button class="btn btn-primary btn-sm" onclick="editPerangkat('${p.id}')" aria-label="Edit perangkat ${escapeHtml(p.nama_perangkat)}"><i class="fas fa-edit"></i> Edit</button>
            <button class="btn btn-danger btn-sm" onclick="openDeletePerangkatModal('${p.id}', '${escapeHtml(p.nama_perangkat)}')" aria-label="Hapus perangkat ${escapeHtml(p.nama_perangkat)}"><i class="fas fa-trash"></i> Hapus</button>
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
    console.error('Error loading perangkat:', error);
    showNotification('Gagal memuat data perangkat', 'error');
  }
}

function openPerangkatModal(id = null) {
  const form = document.getElementById('perangkatForm');
  const title = document.getElementById('perangkatModalTitle');
  
  if (id) {
    // Edit mode
    editingPerangkatId = id;
    title.textContent = 'Edit Perangkat';
    loadPerangkatData(id);
  } else {
    // Tambah mode
    editingPerangkatId = null;
    title.textContent = 'Tambah Perangkat';
    form.reset();
  }
  
  document.getElementById('perangkatModal').style.display = 'flex';
}

function closePerangkatModal() {
  document.getElementById('perangkatModal').style.display = 'none';
  editingPerangkatId = null;
  document.getElementById('perangkatForm').reset();
}

async function loadPerangkatData(id) {
  try {
    const res = await axios.get(`/perangkat/${id}`);
    if (res.data.success) {
      const p = res.data.data;
      document.getElementById('pelanggan_id').value = p.pelanggan_id;
      document.getElementById('nama_perangkat').value = p.nama_perangkat;
      document.getElementById('tipe_perangkat').value = p.tipe_perangkat;
      document.getElementById('ip_address').value = p.ip_address || '';
      document.getElementById('mac_address').value = p.mac_address || '';
      document.getElementById('serial_number').value = p.serial_number || '';
      document.getElementById('tanggal_instalasi').value = p.tanggal_instalasi || '';
      document.getElementById('status_perangkat').value = p.status_perangkat || 'aktif';
    }
  } catch (error) {
    showNotification('Gagal memuat data perangkat', 'error');
  }
}

async function savePerangkat() {
  try {
    const data = {
      pelanggan_id: document.getElementById('pelanggan_id').value,
      nama_perangkat: document.getElementById('nama_perangkat').value,
      tipe_perangkat: document.getElementById('tipe_perangkat').value,
      ip_address: document.getElementById('ip_address').value || null,
      mac_address: document.getElementById('mac_address').value || null,
      serial_number: document.getElementById('serial_number').value || null,
      tanggal_instalasi: document.getElementById('tanggal_instalasi').value || null,
      status_perangkat: document.getElementById('status_perangkat').value
    };

    if (!data.pelanggan_id || !data.nama_perangkat || !data.tipe_perangkat) {
      showNotification('Pelanggan, nama perangkat, dan tipe harus diisi', 'error');
      return;
    }

let res;
    if (editingPerangkatId) {
      // Update
      res = await axios.put(`/perangkat/${editingPerangkatId}`, data);
      showNotification('✓ Perangkat berhasil diperbarui', 'success');
    } else {
      // Create
      res = await axios.post('/perangkat', data);
      showNotification('✓ Perangkat berhasil ditambahkan', 'success');
    }

    closePerangkatModal();
    loadPerangkat();
  } catch (error) {
    console.error('Save error:', error);
    showNotification(error.response?.data?.message || 'Gagal menyimpan perangkat', 'error');
  }
}

function editPerangkat(id) {
  openPerangkatModal(id);
}

function openDeletePerangkatModal(id, name) {
  deletingPerangkatId = id;
  document.getElementById('deletePerangkatName').textContent = name;
  document.getElementById('deletePerangkatModal').style.display = 'flex';
}

function closeDeletePerangkatModal() {
  document.getElementById('deletePerangkatModal').style.display = 'none';
  deletingPerangkatId = null;
}

async function confirmDeletePerangkat() {
  try {
    const perangkatName = document.getElementById('deletePerangkatName').textContent;
    await axios.delete(`/perangkat/${deletingPerangkatId}`);
    showNotification(`✓ Perangkat "${perangkatName}" telah dihapus`, 'success');
    closeDeletePerangkatModal();
    loadPerangkat();
  } catch (error) {
    showNotification('Gagal menghapus perangkat', 'error');
  }
}

// Close modals on ESC key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closePerangkatModal();
    closeDeletePerangkatModal();
  }
});

// Close modals on background click
document.getElementById('perangkatModal')?.addEventListener('click', (e) => {
  if (e.target.id === 'perangkatModal') closePerangkatModal();
});

document.getElementById('deletePerangkatModal')?.addEventListener('click', (e) => {
  if (e.target.id === 'deletePerangkatModal') closeDeletePerangkatModal();
});

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    loadPelangganList();
    loadPerangkat();
  });
} else {
  loadPelangganList();
  loadPerangkat();
}
