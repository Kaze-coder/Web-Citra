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

      // Tooltip putih bergaya shadcn — dipakai semua chart
      const shadcnTooltip = {
        backgroundColor: '#FFFFFF',
        titleColor: '#16233A',
        bodyColor: '#5B6B7B',
        borderColor: '#D8DEE6',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        titleFont: { family: "'IBM Plex Sans', sans-serif", size: 13, weight: '600' },
        bodyFont: { family: "'IBM Plex Mono', monospace", size: 12 },
        displayColors: true,
        boxWidth: 8,
        boxHeight: 8,
        boxPadding: 4,
        usePointStyle: true
      };

      // Total tagihan di tengah donut (font mono)
      const centerTextPlugin = {
        id: 'centerText',
        afterDraw(chart) {
          if (chart.canvas.id !== 'chartPembayaran') return;
          const { ctx, chartArea } = chart;
          if (!chartArea) return;
          if (chart.data.labels[0] === 'Belum Ada Data') return;
          const total = chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
          const x = (chartArea.left + chartArea.right) / 2;
          const y = (chartArea.top + chartArea.bottom) / 2;
          ctx.save();
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = "500 22px 'IBM Plex Mono', monospace";
          ctx.fillStyle = '#0F1B2D';
          ctx.fillText(total, x, y - 8);
          ctx.font = "500 10px 'IBM Plex Sans', sans-serif";
          ctx.fillStyle = '#5B6B7B';
          ctx.fillText('TOTAL', x, y + 12);
          ctx.restore();
        }
      };

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
      if (countLunas > 0) { labels.push('Lunas'); data.push(countLunas); bgColors.push('#0E7490'); }
      if (countBelumLunas > 0) { labels.push('Belum Lunas'); data.push(countBelumLunas); bgColors.push('#B42318'); }
      if (countCicilan > 0) { labels.push('Cicilan'); data.push(countCicilan); bgColors.push('#93610B'); }

      // Jika tidak ada data
      if (data.length === 0) {
        labels.push('Belum Ada Data');
        data.push(1);
        bgColors.push('#D8DEE6');
      }

      const ctxPembayaran = document.getElementById('chartPembayaran');
      if (chartPembayaran) chartPembayaran.destroy();
      chartPembayaran = new Chart(ctxPembayaran, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: bgColors,
            borderWidth: 0,
            borderRadius: 4,
            spacing: 2,
            hoverOffset: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '80%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: { 
                font: { family: "'IBM Plex Sans', sans-serif", size: 12, weight: '500' }, 
                padding: 16,
                usePointStyle: true,
                pointStyle: 'circle',
                pointStyleWidth: 8
              }
            },
            tooltip: shadcnTooltip
          }
        },
        plugins: [centerTextPlugin]
      });

      // Populate companion stat tiles
      const elLunas = document.getElementById('chartStatLunas');
      const elBelum = document.getElementById('chartStatBelum');
      const elCicilan = document.getElementById('chartStatCicilan');
      if (elLunas) elLunas.textContent = countLunas;
      if (elBelum) elBelum.textContent = countBelumLunas;
      if (elCicilan) elCicilan.textContent = countCicilan;

      // Chart 2: Paket Layanan (Bar)
      const paketCounts = {};
      pelangganData.forEach(p => {
        const paket = p.paket_layanan || 'Unknown';
        paketCounts[paket] = (paketCounts[paket] || 0) + 1;
      });

      const ctxPaket = document.getElementById('chartPaket');

      // Vertical gradient for bars
      const barGradient = ctxPaket.getContext('2d').createLinearGradient(0, 0, 0, 300);
      barGradient.addColorStop(0, 'rgba(14, 116, 144, 0.9)');
      barGradient.addColorStop(1, 'rgba(14, 116, 144, 0.4)');

      if (chartPaket) chartPaket.destroy();
      chartPaket = new Chart(ctxPaket, {
        type: 'bar',
        data: {
          labels: Object.keys(paketCounts),
          datasets: [{
            label: 'Jumlah Pelanggan',
            data: Object.values(paketCounts),
            backgroundColor: barGradient,
            hoverBackgroundColor: '#0B5C73',
            borderRadius: 8,
            maxBarThickness: 40
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: shadcnTooltip
          },
          scales: {
            y: { 
              beginAtZero: true,
              grid: { color: '#F0F2F5' },
              ticks: { font: { family: "'IBM Plex Mono', monospace", size: 11 }, color: '#5B6B7B' }
            },
            x: {
              grid: { display: false },
              ticks: { font: { family: "'IBM Plex Sans', sans-serif", size: 12, weight: '500' }, color: '#5B6B7B' }
            }
          }
        }
      });

      // Populate paket count badge
      const elPaketCount = document.getElementById('totalPaketCount');
      if (elPaketCount) elPaketCount.textContent = Object.keys(paketCounts).length + ' paket';

      // Chart 3: Tren Tagihan (Line)
      const bulanCounts = {};
      tagihanData.forEach(t => {
        const bulan = formatDateShort(t.bulan_tagihan);
        bulanCounts[bulan] = (bulanCounts[bulan] || 0) + 1;
      });

      const ctxRevenue = document.getElementById('chartRevenue');
      const gradientLine = ctxRevenue.getContext('2d').createLinearGradient(0, 0, 0, 300);
      gradientLine.addColorStop(0, 'rgba(14, 116, 144, 0.20)');
      gradientLine.addColorStop(1, 'rgba(14, 116, 144, 0)');

      const bulanKeys = Object.keys(bulanCounts).slice(-12);
      const bulanVals = Object.values(bulanCounts).slice(-12);

      if (chartRevenue) chartRevenue.destroy();
      chartRevenue = new Chart(ctxRevenue, {
        type: 'line',
        data: {
          labels: bulanKeys,
          datasets: [{
            label: 'Jumlah Tagihan',
            data: bulanVals,
            borderColor: '#0E7490',
            backgroundColor: gradientLine,
            tension: 0.4,
            fill: true,
            borderWidth: 2.5,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointBackgroundColor: '#FFFFFF',
            pointHoverBackgroundColor: '#FFFFFF',
            pointHoverBorderColor: '#0E7490',
            pointHoverBorderWidth: 2.5
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
            tooltip: shadcnTooltip
          },
          scales: {
            y: { 
              beginAtZero: true,
              grid: { color: '#F0F2F5' },
              ticks: { font: { family: "'IBM Plex Mono', monospace", size: 11 }, color: '#5B6B7B' }
            },
            x: {
              grid: { display: false },
              ticks: { font: { family: "'IBM Plex Sans', sans-serif", size: 12 }, color: '#5B6B7B' }
            }
          }
        }
      });

      // Populate trend KPI in header
      const elTrendTotal = document.getElementById('trendTotal');
      const elTrendDelta = document.getElementById('trendDelta');
      if (elTrendTotal) {
        const totalTagihan = bulanVals.reduce((a, b) => a + b, 0);
        elTrendTotal.textContent = totalTagihan;
      }
      if (elTrendDelta && bulanVals.length >= 2) {
        const last = bulanVals[bulanVals.length - 1];
        const prev = bulanVals[bulanVals.length - 2];
        const diff = last - prev;
        if (diff > 0) {
          elTrendDelta.textContent = '+' + diff + ' vs bulan lalu';
          elTrendDelta.className = 'card-kpi-delta delta-up';
        } else if (diff < 0) {
          elTrendDelta.textContent = diff + ' vs bulan lalu';
          elTrendDelta.className = 'card-kpi-delta delta-down';
        } else {
          elTrendDelta.textContent = '0 vs bulan lalu';
          elTrendDelta.className = 'card-kpi-delta';
        }
      }
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
