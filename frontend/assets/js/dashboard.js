/**
 * Dashboard JavaScript
 */

async function loadStatistics() {
  try {
    const pelRes = await axios.get('/pelanggan/statistik');
    const tagRes = await axios.get('/tagihan/statistik');

    if (pelRes.data.success) {
      const stats = pelRes.data.data;
      document.getElementById('totalPelanggan').textContent = stats.total;
      document.getElementById('pelangganAktif').textContent = stats.aktif;
    }

    if (tagRes.data.success) {
      const tStats = tagRes.data.data;
      document.getElementById('tagihanBelum').textContent = tStats.belumLunas || 0;
      document.getElementById('totalPemasukan').textContent = formatRupiah(tStats.totalNilai || 0);
    }
  } catch (error) {
    console.error('Error loading statistics:', error);
    showNotification('Gagal memuat statistik', 'error');
  }
}

async function loadRecentTagihan() {
  try {
    const res = await axios.get('/tagihan');
    
    if (res.data.success) {
      const table = document.getElementById('tagihanTable');
      
      if (!res.data.data || res.data.data.length === 0) {
        table.innerHTML = '<tr><td colspan="5" class="text-center">Tidak ada data</td></tr>';
        return;
      }

      table.innerHTML = res.data.data.slice(0, 5).map(t => `
        <tr>
          <td>${t.nama_pelanggan}</td>
          <td>${formatRupiah(t.jumlah_tagihan)}</td>
          <td>${getStatusBadge(t.status_pembayaran)}</td>
          <td>${formatDateShort(t.bulan_tagihan)}</td>
        </tr>
      `).join('');
    }
  } catch (error) {
    console.error('Error loading tagihan:', error);
  }
}

async function initDashboard() {
  await Promise.all([
    loadStatistics(),
    loadRecentTagihan()
  ]);
  
  setInterval(() => {
    loadStatistics();
    loadRecentTagihan();
  }, 60000); // Refresh setiap 1 menit
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDashboard);
} else {
  initDashboard();
}
