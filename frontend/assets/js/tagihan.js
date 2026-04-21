/**
 * Tagihan (Invoice) JavaScript
 */

async function loadTagihan() {
  try {
    const res = await axios.get('/tagihan');
    if (res.data.success) {
      const table = document.getElementById('tagihanTable').querySelector('tbody');
      table.innerHTML = res.data.data.map(t => `
        <tr>
          <td>${t.nama_pelanggan}</td>
          <td>${t.no_telepon}</td>
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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadTagihan);
} else {
  loadTagihan();
}
