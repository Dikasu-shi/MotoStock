// MotoStock Customer Store Module
window.Store = {
    cart: [],
    wishlist: [],
    products: [],
    categories: [],
    isLoading: true,

    init: function() {
        this.loadCartFromStorage();
        this.loadWishlistFromStorage();
        this.fetchStoreData();
        this.setupEventListeners();
    },

    loadCartFromStorage: function() {
        const stored = localStorage.getItem('motostock_cart');
        this.cart = stored ? JSON.parse(stored) : [];
        this.updateCartBadge();
    },

    loadWishlistFromStorage: function() {
        const stored = localStorage.getItem('motostock_wishlist');
        this.wishlist = stored ? JSON.parse(stored) : [];
    },

    saveCartToStorage: function() {
        localStorage.setItem('motostock_cart', JSON.stringify(this.cart));
        this.updateCartBadge();
    },

    saveWishlistToStorage: function() {
        localStorage.setItem('motostock_wishlist', JSON.stringify(this.wishlist));
    },

    updateCartBadge: function() {
        const badge = document.getElementById('cart-badge');
        if (!badge) return;

        const count = this.cart.reduce((sum, item) => sum + item.qty, 0);
        if (count > 0) {
            badge.textContent = count;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    },

    fetchStoreData: function() {
        this.isLoading = true;
        // Load categories and products for local search/catalogs
        Promise.all([
            Utils.apiCall('categories'),
            Utils.apiCall('products')
        ]).then(([catRes, prodRes]) => {
            this.isLoading = false;
            if (catRes.success) {
                this.categories = catRes.data;
                this.renderCategoryOptions();
            }
            if (prodRes.success) {
                this.products = prodRes.data.filter(p => p.is_active === true || p.is_active == 1 || p.is_active === '1');
                // Trigger page refresh if already on a store hash
                if (window.location.hash.startsWith('#store')) {
                    this.routeStorePages(window.location.hash);
                }
            }
        }).catch(err => {
            this.isLoading = false;
            console.error('Gagal memuat data katalog:', err);
            Utils.showToast('Gagal memuat katalog produk.', 'error');
        });
    },

    setupEventListeners: function() {
        // Search & Filters key/change bindings
        const homeSearch = document.getElementById('store-home-search');
        if (homeSearch) {
            homeSearch.addEventListener('keyup', (e) => {
                if (e.key === 'Enter') {
                    const query = e.target.value;
                    window.location.hash = `#store-catalog?search=${encodeURIComponent(query)}`;
                }
            });
        }

        const catSearch = document.getElementById('catalog-search');
        if (catSearch) {
            catSearch.addEventListener('input', Utils.debounce(() => this.filterCatalog(), 300));
        }

        const catFilter = document.getElementById('catalog-category-filter');
        if (catFilter) {
            catFilter.addEventListener('change', () => this.filterCatalog());
        }

        const motorFilter = document.getElementById('catalog-motor-filter');
        if (motorFilter) {
            motorFilter.addEventListener('change', () => this.filterCatalog());
        }
    },

    renderCategoryOptions: function() {
        const select = document.getElementById('catalog-category-filter');
        if (!select) return;
        select.innerHTML = '<option value="">Semua Kategori</option>' +
            this.categories.map(c => `<option value="${c.id}">${Utils.escapeHtml(c.nama)}</option>`).join('');
    },

    routeStorePages: function(hash) {
        const path = hash.split('?')[0];
        const params = new URLSearchParams(hash.split('?')[1] || '');

        switch(path) {
            case '#store':
                this.renderHome();
                break;
            case '#store-catalog':
                const query = params.get('search') || '';
                const searchInput = document.getElementById('catalog-search');
                if (searchInput && query) {
                    searchInput.value = query;
                }
                this.renderCatalog();
                break;
            case '#store-detail':
                const id = params.get('id');
                if (id) this.renderDetail(parseInt(id));
                break;
            case '#store-cart':
                this.renderCart();
                break;
            case '#store-checkout':
                this.renderCheckout();
                break;
            case '#store-orders':
                this.renderOrders();
                break;
            case '#store-profile':
                this.renderProfile();
                break;
            case '#store-wishlist':
                this.renderWishlist();
                break;
        }

        // Setup store name and metadata dynamically
        Utils.apiCall('settings').then(res => {
            if (res.success && res.data) {
                const s = res.data;
                const nameEl = document.getElementById('store-info-name');
                const addrEl = document.getElementById('store-info-addr');
                const phoneEl = document.getElementById('store-info-phone');
                if (nameEl) nameEl.textContent = s.store_name || 'MotoStock';
                if (addrEl) addrEl.textContent = s.store_address || '';
                if (phoneEl) phoneEl.textContent = 'Hubungi: ' + (s.store_phone || '');
            }
        });
    },

    renderHome: function() {
        const grid = document.getElementById('store-popular-grid');
        if (!grid) return;

        if (this.isLoading && this.products.length === 0) {
            grid.innerHTML = '<div class="col-span-full text-center py-12 text-slate-400 flex flex-col items-center justify-center"><i data-lucide="loader-2" class="w-6 h-6 animate-spin text-brand-red mb-2"></i><span class="text-xs">Memuat suku cadang terlaris...</span></div>';
            lucide.createIcons();
            return;
        }

        // Take top 8 items
        const popular = this.products.slice(0, 8);
        if (popular.length === 0) {
            grid.innerHTML = '<div class="col-span-full text-center py-8 text-slate-500 text-xs">Belum ada katalog spare part tersedia.</div>';
            return;
        }

        grid.innerHTML = popular.map(p => this.getProductCardHtml(p)).join('');
        lucide.createIcons();
    },

    renderCatalog: function() {
        this.filterCatalog();
    },

    filterCatalog: function() {
        const grid = document.getElementById('catalog-products-grid');
        if (!grid) return;

        if (this.isLoading && this.products.length === 0) {
            grid.innerHTML = '<div class="col-span-full text-center py-16 text-slate-400 flex flex-col items-center justify-center"><i data-lucide="loader-2" class="w-6 h-6 animate-spin text-brand-red mb-2"></i><span class="text-xs">Memuat katalog suku cadang...</span></div>';
            lucide.createIcons();
            return;
        }

        const search = (document.getElementById('catalog-search')?.value || '').toLowerCase();
        const catId = document.getElementById('catalog-category-filter')?.value || '';
        const motor = document.getElementById('catalog-motor-filter')?.value || '';

        let filtered = this.products;

        if (search) {
            filtered = filtered.filter(p =>
                p.nama.toLowerCase().includes(search) ||
                p.sku.toLowerCase().includes(search) ||
                (p.category_nama && p.category_nama.toLowerCase().includes(search)) ||
                (p.motor && p.motor.toLowerCase().includes(search))
            );
        }
        if (catId) {
            filtered = filtered.filter(p => parseInt(p.category_id) === parseInt(catId));
        }
        if (motor) {
            const m = motor.toLowerCase();
            filtered = filtered.filter(p => {
                if (!p.motor) return true;
                const pm = p.motor.toLowerCase();
                if (pm.includes('all honda') || pm.includes('universal')) return true;
                if (m === 'beat' && (pm.includes('beat') || pm.includes('matic'))) return true;
                if (m === 'vario' && (pm.includes('vario') || pm.includes('matic'))) return true;
                if (m === 'pcx' && (pm.includes('pcx') || pm.includes('matic'))) return true;
                if (m === 'supra' && (pm.includes('supra') || pm.includes('revo') || pm.includes('bebek'))) return true;
                if (m === 'cbr' && (pm.includes('cbr') || pm.includes('sport'))) return true;
                return pm.includes(m);
            });
        }

        if (filtered.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full flex flex-col items-center justify-center text-center py-16 px-4">
                    <div class="w-12 h-12 rounded-full bg-slate-850 flex items-center justify-center text-slate-400 mb-3 border border-slate-800">
                        <i data-lucide="search" class="w-5 h-5"></i>
                    </div>
                    <h4 class="text-sm font-semibold text-slate-100 mb-1">Suku cadang tidak ditemukan</h4>
                    <p class="text-xs text-slate-400 max-w-sm mb-4">Kami tidak menemukan produk yang sesuai dengan pencarian atau filter Anda.</p>
                    <button onclick="Store.resetFilter()" class="px-4 py-2 border border-slate-800 hover:border-slate-700 bg-slate-900 hover:bg-slate-850 text-slate-200 text-xs font-medium rounded-md transition-colors shadow-sm">
                        Hapus Filter
                    </button>
                </div>
            `;
            lucide.createIcons();
            return;
        }

        grid.innerHTML = filtered.map(p => this.getProductCardHtml(p)).join('');
        lucide.createIcons();
    },

    resetFilter: function() {
        const search = document.getElementById('catalog-search');
        const catFilter = document.getElementById('catalog-category-filter');
        const motorFilter = document.getElementById('catalog-motor-filter');
        if (search) search.value = '';
        if (catFilter) catFilter.value = '';
        if (motorFilter) motorFilter.value = '';
        this.filterCatalog();
    },

    getCategoryIcon: function(catName, prodName) {
        const text = ((catName || '') + ' ' + (prodName || '')).toLowerCase();
        if (text.includes('oli') || text.includes('pelumas') || text.includes('oil')) return 'droplets';
        if (text.includes('rem') || text.includes('brake') || text.includes('disc')) return 'disc';
        if (text.includes('busi') || text.includes('spark')) return 'flame';
        if (text.includes('filter') || text.includes('udara')) return 'wind';
        if (text.includes('kelistrikan') || text.includes('cdi') || text.includes('lampu') || text.includes('stator') || text.includes('rectifier')) return 'zap';
        if (text.includes('v-belt') || text.includes('roller') || text.includes('gear') || text.includes('rantai')) return 'cog';
        if (text.includes('kopling') || text.includes('clutch')) return 'refresh-cw';
        if (text.includes('mesin') || text.includes('piston') || text.includes('injector') || text.includes('pump') || text.includes('throttle')) return 'gauge';
        return 'wrench';
    },

    getProductCardHtml: function(p) {
        const isWishlisted = this.wishlist.some(item => item.id === p.id);
        const wishColor = isWishlisted ? 'text-brand-red fill-brand-red' : 'text-slate-400';

        let stockBadge = '';
        const stockCount = parseInt(p.stok);
        if (stockCount === 0) {
            stockBadge = '<span class="text-[10px] font-bold text-red-500 uppercase">Habis</span>';
        } else if (stockCount <= parseInt(p.stok_minimum)) {
            stockBadge = '<span class="text-[10px] font-bold text-amber-500 uppercase">Menipis</span>';
        } else {
            stockBadge = '<span class="text-[10px] font-bold text-green-500 uppercase">Ready</span>';
        }

        const iconName = this.getCategoryIcon(p.category_nama, p.nama);

        return `
            <div class="store-product-card glass-panel rounded-md overflow-hidden flex flex-col justify-between">
                <div class="p-4 flex-grow flex flex-col justify-between space-y-3">
                    <div class="flex justify-between items-start">
                        ${stockBadge}
                        <button onclick="Store.toggleWishlist(${p.id})" class="p-1 hover:bg-slate-850 rounded-full transition-colors" title="Wishlist">
                            <i data-lucide="heart" class="w-4 h-4 ${wishColor}"></i>
                        </button>
                    </div>
                    <div class="w-full h-32 bg-slate-850 rounded flex items-center justify-center text-slate-500">
                        <i data-lucide="${iconName}" class="w-10 h-10"></i>
                    </div>
                    <div class="space-y-1">
                        <a href="#store-detail?id=${p.id}" class="block text-xs font-bold text-slate-100 hover:text-brand-red transition-colors line-clamp-2">${Utils.escapeHtml(p.nama)}</a>
                        <div class="text-[9px] text-slate-400 font-mono-numbers">${Utils.escapeHtml(p.sku)}</div>
                        <div class="text-[9px] text-slate-500 font-semibold bg-slate-850 px-2 py-0.5 rounded w-fit">${Utils.escapeHtml(p.motor || 'Universal')}</div>
                    </div>
                </div>
                <div class="p-4 border-t border-slate-800 flex justify-between items-center bg-slate-900/30">
                    <span class="text-xs font-bold text-brand-red font-mono-numbers">${Utils.formatRupiah(p.harga_jual)}</span>
                    ${stockCount > 0 ? `
                        <button onclick="Store.addToCartById(${p.id})" class="p-1.5 bg-brand-red hover:bg-brand-darkred text-white rounded transition-colors" title="Tambah Ke Keranjang">
                            <i data-lucide="shopping-cart" class="w-3.5 h-3.5"></i>
                        </button>
                    ` : `
                        <button class="p-1.5 bg-slate-800 text-slate-500 rounded cursor-not-allowed" disabled>
                            <i data-lucide="slash" class="w-3.5 h-3.5"></i>
                        </button>
                    `}
                </div>
            </div>
        `;
    },

    renderDetail: function(id) {
        const container = document.getElementById('store-product-detail-container');
        if (!container) return;

        const p = this.products.find(item => item.id === id);
        if (!p) {
            container.innerHTML = '<div class="text-center py-6 text-slate-500">Detail suku cadang tidak ditemukan.</div>';
            return;
        }

        let stockStatus = '';
        const stockCount = parseInt(p.stok);
        if (stockCount === 0) {
            stockStatus = '<span class="px-2.5 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/20 uppercase">Habis</span>';
        } else if (stockCount <= parseInt(p.stok_minimum)) {
            stockStatus = '<span class="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 uppercase">Stok Menipis (Sisa ' + p.stok + ' pcs)</span>';
        } else {
            stockStatus = '<span class="px-2.5 py-0.5 rounded text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20 uppercase">Ready Stok (' + p.stok + ' pcs)</span>';
        }

        const iconName = this.getCategoryIcon(p.category_nama, p.nama);

        container.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div class="w-full h-64 md:h-96 bg-slate-850 rounded-md flex items-center justify-center text-slate-500">
                    <i data-lucide="${iconName}" class="w-20 h-20"></i>
                </div>
                <div class="space-y-6">
                    <div class="space-y-2">
                        <div class="flex items-center space-x-2">${stockStatus}</div>
                        <h2 class="text-xl md:text-2xl font-bold text-slate-100">${Utils.escapeHtml(p.nama)}</h2>
                        <div class="text-xs text-slate-400 font-mono-numbers">Nomor SKU / Part: <span class="font-bold">${Utils.escapeHtml(p.sku)}</span></div>
                        <div class="text-xs text-slate-400">Kategori: <span class="font-semibold text-slate-200">${Utils.escapeHtml(p.category_nama || 'Umum')}</span></div>
                    </div>

                    <div class="text-2xl font-bold text-brand-red font-mono-numbers border-t border-b border-slate-850 py-3">
                        ${Utils.formatRupiah(p.harga_jual)}
                    </div>

                    <div class="space-y-2">
                        <h4 class="text-xs font-bold text-slate-300 uppercase tracking-wider">Kompabilitas Motor Honda:</h4>
                        <span class="inline-block px-3 py-1 bg-slate-850 border border-slate-800 rounded text-xs font-medium text-slate-200">${Utils.escapeHtml(p.motor || 'Universal')}</span>
                    </div>

                    <div class="space-y-2">
                        <h4 class="text-xs font-bold text-slate-300 uppercase tracking-wider">Deskripsi Spare Part:</h4>
                        <p class="text-xs text-slate-400 leading-relaxed">${Utils.escapeHtml(p.deskripsi || 'Tidak ada deskripsi.')}</p>
                    </div>

                    <div class="flex items-center space-x-4 pt-4 border-t border-slate-850">
                        ${stockCount > 0 ? `
                            <div class="flex items-center border border-slate-800 rounded bg-slate-950 overflow-hidden">
                                <button onclick="Store.updateDetailQty(-1)" class="px-3 py-2 text-slate-400 hover:bg-slate-850"><i data-lucide="minus" class="w-4 h-4"></i></button>
                                <input type="number" id="detail-qty-input" value="1" min="1" max="${p.stok}" readonly class="w-12 bg-transparent text-center text-sm font-semibold text-slate-100 font-mono-numbers focus:outline-none">
                                <button onclick="Store.updateDetailQty(1, ${p.stok})" class="px-3 py-2 text-slate-400 hover:bg-slate-850"><i data-lucide="plus" class="w-4 h-4"></i></button>
                            </div>
                            <button onclick="Store.addDetailToCart(${p.id})" class="flex-grow py-2.5 bg-brand-red hover:bg-brand-darkred text-white text-xs font-semibold rounded transition-colors shadow flex items-center justify-center">
                                <i data-lucide="shopping-cart" class="w-4 h-4 mr-2"></i> Tambah Ke Keranjang
                            </button>
                        ` : `
                            <button class="w-full py-2.5 bg-slate-800 text-slate-500 text-xs font-semibold rounded cursor-not-allowed" disabled>Stok Habis</button>
                        `}
                    </div>
                </div>
            </div>
        `;
        lucide.createIcons();
    },

    updateDetailQty: function(diff, maxStock = 999) {
        const input = document.getElementById('detail-qty-input');
        if (!input) return;
        let current = parseInt(input.value) + diff;
        if (current < 1) current = 1;
        if (current > maxStock) current = maxStock;
        input.value = current;
    },

    addDetailToCart: function(id) {
        const p = this.products.find(item => item.id === id);
        if (!p) return;
        const input = document.getElementById('detail-qty-input');
        const qty = input ? parseInt(input.value) : 1;
        this.addToCart(p, qty);
    },

    addToCartById: function(id) {
        const p = this.products.find(item => item.id === id);
        if (p) this.addToCart(p, 1);
    },

    addToCart: function(product, qty) {
        const existing = this.cart.find(item => item.id === product.id);

        // Stock validation
        const maxStock = parseInt(product.stok);
        const currentQty = existing ? existing.qty : 0;

        if (currentQty + qty > maxStock) {
            Utils.showToast(`Stok ${product.nama} tidak mencukupi. Sisa stok: ${maxStock}`, 'warning');
            return;
        }

        if (existing) {
            existing.qty += qty;
        } else {
            this.cart.push({
                id: product.id,
                nama: product.nama,
                sku: product.sku,
                harga_jual: product.harga_jual,
                qty: qty,
                stok: maxStock
            });
        }

        this.saveCartToStorage();
        Utils.showToast(`Berhasil menambahkan ${product.nama} ke keranjang!`, 'success');
    },

    removeFromCart: function(id) {
        this.cart = this.cart.filter(item => item.id !== id);
        this.saveCartToStorage();
        this.renderCart();
    },

    updateCartQty: function(id, diff) {
        const item = this.cart.find(i => i.id === id);
        if (!item) return;

        let newQty = item.qty + diff;
        if (newQty < 1) newQty = 1;

        if (newQty > parseInt(item.stok)) {
            Utils.showToast(`Stok maksimum tercapai.`, 'warning');
            return;
        }

        item.qty = newQty;
        this.saveCartToStorage();
        this.renderCart();
    },

    toggleWishlist: function(id) {
        const p = this.products.find(item => item.id === id);
        if (!p) return;

        const idx = this.wishlist.findIndex(item => item.id === id);
        if (idx > -1) {
            this.wishlist.splice(idx, 1);
            Utils.showToast('Dihapus dari wishlist', 'info');
        } else {
            this.wishlist.push(p);
            Utils.showToast('Ditambahkan ke wishlist', 'success');
        }

        this.saveWishlistToStorage();
        // Redraw if on pages
        if (window.location.hash === '#store-wishlist') {
            this.renderWishlist();
        } else if (window.location.hash === '#store-catalog') {
            this.filterCatalog();
        } else if (window.location.hash === '#store') {
            this.renderHome();
        }
    },

    renderCart: function() {
        const tbody = document.getElementById('store-cart-table-body');
        const countEl = document.getElementById('store-cart-item-count');
        const totalEl = document.getElementById('store-cart-total-price');

        if (!tbody) return;

        if (this.cart.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center py-12 text-slate-500">Keranjang belanja Anda kosong. <a href="#store-catalog" class="text-brand-red font-bold hover:underline">Ayo Belanja!</a></td></tr>`;
            if (countEl) countEl.textContent = '0 Pcs';
            if (totalEl) totalEl.textContent = 'Rp 0';
            return;
        }

        let total = 0;
        let itemsCount = 0;

        tbody.innerHTML = this.cart.map(item => {
            const sub = parseFloat(item.harga_jual) * item.qty;
            total += sub;
            itemsCount += item.qty;

            return `
                <tr>
                    <td class="px-4 py-3">
                        <div class="font-semibold text-slate-200">${Utils.escapeHtml(item.nama)}</div>
                        <div class="text-[10px] text-slate-400 font-mono-numbers">${Utils.escapeHtml(item.sku)}</div>
                    </td>
                    <td class="px-4 py-3 text-right font-mono-numbers text-slate-300">${Utils.formatRupiah(item.harga_jual)}</td>
                    <td class="px-4 py-3 text-center">
                        <div class="flex items-center justify-center space-x-2">
                            <button onclick="Store.updateCartQty(${item.id}, -1)" class="p-1 bg-slate-850 hover:bg-slate-800 border border-slate-850 rounded text-slate-300"><i data-lucide="minus" class="w-3 h-3"></i></button>
                            <span class="w-8 text-center text-xs font-semibold font-mono-numbers text-slate-100">${item.qty}</span>
                            <button onclick="Store.updateCartQty(${item.id}, 1)" class="p-1 bg-slate-850 hover:bg-slate-800 border border-slate-850 rounded text-slate-300"><i data-lucide="plus" class="w-3 h-3"></i></button>
                        </div>
                    </td>
                    <td class="px-4 py-3 text-right font-mono-numbers font-semibold text-slate-200">${Utils.formatRupiah(sub)}</td>
                    <td class="px-4 py-3 text-center">
                        <button onclick="Store.removeFromCart(${item.id})" class="p-1 bg-brand-red/10 hover:bg-brand-red/20 text-brand-red border border-brand-red/10 rounded transition-colors" title="Hapus"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                    </td>
                </tr>
            `;
        }).join('');

        if (countEl) countEl.textContent = `${itemsCount} Pcs`;
        if (totalEl) totalEl.textContent = Utils.formatRupiah(total);
        lucide.createIcons();
    },

    renderCheckout: function() {
        const itemsSummary = document.getElementById('checkout-items-summary');
        const subtotalEl = document.getElementById('checkout-subtotal');
        const totalEl = document.getElementById('checkout-total');

        if (!itemsSummary) return;

        if (this.cart.length === 0) {
            itemsSummary.innerHTML = '<div class="text-center py-6 text-slate-500">Tidak ada item di checkout.</div>';
            if (subtotalEl) subtotalEl.textContent = 'Rp 0';
            if (totalEl) totalEl.textContent = 'Rp 0';
            return;
        }

        let total = 0;
        itemsSummary.innerHTML = this.cart.map(item => {
            const sub = parseFloat(item.harga_jual) * item.qty;
            total += sub;
            return `
                <div class="py-2.5 flex justify-between items-center text-xs">
                    <div>
                        <div class="font-semibold text-slate-200 line-clamp-1">${Utils.escapeHtml(item.nama)}</div>
                        <div class="text-[9px] text-slate-400 font-mono-numbers">${item.qty} pcs x ${Utils.formatRupiah(item.harga_jual)}</div>
                    </div>
                    <span class="font-mono-numbers text-slate-200 font-semibold">${Utils.formatRupiah(sub)}</span>
                </div>
            `;
        }).join('');

        if (subtotalEl) subtotalEl.textContent = Utils.formatRupiah(total);
        if (totalEl) totalEl.textContent = Utils.formatRupiah(total);

        // Prepopulate profile name
        const currentUser = Auth.currentUser;
        if (currentUser) {
            const recipientInput = document.getElementById('checkout-recipient-name');
            if (recipientInput) recipientInput.value = currentUser.nama;
        }
    },

    processCheckout: function() {
        if (this.cart.length === 0) {
            Utils.showToast('Keranjang belanja masih kosong.', 'warning');
            return;
        }

        const paymentMethod = document.querySelector('input[name="checkout-payment"]:checked')?.value || 'transfer';
        const recipientName = document.getElementById('checkout-recipient-name')?.value || '';
        const recipientPhone = document.getElementById('checkout-recipient-phone')?.value || '';
        const recipientAddress = document.getElementById('checkout-recipient-address')?.value || '';
        const notes = document.getElementById('checkout-notes')?.value || '';

        if (!recipientName || !recipientPhone || !recipientAddress) {
            Utils.showToast('Harap isi semua kolom alamat penerima.', 'warning');
            return;
        }

        const items = this.cart.map(item => ({
            product_id: item.id,
            qty: item.qty
        }));

        const total = this.cart.reduce((sum, item) => sum + (parseFloat(item.harga_jual) * item.qty), 0);

        const payload = {
            customer_id: null,
            items: items,
            diskon: 0,
            bayar: total,
            metode_bayar: paymentMethod,
            catatan: `Alamat Kirim:\n${recipientName} (${recipientPhone})\n${recipientAddress}\n\nCatatan: ${notes}`
        };

        Utils.apiCall('transactions', 'POST', payload).then(res => {
            if (res.success) {
                // If payment method was Bank Transfer/QRIS, show instructions modal
                this.cart = [];
                this.saveCartToStorage();

                let payInstructions = '';
                if (paymentMethod === 'transfer') {
                    payInstructions = `
                        <div class="space-y-3 p-4 bg-brand-red/5 border border-brand-red/20 rounded-md">
                            <h4 class="text-sm font-bold text-brand-red">Instruksi Pembayaran Bank Transfer:</h4>
                            <p class="text-xs text-slate-400">Harap transfer sebesar <span class="font-bold text-slate-200">${Utils.formatRupiah(total)}</span> ke rekening berikut:</p>
                            <div class="bg-slate-950 p-3 rounded font-mono-numbers text-xs text-slate-200">
                                <div>Bank BCA: <strong>8010555123</strong></div>
                                <div>A/N: <strong>MotoStock Sparepart</strong></div>
                            </div>
                            <p class="text-[10px] text-slate-500">Konfirmasikan bukti transfer kepada admin kami melalui WhatsApp di WhatsApp: 0812-3456-789.</p>
                        </div>
                    `;
                } else if (paymentMethod === 'qris') {
                    payInstructions = `
                        <div class="space-y-3 p-4 bg-brand-red/5 border border-brand-red/20 rounded-md text-center">
                            <h4 class="text-sm font-bold text-brand-red">Scan QRIS MotoStock</h4>
                            <p class="text-xs text-slate-400">Silakan scan kode QRIS dan bayar senilai <span class="font-bold text-slate-200">${Utils.formatRupiah(total)}</span>:</p>
                            <div class="mx-auto w-40 h-40 bg-slate-900 border border-slate-800 rounded flex items-center justify-center text-slate-500">
                                <i data-lucide="qr-code" class="w-24 h-24 text-slate-300"></i>
                            </div>
                            <p class="text-[10px] text-slate-500">Bukti pembayaran otomatis tercatat oleh sistem kami.</p>
                        </div>
                    `;
                } else {
                    payInstructions = `<p class="text-xs text-slate-400">Silakan lakukan pembayaran tunai sebesar <span class="font-bold text-slate-200">${Utils.formatRupiah(total)}</span> saat mengambil barang di kasir fisik toko kami.</p>`;
                }

                Utils.showModal('Pesanan Berhasil Dibuat', `
                    <div class="space-y-4">
                        <div class="flex items-center space-x-2 text-green-500 mb-2">
                            <i data-lucide="check-circle-2" class="w-6 h-6"></i>
                            <span class="text-sm font-bold">Terima kasih atas pesanan Anda!</span>
                        </div>
                        <p class="text-xs text-slate-400">Nomor invoice Anda: <span class="font-bold text-slate-200 font-mono-numbers">${res.data.no_invoice}</span></p>
                        ${payInstructions}
                    </div>
                `, {
                    buttons: [
                        { text: 'Tutup & Lihat Pesanan Saya', class: 'bg-brand-red text-white hover:bg-brand-darkred', onclick: 'Utils.closeModal(); window.location.hash = "#store-orders";' }
                    ]
                });

            } else {
                Utils.showToast(res.message || 'Gagal membuat pesanan.', 'error');
            }
        }).catch(err => {
            console.error(err);
            Utils.showToast('Terjadi kesalahan jaringan.', 'error');
        });
    },

    renderOrders: function() {
        const tbody = document.getElementById('store-orders-table-body');
        if (!tbody) return;

        Utils.apiCall('transactions').then(res => {
            if (res.success && res.data) {
                const list = res.data;
                if (list.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-12 text-slate-500">Anda belum pernah melakukan pesanan. <a href="#store-catalog" class="text-brand-red font-bold hover:underline">Ayo Belanja!</a></td></tr>`;
                    return;
                }

                tbody.innerHTML = list.map((trx, index) => `
                    <tr>
                        <td class="px-4 py-3 text-xs text-center text-slate-400 font-mono-numbers">${index + 1}</td>
                        <td class="px-4 py-3 text-xs font-bold text-slate-300 font-mono-numbers">${Utils.escapeHtml(trx.no_invoice)}</td>
                        <td class="px-4 py-3 text-xs text-slate-400">${Utils.formatDateTime(trx.created_at)}</td>
                        <td class="px-4 py-3 text-xs text-center font-semibold text-slate-200 uppercase">${Utils.escapeHtml(trx.metode_bayar)}</td>
                        <td class="px-4 py-3 text-sm text-right font-semibold font-mono-numbers text-brand-red">${Utils.formatRupiah(trx.total)}</td>
                        <td class="px-4 py-3 text-center">
                            <button onclick="Store.showOrderDetail(${trx.id})" class="p-1 text-slate-400 hover:text-brand-red hover:bg-slate-850 rounded transition-colors" title="Lihat Detail"><i data-lucide="eye" class="w-4.5 h-4.5"></i></button>
                        </td>
                    </tr>
                `).join('');
                lucide.createIcons();
            } else {
                tbody.innerHTML = `<tr><td colspan="6" class="text-center py-6 text-red-500">Gagal memuat riwayat pesanan.</td></tr>`;
            }
        });
    },

    showOrderDetail: function(id) {
        Utils.apiCall(`transactions/${id}`).then(res => {
            if (res.success && res.data) {
                const trx = res.data;
                const itemsHtml = trx.items.map(item => `
                    <div class="py-2.5 flex justify-between items-center text-xs border-b border-slate-850">
                        <div>
                            <div class="font-semibold text-slate-200">${Utils.escapeHtml(item.nama_produk)}</div>
                            <div class="text-[9px] text-slate-400 font-mono-numbers">${item.qty} pcs x ${Utils.formatRupiah(item.harga)}</div>
                        </div>
                        <span class="font-mono-numbers text-slate-200 font-semibold">${Utils.formatRupiah(item.subtotal)}</span>
                    </div>
                `).join('');

                Utils.showModal(`Detail Pesanan: ${trx.no_invoice}`, `
                    <div class="space-y-4 max-h-[70vh] overflow-y-auto">
                        <div class="grid grid-cols-2 gap-4 text-xs">
                            <div>
                                <span class="block text-[9px] text-slate-400 uppercase tracking-widest">Tanggal Pesanan</span>
                                <span class="text-slate-200">${Utils.formatDateTime(trx.created_at)}</span>
                            </div>
                            <div>
                                <span class="block text-[9px] text-slate-400 uppercase tracking-widest">Metode Pembayaran</span>
                                <span class="text-slate-200 uppercase font-semibold">${Utils.escapeHtml(trx.metode_bayar)}</span>
                            </div>
                        </div>

                        <div class="border-t border-b border-slate-850 py-2">
                            <h5 class="text-[10px] font-bold text-brand-red uppercase tracking-wider mb-2">Item Pembelian</h5>
                            ${itemsHtml}
                        </div>

                        <div class="flex justify-between items-center text-sm font-bold text-slate-100">
                            <span>Total Pembayaran</span>
                            <span class="text-brand-red font-mono-numbers">${Utils.formatRupiah(trx.total)}</span>
                        </div>

                        <div class="p-3 bg-slate-900 border border-slate-800 rounded text-xs text-slate-400 space-y-1">
                            <span class="block text-[9px] text-slate-500 uppercase tracking-wider font-bold">Catatan / Detail Alamat Kirim</span>
                            <p class="whitespace-pre-wrap leading-relaxed">${Utils.escapeHtml(trx.catatan || '-')}</p>
                        </div>
                    </div>
                `, {
                    buttons: [{ text: 'Tutup', class: 'bg-slate-800 text-slate-200 hover:bg-slate-850', onclick: 'Utils.closeModal()' }]
                });
            }
        });
    },

    renderProfile: function() {
        const user = Auth.currentUser;
        if (!user) return;

        const nameInput = document.getElementById('store-profile-name');
        const usernameInput = document.getElementById('store-profile-username');
        const passInput = document.getElementById('store-profile-password');

        if (nameInput) nameInput.value = user.nama;
        if (usernameInput) usernameInput.value = user.username;
        if (passInput) passInput.value = '';
    },

    saveProfile: function() {
        const user = Auth.currentUser;
        if (!user) return;

        const nama = document.getElementById('store-profile-name').value;
        const password = document.getElementById('store-profile-password').value;

        const payload = {
            id: user.id,
            username: user.username,
            nama: nama,
            role: user.role,
            is_active: user.is_active
        };

        if (password) {
            payload.password = password;
        }

        Utils.apiCall('users', 'PUT', payload).then(res => {
            if (res.success) {
                Utils.showToast('Profil berhasil disimpan!', 'success');
                // Refresh authentication states
                Auth.checkAuth().then(userRes => {
                    if (userRes) {
                        App.currentUser = userRes;
                        document.getElementById('customer-display-name').textContent = userRes.nama;
                    }
                });
            } else {
                Utils.showToast(res.message || 'Gagal menyimpan profil.', 'error');
            }
        });
    },

    renderWishlist: function() {
        const grid = document.getElementById('wishlist-products-grid');
        if (!grid) return;

        if (this.wishlist.length === 0) {
            grid.innerHTML = '<div class="col-span-full text-center py-12 text-slate-500">Wishlist Anda masih kosong. <a href="#store-catalog" class="text-brand-red font-bold hover:underline">Saring Spare Part!</a></div>';
            return;
        }

        grid.innerHTML = this.wishlist.map(p => this.getProductCardHtml(p)).join('');
        lucide.createIcons();
    }
};