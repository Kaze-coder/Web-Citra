/**
 * Modul Dashboard - Citra NET Manager
 */

let chartPembayaran, chartPaket, chartRevenue;

// Store previous percentages untuk comparison
let previousPercentages = {
  totalPelanggan: 0,
  pelangganAktif: 0,
  tagihanBelum: 0,
  pemasukan: 0
};

function updateTrendColor(elementId, currentValue, previousValue) {
  const trendElement = document.getElementById(`trend-${elementId}`);
  const iconElement = document.getElementById(`icon-${elementId}`);
  let trendClass = 'trend-neutral';
  let iconClass = 'fas fa-water'; // Wavy icon untuk neutral
  
  if (currentValue > previousValue) {
    trendClass = 'trend-up';
    iconClass = 'fas fa-arrow-up';
  } else if (currentValue < previousValue) {
    trendClass = 'trend-down';
    iconClass = 'fas fa-arrow-down';
  }
  
  // Remove all trend classes
  trendElement.classList.remove('trend-up', 'trend-down', 'trend-neutral');
  trendElement.classList.add(trendClass);
  
  // Update icon
  iconElement.className = iconClass;
}

async function loadStatistics() {
  try {
    const pelRes = await axios.get('/pelanggan/statistik');
    const tagRes = await axios.get('/tagihan/statistik');

    let pelStats = {};
    let tagStats = {};

    if (pelRes.data.success) {
      pelStats = pelRes.data.data;
      document.getElementById('totalPelanggan').textContent = pelStats.total || 0;
      document.getElementById('pelangganAktif').textContent = pelStats.aktif || 0;
      
      // Calculate percentage: aktif dari total
      const pctAktif = pelStats.total > 0 ? Math.round((pelStats.aktif / pelStats.total) * 100) : 0;
      document.getElementById('pct-pelanggan-aktif').textContent = pctAktif + '%';
      document.getElementById('pct-total-pelanggan').textContent = pctAktif + '%';
      
      // Update trend color untuk pelanggan aktif
      updateTrendColor('pelanggan-aktif', pctAktif, previousPercentages.pelangganAktif);
      updateTrendColor('total-pelanggan', pctAktif, previousPercentages.totalPelanggan);
      
      // Store untuk comparison berikutnya
      previousPercentages.pelangganAktif = pctAktif;
      previousPercentages.totalPelanggan = pctAktif;
    }

    if (tagRes.data.success) {
      tagStats = tagRes.data.data;
      document.getElementById('tagihanBelum').textContent = tagStats.belum_lunas || 0;
      // Backend statistik mengembalikan field totalPemasukan
      document.getElementById('totalPemasukan').textContent = formatRupiah(pelStats.totalPemasukan || 0);
      
      // Calculate percentage: belum lunas dari total tagihan
      const totalTag = (tagStats.lunas || 0) + (tagStats.belum_lunas || 0) + (tagStats.cicilan || 0);
      const pctBelumLunas = totalTag > 0 ? Math.round(((tagStats.belum_lunas || 0) / totalTag) * 100) : 0;
      document.getElementById('pct-tagihan-belum').textContent = pctBelumLunas + '%';
      
      // Update trend color untuk tagihan belum lunas
      updateTrendColor('tagihan-belum', pctBelumLunas, previousPercentages.tagihanBelum);
      
      // Calculate pemasukan percentage: lunas dari total tagihan
      const pctLunas = totalTag > 0 ? Math.round(((tagStats.lunas || 0) / totalTag) * 100) : 0;
      document.getElementById('pct-pemasukan').textContent = pctLunas + '%';
      
      // Update trend color untuk pemasukan (semakin tinggi semakin baik)
      updateTrendColor('pemasukan', pctLunas, previousPercentages.pemasukan);
      
      // Store untuk comparison berikutnya
      previousPercentages.tagihanBelum = pctBelumLunas;
      previousPercentages.pemasukan = pctLunas;
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
          <td>${escapeHtml(t.nama_pelanggan)}</td>
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

async function loadCharts() {
  try {
    const tagRes = await axios.get('/tagihan');
    const pelRes = await axios.get('/pelanggan');

    if (tagRes.data.success && pelRes.data.success) {
      const tagihanData = tagRes.data.data;
      const pelangganData = pelRes.data.data;

      // Chart 1: Status Pembayaran (Donut)
      let countLunas = 0;
      let countBelumLunas = 0;
      let countCicilan = 0;

      tagihanData.forEach(t => {
        if (t.status_pembayaran === 'belum_lunas') countBelumLunas++;
        else if (t.status_pembayaran === 'cicilan') countCicilan++;
        else countLunas++;
      });

      const labels = [];
      const data = [];
      const bgColors = [];

      // Tampilkan status pembayaran
      if (countLunas > 0) { labels.push('Lunas'); data.push(countLunas); bgColors.push('#346538'); }
      if (countBelumLunas > 0) { labels.push('Belum Lunas'); data.push(countBelumLunas); bgColors.push('#9F2F2D'); }
      if (countCicilan > 0) { labels.push('Cicilan'); data.push(countCicilan); bgColors.push('#956400'); }

      // Jika tidak ada data
      if (data.length === 0) {
        labels.push('Belum Ada Data');
        data.push(1);
        bgColors.push('#EAEAEA');
      }

      const ctxPembayaran = document.getElementById('chartPembayaran');
      if (chartPembayaran) chartPembayaran.destroy();
      chartPembayaran = new Chart(ctxPembayaran, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: ['#346538', '#9F2F2D', '#956400', '#1F6C9F', '#787774'],
            borderColor: '#ffffff',
            borderWidth: 4,
            hoverOffset: 10
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '75%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: { 
                font: { family: "'Geist Sans', -apple-system, sans-serif", size: 12, weight: '500' }, 
                padding: 20,
                usePointStyle: true,
                pointStyle: 'circle'
              }
            },
            tooltip: {
              backgroundColor: '#111111',
              padding: 12,
              titleFont: { size: 14, weight: 'bold' },
              bodyFont: { size: 13 },
              cornerRadius: 8,
              displayColors: true
            }
          }
        }
      });

      // Chart 2: Paket Layanan (Bar)
      const paketCounts = {};
      pelangganData.forEach(p => {
        const paket = p.paket_layanan || 'Unknown';
        paketCounts[paket] = (paketCounts[paket] || 0) + 1;
      });

      const ctxPaket = document.getElementById('chartPaket');

      if (chartPaket) chartPaket.destroy();
      chartPaket = new Chart(ctxPaket, {
        type: 'bar',
        data: {
          labels: Object.keys(paketCounts),
          datasets: [{
            label: 'Jumlah Pelanggan',
            data: Object.values(paketCounts),
            backgroundColor: '#2F3437',
            borderColor: '#2F3437',
            borderWidth: 1,
            borderRadius: 4,
            barThickness: 20
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#111111',
              cornerRadius: 8
            }
          },
          scales: {
            x: { 
              beginAtZero: true,
              grid: { display: false },
              ticks: { font: { family: "'Geist Sans', -apple-system, sans-serif" } }
            },
            y: {
              grid: { display: false },
              ticks: { font: { family: "'Geist Sans', -apple-system, sans-serif", weight: '500' } }
            }
          }
        }
      });

      // Chart 3: Tren Tagihan (Line)
      const bulanCounts = {};
      tagihanData.forEach(t => {
        const bulan = formatDateShort(t.bulan_tagihan);
        bulanCounts[bulan] = (bulanCounts[bulan] || 0) + 1;
      });

      const ctxRevenue = document.getElementById('chartRevenue');
      const gradientLine = ctxRevenue.getContext('2d').createLinearGradient(0, 0, 0, 300);
      gradientLine.addColorStop(0, 'rgba(17, 17, 17, 0.05)');
      gradientLine.addColorStop(1, 'rgba(17, 17, 17, 0)');

      if (chartRevenue) chartRevenue.destroy();
      chartRevenue = new Chart(ctxRevenue, {
        type: 'line',
        data: {
          labels: Object.keys(bulanCounts).slice(-12),
          datasets: [{
            label: 'Jumlah Tagihan',
            data: Object.values(bulanCounts).slice(-12),
            borderColor: '#111111',
            backgroundColor: gradientLine,
            tension: 0.4,
            fill: true,
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: '#111111',
            pointHoverBorderColor: 'white',
            pointHoverBorderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            intersect: false,
            mode: 'index'
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#111111',
              padding: 12,
              cornerRadius: 8
            }
          },
          scales: {
            y: { 
              beginAtZero: true,
              grid: { color: '#EAEAEA' },
              ticks: { font: { family: "'Geist Sans', -apple-system, sans-serif" } }
            },
            x: {
              grid: { display: false },
              ticks: { font: { family: "'Geist Sans', -apple-system, sans-serif" } }
            }
          }
        }
      });
    }
  } catch (error) {
    console.error('Error loading charts:', error);
  }
}

async function initDashboard() {
  await Promise.all([
    loadStatistics(),
    loadRecentTagihan(),
    loadCharts()
  ]);
  
  setInterval(() => {
    loadStatistics();
    loadRecentTagihan();
    loadCharts();
  }, 60000); // Refresh setiap 1 menit
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDashboard);
} else {
  initDashboard();
}
