// Authentication Module for MotoStock

const Auth = {
    // Current logged in user object
    currentUser: null,

    // Initialize listeners
    init: function() {
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', this.handleLoginSubmit.bind(this));
        }

        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', this.handleRegisterSubmit.bind(this));
        }
    },

    // Handle register form submit
    handleRegisterSubmit: async function(e) {
        e.preventDefault();

        const namaInput = document.getElementById('register-nama');
        const usernameInput = document.getElementById('register-username');
        const passwordInput = document.getElementById('register-password');
        const confirmPasswordInput = document.getElementById('register-password-confirmation');
        const registerSubmitBtn = document.getElementById('register-submit-btn');

        const nama = namaInput.value.trim();
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        const passwordConfirmation = confirmPasswordInput.value;

        if (!nama) {
            Utils.showToast('Nama lengkap wajib diisi.', 'error');
            return;
        }

        if (!username) {
            Utils.showToast('Username wajib diisi.', 'error');
            return;
        }

        if (!password) {
            Utils.showToast('Password wajib diisi.', 'error');
            return;
        }

        if (password.length < 6) {
            Utils.showToast('Password minimal 6 karakter.', 'error');
            return;
        }

        if (password !== passwordConfirmation) {
            Utils.showToast('Konfirmasi password tidak cocok.', 'error');
            return;
        }

        Utils.setLoading(registerSubmitBtn, true, 'Daftar');

        // Call API auth/register
        const result = await Utils.apiCall('auth/register', 'POST', {
            nama: nama,
            username: username,
            password: password,
            password_confirmation: passwordConfirmation
        });

        Utils.setLoading(registerSubmitBtn, false, 'Daftar');

        if (result.success) {
            Utils.showToast('Registrasi berhasil. Silakan masuk menggunakan akun Anda.', 'success');

            // Clear register form fields
            namaInput.value = '';
            usernameInput.value = '';
            passwordInput.value = '';
            confirmPasswordInput.value = '';

            // Prefill login form with registered username
            const loginUsername = document.getElementById('login-username');
            if (loginUsername) {
                loginUsername.value = username;
            }
            const loginPassword = document.getElementById('login-password');
            if (loginPassword) {
                loginPassword.value = '';
                loginPassword.focus();
            }

            // Redirect to Login page
            window.location.hash = '#login';
            App.showLoginPage();
        } else {
            Utils.showToast(result.message || 'Registrasi gagal. Silakan periksa kembali data Anda.', 'error');
        }
    },

    // Handle form submit
    handleLoginSubmit: async function(e) {
        e.preventDefault();

        const usernameInput = document.getElementById('login-username');
        const passwordInput = document.getElementById('login-password');
        const loginSubmitBtn = document.getElementById('login-submit-btn');

        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        if (!username || !password) {
            Utils.showToast('Username dan Password wajib diisi!', 'error');
            return;
        }

        Utils.setLoading(loginSubmitBtn, true, 'Masuk');

        // Call API auth/login
        const result = await Utils.apiCall('auth/login', 'POST', {
            username: username,
            password: password
        });

        Utils.setLoading(loginSubmitBtn, false, 'Masuk');

        if (result.success) {
            this.currentUser = result.data;
            Utils.showToast('Login berhasil! Selamat datang, ' + result.data.nama, 'success');

            // Re-render UI and change hash
            App.onLoginSuccess(result.data);
        } else {
            Utils.showToast(result.message || 'Login gagal, periksa username/password.', 'error');
            passwordInput.value = '';
        }
    },

    // Perform check auth state on load
    checkAuth: async function() {
        const result = await Utils.apiCall('auth/check', 'GET');
        if (result.success && result.data) {
            this.currentUser = result.data;
            return result.data;
        }
        this.currentUser = null;
        return null;
    },

    // Perform Logout
    logout: async function() {
        const confirm = await Utils.confirmDialog('Apakah Anda yakin ingin keluar dari sistem?');
        if (!confirm) return;

        const result = await Utils.apiCall('auth/logout', 'POST');
        if (result.success) {
            this.currentUser = null;
            Utils.showToast('Anda telah keluar dari sistem.', 'success');

            // Redirect to login page
            App.onLogoutSuccess();
        } else {
            Utils.showToast('Gagal keluar sistem.', 'error');
        }
    }
};

window.Auth = Auth;