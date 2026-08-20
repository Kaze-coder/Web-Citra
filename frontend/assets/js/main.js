/**
 * Utilitas Utama Citra NET Manager
 */

// Notifikasi Notyf
const notyf = new Notyf({
  duration: 4000,
  position: { x: 'right', y: 'bottom' }
});

// ===== KONFIGURASI API =====
// Backend menyajikan frontend secara statis, jadi API berada di origin yang sama
const API_BASE = window.location.origin + '/api';
axios.defaults.baseURL = API_BASE;
axios.defaults.headers.common['Content-Type'] = 'application/json';

// ===== AUTH (JWT) =====
// login.html berada di frontend/pages/login.html
const LOGIN_PATH = window.location.pathname.includes('/pages/') ? 'login.html' : 'pages/login.html';

function isLoginPage() {
  return window.location.pathname.endsWith('login.html');
}

function logout() {
  localStorage.removeItem('token');
  window.location.href = LOGIN_PATH;
}

// Interceptor request: lampirkan token JWT jika ada
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor response: 401 -> hapus token & redirect ke login
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      // Jangan redirect-loop di halaman login itu sendiri
      if (!isLoginPage()) {
        window.location.href = LOGIN_PATH;
      }
    }
    return Promise.reject(error);
  }
);

// Auth guard: tanpa token -> redirect ke halaman login
document.addEventListener('DOMContentLoaded', () => {
  if (!localStorage.getItem('token') && !isLoginPage()) {
    window.location.href = LOGIN_PATH;
    return;
  }
  console.log('Citra NET Manager loaded');
});

// Toggle Sidebar (Desktop & Mobile)
const toggleSidebarBtn = document.getElementById('toggleSidebar');
const sidebar = document.querySelector('.sidebar');
const mainContent = document.querySelector('.main-content');
const wrapper = document.querySelector('.wrapper');

if (toggleSidebarBtn && sidebar) {
  toggleSidebarBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent document click from immediately closing it
    
    if (window.innerWidth <= 1024) {
      sidebar.classList.toggle('active');
    } else {
      sidebar.classList.toggle('collapsed');
      mainContent.classList.toggle('collapsed');
      
      const isNowCollapsed = sidebar.classList.contains('collapsed');
      localStorage.setItem('sidebar-collapsed', isNowCollapsed);
      
      if (isNowCollapsed) {
        document.documentElement.classList.add('sidebar-collapsed');
      } else {
        document.documentElement.classList.remove('sidebar-collapsed');
      }
    }
  });
  
  // Restore state sidebar
  const isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
  if (isCollapsed && window.innerWidth > 1024) {
    sidebar.classList.add('collapsed');
    mainContent.classList.add('collapsed');
    document.documentElement.classList.add('sidebar-collapsed');
  } else {
    document.documentElement.classList.remove('sidebar-collapsed');
  }
}

// Tutup sidebar jika klik di luar (Mobile)
document.addEventListener('click', (e) => {
  if (window.innerWidth <= 1024) {
    if (!e.target.closest('.sidebar') && !e.target.closest('.btn-toggle-sidebar')) {
      sidebar?.classList.remove('active');
    }
  }
});

// ===== FUNGSI UTILITAS =====

function showNotification(message, type = 'success') {
  switch(type) {
    case 'success':
      notyf.success(message);
      break;
    case 'error':
      notyf.error(message);
      break;
    case 'warning':
      notyf.open({ type: 'warning', message: message });
      break;
    case 'info':
      notyf.open({ type: 'info', message: message });
      break;
    default:
      notyf.success(message);
  }
}

function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(value);
}

function formatDate(date) {
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(date));
}

function formatDateShort(date) {
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(date));
}

function getStatusBadge(status) {
  const badges = {
    'aktif': '<span class="badge bg-success">Aktif</span>',
    'nonaktif': '<span class="badge bg-secondary">Nonaktif</span>',
    'suspend': '<span class="badge bg-danger">Suspend</span>',
    'lunas': '<span class="badge bg-success">Lunas</span>',
    'belum_lunas': '<span class="badge bg-warning">Belum Lunas</span>',
    'cicilan': '<span class="badge bg-info">Cicilan</span>',
    'mati': '<span class="badge bg-danger">Mati</span>',
    'error': '<span class="badge bg-danger">Error</span>'
  };
  return badges[status] || status;
}

// Escape HTML untuk string yang dikontrol pengguna (anti-XSS)
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ===== MOTION: reveal-on-entry (transform/opacity only) =====
// Elemen ber-class .reveal muncul dengan fade + translateY(12px).
// Hormati prefers-reduced-motion: tanpa observer, CSS menampilkan elemen apa adanya.
(function initReveal() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const targets = document.querySelectorAll('.reveal');
  if (prefersReduced || !('IntersectionObserver' in window) || targets.length === 0) {
    targets.forEach((el) => el.classList.add('revealed'));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
        // Lepas class setelah animasi masuk selesai agar hover-lift kartu tetap bekerja
        entry.target.addEventListener('transitionend', function cleanup(e) {
          if (e.propertyName !== 'opacity') return;
          entry.target.classList.remove('reveal', 'revealed');
          entry.target.removeEventListener('transitionend', cleanup);
        });
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -24px 0px' });
  targets.forEach((el) => observer.observe(el));
})();

// ===== MOTION: subtle DataTables redraw feedback =====
// Saat DataTables menggambar ulang tbody (pindah halaman / cari),
// beri fade singkat sebagai umpan balik visual.
document.addEventListener('DOMContentLoaded', () => {
  const tables = document.querySelectorAll('.dataTables_wrapper');
  tables.forEach((wrapper) => {
    const tbody = wrapper.querySelector('tbody');
    if (!tbody) return;
    const observer = new MutationObserver(() => {
      tbody.style.opacity = '0.6';
      requestAnimationFrame(() => {
        tbody.style.transition = 'opacity 200ms ease';
        tbody.style.opacity = '1';
      });
    });
    observer.observe(tbody, { childList: true });
  });
});
