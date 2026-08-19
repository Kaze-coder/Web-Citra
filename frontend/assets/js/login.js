/**
 * Halaman Login Citra NET Manager
 * Catatan: konfigurasi axios, Notyf, dan auth guard sudah disiapkan di main.js.
 */

const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const btnLogin = document.getElementById('btnLogin');
const togglePassword = document.getElementById('togglePassword');

const BTN_LABEL = 'Masuk';
const BTN_LOADING_LABEL = '<span class="spinner-border spinner-border-sm" aria-hidden="true"></span> Memproses...';

// Toggle lihat/sembunyikan password
togglePassword.addEventListener('click', () => {
  const isHidden = passwordInput.type === 'password';
  passwordInput.type = isHidden ? 'text' : 'password';
  togglePassword.querySelector('i').className = isHidden ? 'fas fa-eye-slash' : 'fas fa-eye';
  togglePassword.setAttribute('aria-label', isHidden ? 'Sembunyikan password' : 'Tampilkan password');
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  btnLogin.disabled = true;
  btnLogin.innerHTML = BTN_LOADING_LABEL;

  try {
    const { data } = await axios.post('/admin/login', { username, password });

    localStorage.setItem('token', data.token);
    notyf.success('Login berhasil. Mengalihkan ke dashboard...');

    // Beri waktu notifikasi terlihat sebelum pindah halaman
    setTimeout(() => {
      window.location.href = '../index.html';
    }, 600);
  } catch (error) {
    const serverMessage = error.response?.data?.message;
    notyf.error(escapeHtml(serverMessage || 'Username atau password salah'));

    btnLogin.disabled = false;
    btnLogin.innerHTML = BTN_LABEL;
  }
});
