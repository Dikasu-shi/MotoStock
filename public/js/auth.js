// Authentication Module for MyKasir

const Auth = {
    // Current logged in user object
    currentUser: null,

    // Initialize listeners
    init: function() {
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', this.handleLoginSubmit.bind(this));
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