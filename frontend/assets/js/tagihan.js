/**
 * Modul Tagihan - Citra NET Manager
 */

// Initialize
let dataTableInstance = null;
document.addEventListener('DOMContentLoaded', () => {
  loadSchedulerStatus();
  loadTagihan();
  setupEventListeners();
});

// Ambil status scheduler
async function loadSchedulerStatus() {
  try {
    const response = await axios.get('/billing/scheduler/status');
    
    if (response.data.success) {
      const status = response.data.data;
      const statusDiv = document.getElementById('schedulerStatus');
      
      if (statusDiv) {
        const statusText = status.isRunning 
          ? `✅ Scheduler Aktif | Berjalan setiap hari jam 00:00`
          : '❌ Scheduler Tidak Aktif';
        
        statusDiv.className = status.isRunning ? 'alert alert-success' : 'alert alert-warning';
        statusDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${statusText}`;
      }
    }
  } catch (error) {
    console.error('Error loading scheduler status:', error);
    const statusDiv = document.getElementById('schedulerStatus');
    if (statusDiv) {
      statusDiv.className = 'alert alert-danger';
      statusDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> Error loading status`;
    }
  }
}

// Jalankan pengecekan billing manual
async function triggerBillingCheck() {
  try {
    const btn = document.getElementById('checkBillingBtn');
    if (!btn) return;
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking...';
    
    const response = await axios.post('/billing/scheduler/check-now');
    
    if (response.data.success) {
      showNotification('Billing check sedang dijalankan di background', 'success');
      
      // Reload tagihan setelah beberapa detik
      setTimeout(() => {
        loadTagihan();
        loadSchedulerStatus();
      }, 2000);
    }
  } catch (error) {
    console.error('Error triggering billing check:', error);
    showNotification('Gagal menjalankan billing check', 'error');
  } finally {
    const btn = document.getElementById('checkBillingBtn');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-play"></i> Check Billing Sekarang';
    }
  }
}

// Terapkan filter status & bulan pada data tagihan
function applyTagihanFilters(data) {
  const filterStatus = document.getElementById('filterStatus')?.value;
  if (filterStatus) {
    data = data.filter(t => t.status_pembayaran === filterStatus);
  }

  // input type="month" menghasilkan "YYYY-MM"; bulan_tagihan disimpan "YYYY-MM-01"
  const filterBulan = document.getElementById('filterBulan')?.value;
  if (filterBulan) {
    data = data.filter(t => (t.bulan_tagihan || '').startsWith(filterBulan));
  }

  return data;
}

// Ambil data tagihan
async function loadTagihan() {
  try {
    const res = await axios.get('/tagihan?page=1&limit=10000');
    const table = document.getElementById('tagihanTable');
    
    if (!table) return;
    
    if (dataTableInstance) {
      dataTableInstance.destroy();
    }
    
    let data = (res.data.success && res.data.data) ? res.data.data : [];
    data = applyTagihanFilters(data);

    if (data.length > 0) {
      // Sort by bulan_tagihan (due date) - ascending order (earliest first)
      const sortedData = data.sort((a, b) => {
        return new Date(a.bulan_tagihan) - new Date(b.bulan_tagihan);
      });

      table.innerHTML = sortedData.map(t => `
        <tr>
          <td><strong>${escapeHtml(t.nama_pelanggan)}</strong></td>
          <td>${escapeHtml(t.no_telepon)}</td>
          <td>${formatRupiah(t.jumlah_tagihan)}</td>
          <td>${getStatusBadge(t.status_pembayaran)}</td>
          <td>${formatDateShort(t.bulan_tagihan)}</td>
          <td>
            <button class="btn btn-sm btn-primary" onclick="editTagihan('${t.id}')" aria-label="Edit tagihan ${escapeHtml(t.nama_pelanggan)}">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-danger" onclick="deleteTagihan('${t.id}')" aria-label="Hapus tagihan ${escapeHtml(t.nama_pelanggan)}">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>
      `).join('');
    } else {
      const filterActive = Boolean(document.getElementById('filterStatus')?.value || document.getElementById('filterBulan')?.value);
      const emptyMsg = filterActive
        ? 'Tidak ada data yang cocok dengan filter.'
        : 'Belum ada tagihan. Klik tombol "Buat Tagihan Baru" untuk menambahkan.';
      table.innerHTML = `
        <tr><td colspan="6" class="text-center py-5">
          <div class="empty-state">
            <i class="fas fa-inbox fa-2x mb-2" style="color:var(--text-secondary)"></i>
            <p class="mb-1" style="color:var(--text-secondary)">${emptyMsg}</p>
          </div>
        </td></tr>`;
    }
    dataTableInstance = new DataTable('#mainTable', {
      language: { search: "Cari:", lengthMenu: "Tampilkan _MENU_ data", info: "Menampilkan _START_ sampai _END_ dari _TOTAL_ data" },
      columnDefs: [
        { className: "text-start", targets: "_all" }
      ]
    });
  } catch (error) {
    console.error('Error loading tagihan:', error);
    const table = document.getElementById('tagihanTable');
    if (table) {
      table.innerHTML = '<tr><td colspan="6" class="text-center text-danger"><span role="alert">Error loading data</span></td></tr>';
    }
  }
}

// Export CSV dari data tagihan yang sedang terfilter
async function exportTagihanCSV() {
  try {
    const res = await axios.get('/tagihan?page=1&limit=10000');
    let data = (res.data.success && res.data.data) ? res.data.data : [];
    data = applyTagihanFilters(data);

    if (!data.length) {
      showNotification('Tidak ada data untuk diekspor', 'warning');
      return;
    }

    const headers = ['Pelanggan', 'No. HP', 'Jumlah', 'Status', 'Bulan'];
    const rows = data.map(t => [
      t.nama_pelanggan,
      t.no_telepon,
      t.jumlah_tagihan,
      t.status_pembayaran,
      formatDateShort(t.bulan_tagihan)
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.map(cell => {
        cell = String(cell ?? '');
        if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', `tagihan_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification('Data tagihan berhasil diunduh', 'success');
  } catch (error) {
    console.error('Error exporting tagihan:', error);
    showNotification('Gagal mengekspor data', 'error');
  }
}

// Setup event listener
function setupEventListeners() {
  // Check billing button
  const checkBtn = document.getElementById('checkBillingBtn');
  if (checkBtn) {
    checkBtn.addEventListener('click', triggerBillingCheck);
  }

  // Status filter
  const filterStatus = document.getElementById('filterStatus');
  if (filterStatus) {
    filterStatus.addEventListener('change', () => {
      loadTagihan();
    });
  }

  // Bulan filter
  const filterBulan = document.getElementById('filterBulan');
  if (filterBulan) {
    filterBulan.addEventListener('change', () => {
      loadTagihan();
    });
  }

  // Export CSV
  const btnExportCSV = document.getElementById('btnExportCSV');
  if (btnExportCSV) {
    btnExportCSV.addEventListener('click', exportTagihanCSV);
  }


  // Buat Tagihan Baru
  const btnSimpan = document.getElementById('btnSimpanTagihan');
  if (btnSimpan) {
    btnSimpan.addEventListener('click', simpanTagihanBaru);
  }

  // Edit Tagihan
  const btnSimpanEdit = document.getElementById('btnSimpanEditTagihan');
  if (btnSimpanEdit) {
    btnSimpanEdit.addEventListener('click', simpanEditTagihan);
  }

  // Test WhatsApp
  const btnKirimTest = document.getElementById('btnKirimTest');
  if (btnKirimTest) {
    btnKirimTest.addEventListener('click', kirimTestWhatsApp);
  }

  // Load pelanggan untuk dropdown
  loadPelangganOptions();
}

// Edit data tagihan
async function editTagihan(id) {
  try {
    // Get tagihan data
    const response = await axios.get(`/tagihan/${id}`);
    
    if (response.data.success) {
      const tagihan = response.data.data;
      
      // Fill form
      document.getElementById('editTagihanId').value = tagihan.id;
      document.getElementById('editPelangganNama').value = tagihan.nama_pelanggan || (tagihan.pelanggan_id && tagihan.pelanggan_id.nama_pelanggan) || '-';
      
      // Format bulan_tagihan as YYYY-MM for month input
      const bulanDate = new Date(tagihan.bulan_tagihan);
      const yearMonth = bulanDate.toISOString().substring(0, 7);
      document.getElementById('editBulanTagihan').value = yearMonth;
      
      document.getElementById('editJumlahTagihan').value = tagihan.jumlah_tagihan;
      document.getElementById('editStatusTagihan').value = tagihan.status_pembayaran;
      document.getElementById('editCatatan').value = tagihan.catatan || '';
      
      // Show modal
      const modal = new bootstrap.Modal(document.getElementById('modalEditTagihan'));
      modal.show();
    }
  } catch (error) {
    console.error('Error loading tagihan:', error);
    showNotification('Gagal memuat data tagihan', 'error');
  }
}

// Hapus data tagihan
async function deleteTagihan(id) {
  // Ask for confirmation
  if (!confirm('Apakah Anda yakin ingin menghapus tagihan ini?')) {
    return;
  }
  
  try {
    const response = await axios.delete(`/tagihan/${id}`);
    
    if (response.data.success) {
      showNotification('Tagihan berhasil dihapus', 'success');
      loadTagihan();
    }
  } catch (error) {
    console.error('Error deleting tagihan:', error);
    showNotification(error.response?.data?.message || 'Gagal menghapus tagihan', 'error');
  }
}

/**
 * Show notification
 */
// (menggunakan showNotification dari main.js)

// Load opsi pelanggan untuk dropdown
async function loadPelangganOptions() {
  try {
    const response = await axios.get('/pelanggan?limit=100');
    if (response.data.success && response.data.data) {
      const select = document.getElementById('selectPelanggan');
      if (select) {
        const options = response.data.data.map(p => 
          `<option value="${p.id}">${escapeHtml(p.nama_pelanggan)} (${escapeHtml(p.no_telepon)})</option>`
        ).join('');
        select.innerHTML = '<option value="">-- Pilih Pelanggan --</option>' + options;
      }
    }
  } catch (error) {
    console.error('Error loading pelanggan:', error);
  }
}

/**
 * Simpan Tagihan Baru
 */
async function simpanTagihanBaru() {
  try {
    const pelangganId = document.getElementById('selectPelanggan').value;
    const bulanTagihan = document.getElementById('inputBulanTagihan').value;
    const jumlahTagihan = document.getElementById('inputJumlahTagihan').value;
    const status = document.getElementById('selectStatusTagihan').value;
    const catatan = document.getElementById('inputCatatan').value;
    const kirimWhatsApp = document.getElementById('checkKirimWhatsApp').checked;

    if (!pelangganId || !bulanTagihan || !jumlahTagihan) {
      showNotification('Semua field wajib diisi', 'warning');
      return;
    }

    const btn = document.getElementById('btnSimpanTagihan');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';

    // Buat tagihan
    const response = await axios.post('/tagihan', {
      pelanggan_id: pelangganId,
      bulan_tagihan: bulanTagihan + '-01',
      jumlah_tagihan: parseInt(jumlahTagihan),
      status_pembayaran: status,
      catatan: catatan
    });

    if (response.data.success) {
      showNotification('Tagihan berhasil dibuat', 'success');

      // Kirim WhatsApp jika dipilih
      if (kirimWhatsApp) {
        setTimeout(() => {
          kirimNotasiWhatsAppTagihan(pelangganId, response.data.data);
        }, 500);
      }

      // Close modal
      const modal = document.getElementById('modalBuatTagihan');
      if (modal) {
        const bootstrapModal = bootstrap.Modal.getInstance(modal);
        if (bootstrapModal) bootstrapModal.hide();
      }

      // Reset form
      document.getElementById('formBuatTagihan').reset();

      // Reload tagihan
      setTimeout(() => {
        loadTagihan();
      }, 1000);
    }
  } catch (error) {
    console.error('Error:', error);
    showNotification(error.response?.data?.message || 'Gagal membuat tagihan', 'error');
  } finally {
    const btn = document.getElementById('btnSimpanTagihan');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-save"></i> Simpan Tagihan';
  }
}

/**
 * Simpan Edit Tagihan
 */
async function simpanEditTagihan() {
  try {
    const tagihanId = document.getElementById('editTagihanId').value;
    const bulanTagihan = document.getElementById('editBulanTagihan').value;
    const jumlahTagihan = document.getElementById('editJumlahTagihan').value;
    const status = document.getElementById('editStatusTagihan').value;
    const catatan = document.getElementById('editCatatan').value;

    if (!tagihanId || !bulanTagihan || !jumlahTagihan) {
      showNotification('Semua field wajib diisi', 'warning');
      return;
    }

    const btn = document.getElementById('btnSimpanEditTagihan');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';

    // Update tagihan
    const response = await axios.put(`/tagihan/${tagihanId}`, {
      bulan_tagihan: bulanTagihan + '-01',
      jumlah_tagihan: parseInt(jumlahTagihan),
      status_pembayaran: status,
      catatan: catatan
    });

    if (response.data.success) {
      showNotification('Tagihan berhasil diperbarui', 'success');

      // Close modal
      const modal = document.getElementById('modalEditTagihan');
      if (modal) {
        const bootstrapModal = bootstrap.Modal.getInstance(modal);
        if (bootstrapModal) bootstrapModal.hide();
      }

      // Reload tagihan
      setTimeout(() => {
        loadTagihan();
      }, 1000);
    }
  } catch (error) {
    console.error('Error:', error);
    showNotification(error.response?.data?.message || 'Gagal memperbarui tagihan', 'error');
  } finally {
    const btn = document.getElementById('btnSimpanEditTagihan');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-save"></i> Simpan Perubahan';
  }
}

// Kirim notifikasi WhatsApp ke pelanggan
async function kirimNotasiWhatsAppTagihan(pelangganId, tagihanData) {
  try {
    // Get pelanggan data
    const pelResponse = await axios.get(`/pelanggan/${pelangganId}`);
    const pelanggan = pelResponse.data.data;

    const bulanTagihan = new Date(tagihanData.bulan_tagihan);
    const bulanNama = bulanTagihan.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

    const message = `🔔 *Notifikasi Tagihan WiFi* 🔔

Halo ${pelanggan.nama_pelanggan}! 👋

Berikut ringkasan tagihan WiFi Anda:

📦 *Paket*: ${pelanggan.paket_layanan}
💰 *Jumlah Tagihan*: Rp${new Intl.NumberFormat('id-ID').format(tagihanData.jumlah_tagihan)}
📅 *Periode*: ${bulanNama}
⏰ *Status*: Belum Dibayar

Mohon segera lakukan pembayaran untuk menjaga kelancaran layanan Anda.

Terima kasih! 🙏`;

    await axios.post('/whatsapp/send', {
      phone: pelanggan.no_telepon,
      message: message
    });

    showNotification('WhatsApp notifikasi terkirim ke pelanggan', 'success');
  } catch (error) {
    console.error('Error kirim WhatsApp:', error);
    showNotification('Tagihan dibuat tapi WhatsApp gagal terkirim', 'warning');
  }
}

/**
 * Kirim Test WhatsApp
 */
async function kirimTestWhatsApp() {
  try {
    const nomorTest = document.getElementById('inputNomorTest').value;
    const pesanTest = document.getElementById('inputPesanTest').value;

    if (!nomorTest || !pesanTest) {
      showNotification('Nomor dan pesan harus diisi', 'warning');
      return;
    }

    const btn = document.getElementById('btnKirimTest');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim...';

    const response = await axios.post('/whatsapp/send', {
      phone: nomorTest,
      message: pesanTest
    });

    if (response.data.success) {
      showNotification('✅ Pesan test terkirim! Cek WhatsApp Anda', 'success');
      
      // Close modal setelah 2 detik
      setTimeout(() => {
        const modal = document.getElementById('modalTestWhatsApp');
        if (modal) {
          const bootstrapModal = bootstrap.Modal.getInstance(modal);
          if (bootstrapModal) bootstrapModal.hide();
        }
      }, 2000);
    } else {
      showNotification('❌ Gagal mengirim: ' + response.data.error, 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showNotification(error.response?.data?.message || 'Gagal mengirim pesan', 'error');
  } finally {
    const btn = document.getElementById('btnKirimTest');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-paper-plane"></i> Kirim Test';
  }
}
