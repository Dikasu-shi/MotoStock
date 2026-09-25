// SPA Core Bootstrapper, Router and Shell Controller for MotoStock
const App = {
    // Current route state
    currentPage: null,

    // Initializer
    init: async function() {
        this.registerGlobalEvents();

        // 1. Initial auth validation
        const user = await Auth.checkAuth();
        if (user) {
            this.onLoginSuccess(user);
        } else {
            this.onLogoutSuccess();
        }
    },

    registerGlobalEvents: function() {
        // Listen for route changes
        window.addEventListener('hashchange', () => this.router());

        // Sidebar mobile navigation toggle controls
        const btnOpenSidebar = document.getElementById('btn-open-sidebar');
        const btnCloseSidebar = document.getElementById('btn-close-sidebar');
        const sidebar = document.getElementById('sidebar');
        const sidebarOverlay = document.getElementById('sidebar-overlay');

        const toggleSidebar = () => {
            sidebar.classList.toggle('-translate-x-full');
            sidebarOverlay.classList.toggle('hidden');
        };

        if (btnOpenSidebar) btnOpenSidebar.onclick = toggleSidebar;
        if (btnCloseSidebar) btnCloseSidebar.onclick = toggleSidebar;
        if (sidebarOverlay) sidebarOverlay.onclick = toggleSidebar;

        // User dropdown top-bar controls
        const userMenuBtn = document.getElementById('user-menu-btn');
        const userMenuDropdown = document.getElementById('user-menu-dropdown');

        if (userMenuBtn && userMenuDropdown) {
            userMenuBtn.onclick = (e) => {
                e.stopPropagation();
                userMenuDropdown.classList.toggle('hidden');
            };

            document.onclick = () => {
                userMenuDropdown.classList.add('hidden');
            };
        }

        // Global logout binding
        const logoutBtn = document.getElementById('btn-logout');
        if (logoutBtn) {
            logoutBtn.onclick = () => Auth.logout();
        }
        const logoutBtnDropdown = document.getElementById('btn-logout-dropdown');
        if (logoutBtnDropdown) {
            logoutBtnDropdown.onclick = () => Auth.logout();
        }
    },

    // Router function with Role-Based Access Control Guards
    router: function() {
        const hash = window.location.hash || '';

        // Block routes if not logged in
        if (!Auth.currentUser) {
            if (hash === '#register') {
                this.showRegisterPage();
            } else {
                this.showLoginPage();
            }
            return;
        }

        const role = Auth.currentUser.role;

        // Role Router Guard
        if (role === 'customer') {
            // Customer is strictly restricted to pages starting with '#store'
            if (!hash.startsWith('#store') && hash !== '#login' && hash !== '#register') {
                Utils.showToast('Akses ditolak. Halaman ini hanya untuk Administrator/Kasir.', 'error');
                window.location.hash = '#store';
                return;
            }
        } else {
            // Admin or Kasir trying to access customer store
            if (hash.startsWith('#store')) {
                window.location.hash = '#dashboard';
                return;
            }

            // Kasir route protection (operational access only)
            if (role === 'kasir') {
                const adminRoutes = [
                    '#categories',
                    '#suppliers',
                    '#reports',
                    '#reports-purchases',
                    '#reports-stock',
                    '#users',
                    '#settings',
                    '#stock-opname'
                ];
                if (adminRoutes.includes(hash)) {
                    Utils.showToast('Akses ditolak. Halaman ini hanya untuk Administrator.', 'error');
                    window.location.hash = '#dashboard';
                    return;
                }
            }
        }

        // Route Fallback
        if (hash === '' || hash === '#login' || hash === '#register') {
            window.location.hash = role === 'customer' ? '#store' : '#dashboard';
            return;
        }

        let pageId = 'page-dashboard';
        let pageTitle = 'Dashboard Ringkasan';
        let activeNavId = 'nav-dashboard';
        let moduleInit = () => Dashboard.init();

        const hashPath = hash.split('?')[0];

        switch (hashPath) {
            // Admin/Kasir Routes
            case '#dashboard':
                pageId = 'page-dashboard';
                pageTitle = 'Dashboard Ringkasan';
                activeNavId = 'nav-dashboard';
                moduleInit = () => Dashboard.init();
                break;
            case '#pos':
                pageId = 'page-pos';
                pageTitle = 'Mesin Kasir (POS)';
                activeNavId = 'nav-pos';
                moduleInit = () => POS.init();
                break;
            case '#products':
                pageId = 'page-products';
                pageTitle = 'Daftar Spare Part';
                activeNavId = 'nav-products';
                moduleInit = () => Products.init();
                break;
            case '#categories':
                pageId = 'page-categories';
                pageTitle = 'Kategori Produk';
                activeNavId = 'nav-categories';
                moduleInit = () => Categories.init();
                break;
            case '#customers':
                pageId = 'page-customers';
                pageTitle = 'Pelanggan / Member';
                activeNavId = 'nav-customers';
                moduleInit = () => Customers.init();
                break;
            case '#suppliers':
                pageId = 'page-suppliers';
                pageTitle = 'Daftar Supplier';
                activeNavId = 'nav-suppliers';
                moduleInit = () => Suppliers.init();
                break;
            case '#transactions':
                pageId = 'page-transactions';
                pageTitle = 'Riwayat Penjualan';
                activeNavId = 'nav-transactions';
                moduleInit = () => Transactions.init();
                break;
            case '#reports':
                pageId = 'page-reports';
                pageTitle = 'Laporan Keuangan & Margin';
                activeNavId = 'nav-reports';
                moduleInit = () => Reports.init();
                break;
            case '#stock':
                pageId = 'page-stock';
                pageTitle = 'Manajemen & Mutasi Stok';
                activeNavId = 'nav-stock';
                moduleInit = () => Stock.init();
                break;
            case '#purchases':
                pageId = 'page-purchases';
                pageTitle = 'Pembelian Suku Cadang';
                activeNavId = 'nav-purchases';
                moduleInit = () => Purchases.init();
                break;
            case '#stock-opname':
                pageId = 'page-stock-opname';
                pageTitle = 'Stock Opname (Penyesuaian)';
                activeNavId = 'nav-stock-opname';
                moduleInit = () => StockOpname.init();
                break;
            case '#reports-purchases':
                pageId = 'page-reports-purchases';
                pageTitle = 'Laporan Pembelian';
                activeNavId = 'nav-reports-purchases';
                moduleInit = () => ReportsPurchases.init();
                break;
            case '#reports-stock':
                pageId = 'page-reports-stock';
                pageTitle = 'Laporan Valuasi & Status Stok';
                activeNavId = 'nav-reports-stock';
                moduleInit = () => ReportsStock.init();
                break;
            case '#users':
                pageId = 'page-users';
                pageTitle = 'Manajemen Pengguna';
                activeNavId = 'nav-users';
                moduleInit = () => Users.init();
                break;
            case '#settings':
                pageId = 'page-settings';
                pageTitle = 'Pengaturan Aplikasi';
                activeNavId = 'nav-settings';
                moduleInit = () => Settings.init();
                break;

            // Customer Storefront Routes
            case '#store':
                pageId = 'page-store';
                pageTitle = 'Beranda MotoStock';
                activeNavId = 'nav-store';
                moduleInit = () => Store.routeStorePages('#store');
                break;
            case '#store-catalog':
                pageId = 'page-store-catalog';
                pageTitle = 'Katalog Suku Cadang';
                activeNavId = 'nav-store-catalog';
                moduleInit = () => Store.routeStorePages(hash);
                break;
            case '#store-detail':
                pageId = 'page-store-detail';
                pageTitle = 'Detail Produk';
                activeNavId = 'nav-store-catalog';
                moduleInit = () => Store.routeStorePages(hash);
                break;
            case '#store-cart':
                pageId = 'page-store-cart';
                pageTitle = 'Keranjang Belanja';
                activeNavId = 'nav-store-cart';
                moduleInit = () => Store.routeStorePages('#store-cart');
                break;
            case '#store-checkout':
                pageId = 'page-store-checkout';
                pageTitle = 'Checkout Pembelian';
                activeNavId = 'nav-store-cart';
                moduleInit = () => Store.routeStorePages('#store-checkout');
                break;
            case '#store-orders':
                pageId = 'page-store-orders';
                pageTitle = 'Pesanan Saya';
                activeNavId = 'nav-store-orders';
                moduleInit = () => Store.routeStorePages('#store-orders');
                break;
            case '#store-profile':
                pageId = 'page-store-profile';
                pageTitle = 'Profil Customer';
                activeNavId = 'nav-store-profile';
                moduleInit = () => Store.routeStorePages('#store-profile');
                break;
            case '#store-wishlist':
                pageId = 'page-store-wishlist';
                pageTitle = 'Wishlist Saya';
                activeNavId = 'nav-store-wishlist';
                moduleInit = () => Store.routeStorePages('#store-wishlist');
                break;

            default:
                window.location.hash = role === 'customer' ? '#store' : '#dashboard';
                return;
        }

        this.currentPage = pageId;
        this.renderView(pageId, pageTitle, activeNavId);

        // Execute module bootstrap logic
        moduleInit();
    },

    renderView: function(pageId, pageTitle, activeNavId) {
        // 1. Hide all page divs
        const pages = document.querySelectorAll('.app-page');
        pages.forEach(p => p.classList.add('hidden'));

        // 2. Show the targeted page
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.remove('hidden');
            targetPage.classList.add('animate-scale-up');
            // Remove animation after execution to re-trigger next time
            setTimeout(() => targetPage.classList.remove('animate-scale-up'), 250);
        }

        // 3. Update top-bar title (for admin/kasir view)
        const titleEl = document.getElementById('app-page-title');
        if (titleEl) titleEl.textContent = pageTitle;

        // 4. Update active state for both Admin sidebar & Customer storefront top navbar
        const navLinks = document.querySelectorAll('.nav-link, #customer-app nav a');
        navLinks.forEach(link => {
            link.classList.remove('nav-active');
            // Clean active classes of customer store navigation
            if (link.id && link.id.startsWith('nav-store')) {
                link.classList.remove('text-brand-red', 'bg-slate-850');
                link.classList.add('text-slate-400');
            }
        });

        const activeLink = document.getElementById(activeNavId);
        if (activeLink) {
            activeLink.classList.add('nav-active');
            if (activeNavId.startsWith('nav-store')) {
                activeLink.classList.remove('text-slate-400');
                activeLink.classList.add('text-brand-red', 'bg-slate-850');
            }
        }

        // Close mobile sidebar menu if open
        const sidebar = document.getElementById('sidebar');
        const sidebarOverlay = document.getElementById('sidebar-overlay');
        if (sidebar && !sidebar.classList.contains('-translate-x-full')) {
            sidebar.classList.add('-translate-x-full');
            sidebarOverlay.classList.add('hidden');
        }

        // Re-run icons render
        lucide.createIcons();
    },

    showLoginPage: function() {
        document.getElementById('login-page').classList.remove('hidden');
        const loginCard = document.getElementById('login-card');
        const registerCard = document.getElementById('register-card');
        if (loginCard) loginCard.classList.remove('hidden');
        if (registerCard) registerCard.classList.add('hidden');
        document.getElementById('main-app').classList.add('hidden');
        document.getElementById('customer-app').classList.add('hidden');
        if (window.location.hash !== '#login' && window.location.hash !== '#register') {
            window.location.hash = '#login';
        }
        lucide.createIcons();
    },

    showRegisterPage: function() {
        document.getElementById('login-page').classList.remove('hidden');
        const loginCard = document.getElementById('login-card');
        const registerCard = document.getElementById('register-card');
        if (loginCard) loginCard.classList.add('hidden');
        if (registerCard) registerCard.classList.remove('hidden');
        document.getElementById('main-app').classList.add('hidden');
        document.getElementById('customer-app').classList.add('hidden');
        if (window.location.hash !== '#register') {
            window.location.hash = '#register';
        }
        lucide.createIcons();
    },

    onLoginSuccess: async function(user) {
        // Fetch Settings Globally
        try {
            await Settings.loadSettings();
        } catch(e) {
            console.error('Failed to load settings', e);
        }

        if (user.role === 'customer') {
            // Customer user shell setup
            document.getElementById('customer-display-name').textContent = user.nama;
            document.getElementById('customer-avatar-initials').textContent = user.nama.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

            document.getElementById('login-page').classList.add('hidden');
            document.getElementById('main-app').classList.add('hidden');
            document.getElementById('customer-app').classList.remove('hidden');

            // Boot store module
            Store.init();

            if (!window.location.hash.startsWith('#store')) {
                window.location.hash = '#store';
            } else {
                this.router();
            }
        } else {
            // Admin or Kasir user shell setup
            document.getElementById('user-display-name').textContent = user.nama;
            document.getElementById('user-display-role').textContent = user.role.toUpperCase();
            document.getElementById('user-initials').textContent = user.nama.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

            document.getElementById('user-menu-name').textContent = user.nama;
            document.getElementById('user-menu-role').textContent = user.role === 'admin' ? 'Administrator' : 'Kasir Toko';

            // Show/hide Admin-only elements in sidebar
            const adminElements = document.querySelectorAll('.admin-only');
            adminElements.forEach(el => {
                if (user.role === 'admin') {
                    el.classList.remove('hidden');
                } else {
                    el.classList.add('hidden');
                }
            });

            document.getElementById('login-page').classList.add('hidden');
            document.getElementById('customer-app').classList.add('hidden');
            document.getElementById('main-app').classList.remove('hidden');

            if (user.role === 'kasir') {
                if (window.location.hash.startsWith('#store') || window.location.hash === '' || window.location.hash === '#login' || window.location.hash === '#dashboard') {
                    window.location.hash = '#pos';
                } else {
                    this.router();
                }
            } else {
                // Admin
                if (window.location.hash.startsWith('#store') || window.location.hash === '' || window.location.hash === '#login') {
                    window.location.hash = '#dashboard';
                } else {
                    this.router();
                }
            }
        }
    },

    onLogoutSuccess: function() {
        this.showLoginPage();
        // Reset form
        document.getElementById('login-username').value = '';
        document.getElementById('login-password').value = '';
    }
};

// Initialize App when DOM fully loaded
document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
    App.init();
});

window.App = App;