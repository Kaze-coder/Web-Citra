/**
 * Perangkat (Device) JavaScript
 */

async function loadPerangkat() {
  try {
    const res = await axios.get('/perangkat');
    if (res.data.success) {
      const table = document.getElementById('perangkatTable');
      table.innerHTML = res.data.data.map(p => `
        <tr>
          <td>${p.nama_pelanggan}</td>
          <td>${p.nama_perangkat}</td>
          <td>${p.tipe_perangkat}</td>
          <td>${p.ip_address || '-'}</td>
          <td>${getStatusBadge(p.status_perangkat)}</td>
        </tr>
      `).join('');
    }
  } catch (error) {
    console.error('Error loading perangkat:', error);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadPerangkat);
} else {
  loadPerangkat();
}
