/**
 * Modul Jadwal Pengiriman - Citra NET Manager
 */

// Initialize
let dataTableInstance = null;
document.addEventListener('DOMContentLoaded', () => {
  loadSchedules();
  setupEventListeners();
});

// Setup event listener
function setupEventListeners() {
  // Refresh button
  const btnRefresh = document.getElementById('btnRefresh');
  if (btnRefresh) {
    btnRefresh.addEventListener('click', loadSchedules);
  }

  // Filter status
  const filterStatus = document.getElementById('filterStatus');
  if (filterStatus) {
    filterStatus.addEventListener('change', loadSchedules);
  }

  // Send all button
  const btnSendAll = document.getElementById('btnSendAll');
  if (btnSendAll) {
    btnSendAll.addEventListener('click', sendAllMessages);
  }

}

// Ambil data jadwal tagihan
async function loadSchedules() {
  try {
    const response = await axios.get('/billing-schedule', { params: { limit: 10000 } });
    const filter = document.getElementById('filterStatus').value;

    if (response.data.success && response.data.data) {
      let schedules = response.data.data;

      // Apply filter
      if (filter) {
        schedules = schedules.filter(s => s.status === filter);
      }

      const table = document.getElementById('scheduleTable');
      
      if (dataTableInstance) {
        dataTableInstance.destroy();
      }

      if (schedules.length > 0) {
        table.innerHTML = schedules.map(s => `
          <tr data-customer-id="${s.id}" data-phone="${escapeHtml(s.no_telepon)}" data-customer-name="${escapeHtml(s.nama_pelanggan)}" data-message="${encodeURIComponent(s.message_preview)}">
            <td><strong>${escapeHtml(s.nama_pelanggan)}</strong></td>
            <td>${escapeHtml(s.no_telepon)}</td>
            <td><small>${escapeHtml(s.paket_layanan)}</small></td>
            <td>${formatDate(s.tanggal_langganan)}</td>
            <td>${escapeHtml(s.next_billing_formatted)}</td>
            <td>${getStatusBadge(s.status)}</td>
            <td>
              <span class="badge ${s.days_until_billing <= 0 ? 'bg-danger' : s.days_until_billing <= 3 ? 'bg-warning' : 'bg-success'}">
                ${s.days_until_billing <= 0 ? 'OVERDUE' : s.days_until_billing + ' hari'}
              </span>
            <td>
              <button class="btn btn-sm btn-info btn-preview" title="Preview pesan">
                <i class="fas fa-eye"></i>
              </button>
              <button class="btn btn-sm btn-success btn-send" title="Kirim sekarang">
                <i class="fas fa-paper-plane"></i>
              </button>
            </td>
          </tr>
        `).join('');
      } else {
        table.innerHTML = '<tr><td colspan="8" class="text-center">Tidak ada data</td></tr>';
      }
      dataTableInstance = new DataTable('#mainTable', {
        language: { search: "Cari:", lengthMenu: "Tampilkan _MENU_ data", info: "Menampilkan _START_ sampai _END_ dari _TOTAL_ data" },
        columnDefs: [
          { className: "text-start", targets: "_all" }
        ]
      });
    }
  } catch (error) {
    console.error('Error loading schedules:', error);
    showNotification('Gagal memuat jadwal pengiriman', 'error');
  }
}
// Event delegation untuk tombol preview dan send (kompatibel DataTables)
document.addEventListener('click', function(e) {
  const btn = e.target.closest('.btn-preview, .btn-send');
  if (!btn) return;

  const row = btn.closest('tr');
  if (!row || !row.dataset.customerId) return;

  const customerId = row.dataset.customerId;
  const phone = row.dataset.phone;
  const customerName = row.dataset.customerName;
  const encodedMessage = row.dataset.message;

  if (btn.classList.contains('btn-send')) {
    sendDirectMessage(btn, phone, customerName, encodedMessage);
  } else {
    previewMessage(customerId, customerName, phone, encodedMessage);
  }
});

// Kirim langsung tanpa preview
async function sendDirectMessage(btn, phone, customerName, encodedMessage) {
  const message = decodeURIComponent(encodedMessage);
  try {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    const response = await axios.post('/whatsapp/send', {
      phone: phone,
      message: message
    });

    if (response.data.success) {
      showNotification(`✅ Pesan berhasil dikirim ke ${customerName}!`, 'success');

      // Refresh schedules
      setTimeout(() => {
        loadSchedules();
      }, 1000);
    }
  } catch (error) {
    console.error('Error:', error);
    showNotification(error.response?.data?.message || 'Gagal mengirim pesan', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-paper-plane"></i>';
  }
}


// Ambil badge status (khusus halaman jadwal: overdue/soon/normal)
function getStatusBadge(status) {
  const badges = {
    'overdue': '<span class="badge bg-danger">Overdue</span>',
    'soon': '<span class="badge bg-warning">Soon (3H)</span>',
    'normal': '<span class="badge bg-info">Normal</span>'
  };
  return badges[status] || `<span class="badge bg-secondary">${escapeHtml(status)}</span>`;
}

/**
 * Format date
 */
function formatDate(date) {
  return new Date(date).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

// Preview pesan sebelum dikirim
function previewMessage(customerId, customerName, phone, encodedMessage) {
  const message = decodeURIComponent(encodedMessage);
  document.getElementById('previewCustomer').textContent = customerName;
  document.getElementById('previewPhone').textContent = phone;
  document.getElementById('previewMessage').textContent = message;

  // Store customer ID for sending
  document.getElementById('btnSendNow').dataset.customerId = customerId;
  document.getElementById('btnSendNow').dataset.phone = phone;
  document.getElementById('btnSendNow').dataset.message = message;

  const modal = new bootstrap.Modal(document.getElementById('modalPreviewMessage'));
  modal.show();
}

// Kirim pesan dari modal
document.addEventListener('DOMContentLoaded', () => {
  const btnSendNow = document.getElementById('btnSendNow');
  if (btnSendNow) {
    btnSendNow.addEventListener('click', async () => {
      try {
        const phone = btnSendNow.dataset.phone;
        const customerId = btnSendNow.dataset.customerId;

        // Get the message from modal
        const message = document.getElementById('previewMessage').textContent;

        btnSendNow.disabled = true;
        btnSendNow.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim...';

        const response = await axios.post('/whatsapp/send', {
          phone: phone,
          message: message
        });

        if (response.data.success) {
          showNotification('✅ Pesan berhasil dikirim!', 'success');
          
          // Close modal
          const modal = bootstrap.Modal.getInstance(document.getElementById('modalPreviewMessage'));
          modal.hide();

          // Refresh schedules
          setTimeout(() => {
            loadSchedules();
          }, 1000);
        }
      } catch (error) {
        console.error('Error:', error);
        showNotification(error.response?.data?.message || 'Gagal mengirim pesan', 'error');
      } finally {
        const btnSendNow = document.getElementById('btnSendNow');
        btnSendNow.disabled = false;
        btnSendNow.innerHTML = '<i class="fas fa-paper-plane"></i> Kirim Sekarang';
      }
    });
  }
});

// Kirim ke semua pelanggan
async function sendAllMessages() {
  if (!confirm('Kirim pesan ke semua pelanggan yang jadwalnya sudah jatuh tempo?')) {
    return;
  }

  try {
    const btn = document.getElementById('btnSendAll');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim...';

    // Get all schedules
    const response = await axios.get('/billing-schedule');
    const schedules = response.data.data.filter(s => s.status === 'overdue' || s.status === 'soon');

    let sent = 0;
    let failed = 0;

    for (const schedule of schedules) {
      try {
        await axios.post('/whatsapp/send', {
          phone: schedule.no_telepon,
          message: schedule.message_preview
        });
        sent++;
      } catch (error) {
        console.error(`Failed to send to ${schedule.nama_pelanggan}:`, error);
        failed++;
      }
    }

    showNotification(`✅ ${sent} pesan terkirim${failed > 0 ? `, ${failed} gagal` : ''}`, 'success');
    
    // Refresh
    setTimeout(() => {
      loadSchedules();
    }, 1000);
  } catch (error) {
    console.error('Error:', error);
    showNotification('Gagal mengirim pesan ke semua pelanggan', 'error');
  } finally {
    const btn = document.getElementById('btnSendAll');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-paper-plane"></i> Kirim Semua Sekarang';
  }
}

// (showNotification menggunakan definisi dari main.js)
