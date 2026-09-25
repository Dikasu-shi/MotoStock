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
                if (!this.categories || this.categories.length === 0) {
                    const seen = new Set();
                    const derived = [];
                    this.products.forEach(p => {
                        if (p.category_id && !seen.has(p.category_id)) {
                            seen.add(p.category_id);
                            derived.push({ id: p.category_id, nama: p.category_nama || ('Kategori ' + p.category_id) });
                        }
                    });
                    this.categories = derived;
                    this.renderCategoryOptions();
                }
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
        const imgUrl = p.image_url || p.image || ('images/products/' + (p.sku ? p.sku.toLowerCase() : '') + '.png');

        return `
            <div class="store-product-card glass-panel rounded-md overflow-hidden flex flex-col justify-between">
                <div class="p-4 flex-grow flex flex-col justify-between space-y-3">
                    <div class="flex justify-between items-start">
                        ${stockBadge}
                        <button onclick="Store.toggleWishlist(${p.id})" class="p-1 hover:bg-slate-850 rounded-full transition-colors" title="Wishlist">
                            <i data-lucide="heart" class="w-4 h-4 ${wishColor}"></i>
                        </button>
                    </div>
                    <div class="w-full h-36 bg-slate-850 rounded flex items-center justify-center p-2 relative overflow-hidden group">
                        <img src="${imgUrl}" alt="${Utils.escapeHtml(p.nama)}" class="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105" onerror="this.onerror=null; this.parentElement.innerHTML='<i data-lucide=\\'${iconName}\\' class=\\'w-10 h-10 text-slate-500\\'></i>'; lucide.createIcons();">
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
        const imgUrl = p.image_url || p.image || ('images/products/' + (p.sku ? p.sku.toLowerCase() : '') + '.png');

        container.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div class="w-full h-64 md:h-96 bg-slate-850 rounded-md flex items-center justify-center p-4 relative overflow-hidden">
                    <img src="${imgUrl}" alt="${Utils.escapeHtml(p.nama)}" class="max-h-full max-w-full object-contain" onerror="this.onerror=null; this.parentElement.innerHTML='<i data-lucide=\\'${iconName}\\' class=\\'w-20 h-20 text-slate-500\\'></i>'; lucide.createIcons();">
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

        // Initialize payment selection state
        this.onPaymentMethodChange('transfer');
    },

    bankAccounts: {
        'BCA': {
            bankName: 'Bank BCA',
            accNo: '8010555123',
            holder: 'MotoStock Sparepart'
        },
        'BRI': {
            bankName: 'Bank BRI',
            accNo: '1234567890',
            holder: 'MotoStock Sparepart'
        },
        'Mandiri': {
            bankName: 'Bank Mandiri',
            accNo: '9876543210',
            holder: 'MotoStock Sparepart'
        }
    },

    getBankAccount: function(bankKey) {
        if (!bankKey) return this.bankAccounts['BCA'];
        const key = bankKey.toString().toUpperCase().trim();
        if (key.includes('BRI')) return this.bankAccounts['BRI'];
        if (key.includes('MANDIRI')) return this.bankAccounts['Mandiri'];
        return this.bankAccounts['BCA'];
    },

    onPaymentMethodChange: function(method) {
        const bankContainer = document.getElementById('checkout-bank-selection-container');
        if (bankContainer) {
            if (method === 'transfer') {
                bankContainer.classList.remove('hidden');
            } else {
                bankContainer.classList.add('hidden');
            }
        }
    },

    processCheckout: function() {
        if (this.cart.length === 0) {
            Utils.showToast('Keranjang belanja masih kosong.', 'warning');
            return;
        }

        const paymentMethod = document.querySelector('input[name="checkout-payment"]:checked')?.value || 'transfer';
        let selectedBank = null;

        if (paymentMethod === 'transfer') {
            selectedBank = document.querySelector('input[name="checkout-bank"]:checked')?.value;
            if (!selectedBank) {
                Utils.showToast('Silakan pilih salah satu bank tujuan transfer (BCA, BRI, atau Mandiri).', 'warning');
                return;
            }
        }

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
            bank: selectedBank,
            catatan: `Alamat Kirim:\n${recipientName} (${recipientPhone})\n${recipientAddress}\n\nCatatan: ${notes}`
        };

        Utils.apiCall('transactions', 'POST', payload).then(res => {
            if (res.success) {
                const trxId = res.data.id;
                const noInvoice = res.data.no_invoice;

                this.cart = [];
                this.saveCartToStorage();

                let payInstructions = '';
                if (paymentMethod === 'transfer') {
                    const bankInfo = this.getBankAccount(selectedBank);
                    payInstructions = `
                        <div class="space-y-4">
                            <div class="p-4 bg-slate-900 border border-slate-800 rounded-md space-y-3">
                                <p class="text-xs font-semibold text-slate-200">Silakan transfer sesuai nominal ke rekening MotoStock.</p>
                                <div class="bg-slate-950 p-3.5 rounded-md border border-slate-850 space-y-2 text-xs">
                                    <div class="flex justify-between items-center text-slate-400">
                                        <span>Bank:</span>
                                        <span class="font-bold text-slate-100">${bankInfo.bankName}</span>
                                    </div>
                                    <div class="flex justify-between items-center text-slate-400">
                                        <span>Nomor Rekening:</span>
                                        <span class="font-mono-numbers font-bold text-base text-brand-red">${bankInfo.accNo}</span>
                                    </div>
                                    <div class="flex justify-between items-center text-slate-400">
                                        <span>Nama Pemilik Rekening:</span>
                                        <span class="font-semibold text-slate-100">${bankInfo.holder}</span>
                                    </div>
                                    <div class="flex justify-between items-center text-slate-400 border-t border-slate-850 pt-2">
                                        <span>Nominal yang Harus Dibayar:</span>
                                        <span class="font-mono-numbers font-bold text-sm text-amber-400">${Utils.formatRupiah(total)}</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Upload Bukti Pembayaran Interactive Section -->
                            <div id="checkout-upload-section-${trxId}" class="p-4 bg-amber-500/10 border border-amber-500/20 rounded-md space-y-3">
                                <div class="flex items-center justify-between">
                                    <span class="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center">
                                        <i data-lucide="upload-cloud" class="w-4 h-4 mr-1.5"></i> Bukti Pembayaran
                                    </span>
                                    <span class="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded">JPG, JPEG, PNG, PDF</span>
                                </div>

                                <!-- Hidden File Input -->
                                <input type="file" id="checkout-file-input-${trxId}" accept=".jpg,.jpeg,.png,.pdf" class="hidden" onchange="Store.onProofFileSelected(${trxId}, 'checkout-file-input-${trxId}', 'checkout-file-display-${trxId}', 'checkout-file-name-${trxId}', 'checkout-btn-submit-${trxId}')">

                                <!-- Initial Upload Button triggers file picker -->
                                <button type="button" onclick="document.getElementById('checkout-file-input-${trxId}').click()" class="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-md border border-slate-700 transition-colors flex items-center justify-center">
                                    <i data-lucide="file-plus" class="w-4 h-4 mr-1.5 text-brand-red"></i> Upload Bukti Pembayaran
                                </button>

                                <!-- Display Selected File Name -->
                                <div id="checkout-file-display-${trxId}" class="hidden p-2.5 bg-slate-950 rounded border border-slate-800 text-xs text-slate-200 flex items-center justify-between">
                                    <div class="flex items-center space-x-2 truncate">
                                        <i data-lucide="file-check" class="w-4 h-4 text-emerald-400 flex-shrink-0"></i>
                                        <span class="truncate font-mono-numbers" id="checkout-file-name-${trxId}"></span>
                                    </div>
                                    <button type="button" onclick="Store.clearSelectedProofFile('checkout-file-input-${trxId}', 'checkout-file-display-${trxId}', 'checkout-btn-submit-${trxId}')" class="text-slate-400 hover:text-red-400 ml-2" title="Ganti File">
                                        <i data-lucide="x" class="w-4 h-4"></i>
                                    </button>
                                </div>

                                <!-- Kirim Bukti Pembayaran Button -->
                                <button type="button" id="checkout-btn-submit-${trxId}" onclick="Store.submitProofUpload(${trxId}, 'checkout-file-input-${trxId}', 'checkout-upload-section-${trxId}', 'checkout-btn-submit-${trxId}')" class="hidden w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-md transition-colors flex items-center justify-center shadow">
                                    <i data-lucide="send" class="w-3.5 h-3.5 mr-1.5"></i> Kirim Bukti Pembayaran
                                </button>
                            </div>
                        </div>
                    `;
                } else if (paymentMethod === 'qris') {
                    payInstructions = `
                        <div class="space-y-4">
                            <div class="p-4 bg-slate-900 border border-slate-800 rounded-md text-center space-y-3">
                                <h4 class="text-xs font-bold text-slate-200 uppercase tracking-wider">Scan QRIS MotoStock</h4>
                                <p class="text-xs text-slate-400">Silakan scan kode QRIS dan bayar senilai <span class="font-bold text-slate-100 font-mono-numbers">${Utils.formatRupiah(total)}</span>:</p>
                                <div class="mx-auto w-36 h-36 bg-slate-950 border border-slate-800 rounded flex items-center justify-center text-slate-400">
                                    <i data-lucide="qr-code" class="w-24 h-24 text-slate-300"></i>
                                </div>
                            </div>

                            <div id="checkout-upload-section-${trxId}" class="p-4 bg-amber-500/10 border border-amber-500/20 rounded-md space-y-3">
                                <div class="flex items-center justify-between">
                                    <span class="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center">
                                        <i data-lucide="upload-cloud" class="w-4 h-4 mr-1.5"></i> Upload Bukti Pembayaran QRIS
                                    </span>
                                </div>
                                <input type="file" id="checkout-file-input-${trxId}" accept=".jpg,.jpeg,.png,.pdf" class="hidden" onchange="Store.onProofFileSelected(${trxId}, 'checkout-file-input-${trxId}', 'checkout-file-display-${trxId}', 'checkout-file-name-${trxId}', 'checkout-btn-submit-${trxId}')">
                                <button type="button" onclick="document.getElementById('checkout-file-input-${trxId}').click()" class="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-md border border-slate-700 transition-colors flex items-center justify-center">
                                    <i data-lucide="file-plus" class="w-4 h-4 mr-1.5 text-brand-red"></i> Upload Bukti Pembayaran
                                </button>
                                <div id="checkout-file-display-${trxId}" class="hidden p-2.5 bg-slate-950 rounded border border-slate-800 text-xs text-slate-200 flex items-center justify-between">
                                    <div class="flex items-center space-x-2 truncate">
                                        <i data-lucide="file-check" class="w-4 h-4 text-emerald-400 flex-shrink-0"></i>
                                        <span class="truncate font-mono-numbers" id="checkout-file-name-${trxId}"></span>
                                    </div>
                                    <button type="button" onclick="Store.clearSelectedProofFile('checkout-file-input-${trxId}', 'checkout-file-display-${trxId}', 'checkout-btn-submit-${trxId}')" class="text-slate-400 hover:text-red-400 ml-2" title="Ganti File">
                                        <i data-lucide="x" class="w-4 h-4"></i>
                                    </button>
                                </div>
                                <button type="button" id="checkout-btn-submit-${trxId}" onclick="Store.submitProofUpload(${trxId}, 'checkout-file-input-${trxId}', 'checkout-upload-section-${trxId}', 'checkout-btn-submit-${trxId}')" class="hidden w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-md transition-colors flex items-center justify-center shadow">
                                    <i data-lucide="send" class="w-3.5 h-3.5 mr-1.5"></i> Kirim Bukti Pembayaran
                                </button>
                            </div>
                        </div>
                    `;
                } else {
                    payInstructions = `
                        <div class="p-4 bg-slate-900 border border-slate-800 rounded-md text-xs text-slate-300 space-y-2">
                            <p>Silakan lakukan pembayaran tunai sebesar <span class="font-bold text-slate-100 font-mono-numbers">${Utils.formatRupiah(total)}</span> saat mengambil barang di kasir toko fisik MotoStock.</p>
                        </div>
                    `;
                }

                const modalHtml = `
                    <div class="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
                        <div class="flex items-center space-x-2 text-emerald-500">
                            <i data-lucide="check-circle-2" class="w-6 h-6 flex-shrink-0"></i>
                            <span class="text-sm font-bold">Pesanan Anda Berhasil Dibuat!</span>
                        </div>
                        <div class="text-xs text-slate-400">Nomor Invoice: <span class="font-bold text-slate-100 font-mono-numbers">${noInvoice}</span></div>
                        ${payInstructions}
                    </div>
                `;

                const footerButtonsHtml = `
                    <div class="flex justify-end space-x-2 w-full">
                        <button type="button" onclick="Utils.closeModal(); window.location.hash = '#store-orders';" class="px-4 py-2 bg-brand-red hover:bg-brand-darkred text-white text-xs font-semibold rounded-md transition-colors shadow-sm">
                            Tutup & Lihat Pesanan Saya
                        </button>
                    </div>
                `;

                Utils.showModal('Pesanan Berhasil Dibuat', modalHtml, footerButtonsHtml);

            } else {
                Utils.showToast(res.message || 'Gagal membuat pesanan.', 'error');
            }
        }).catch(err => {
            console.error(err);
            Utils.showToast('Terjadi kesalahan jaringan.', 'error');
        });
    },

    onProofFileSelected: function(trxId, inputId, displayContainerId, nameTextId, submitBtnId) {
        const input = document.getElementById(inputId);
        const displayContainer = document.getElementById(displayContainerId);
        const nameText = document.getElementById(nameTextId);
        const submitBtn = document.getElementById(submitBtnId);

        if (!input || !input.files || input.files.length === 0) {
            if (displayContainer) displayContainer.classList.add('hidden');
            if (submitBtn) submitBtn.classList.add('hidden');
            return;
        }

        const file = input.files[0];
        const allowedExts = ['jpg', 'jpeg', 'png', 'pdf'];
        const ext = file.name.split('.').pop().toLowerCase();

        if (!allowedExts.includes(ext)) {
            Utils.showToast('Format file tidak didukung. Gunakan file JPG, JPEG, PNG, atau PDF.', 'error');
            input.value = '';
            if (displayContainer) displayContainer.classList.add('hidden');
            if (submitBtn) submitBtn.classList.add('hidden');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            Utils.showToast('Ukuran file bukti pembayaran maksimal 5MB.', 'error');
            input.value = '';
            if (displayContainer) displayContainer.classList.add('hidden');
            if (submitBtn) submitBtn.classList.add('hidden');
            return;
        }

        if (nameText) nameText.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
        if (displayContainer) displayContainer.classList.remove('hidden');
        if (submitBtn) submitBtn.classList.remove('hidden');
        lucide.createIcons();
    },

    clearSelectedProofFile: function(inputId, displayContainerId, submitBtnId) {
        const input = document.getElementById(inputId);
        if (input) input.value = '';
        const displayContainer = document.getElementById(displayContainerId);
        if (displayContainer) displayContainer.classList.add('hidden');
        const submitBtn = document.getElementById(submitBtnId);
        if (submitBtn) submitBtn.classList.add('hidden');
    },

    submitProofUpload: function(trxId, inputId, sectionContainerId, submitBtnId) {
        const input = document.getElementById(inputId);
        if (!input || !input.files || input.files.length === 0) {
            Utils.showToast('Pilih file bukti pembayaran terlebih dahulu.', 'warning');
            return;
        }

        const file = input.files[0];
        const submitBtn = document.getElementById(submitBtnId);
        if (submitBtn) Utils.setLoading(submitBtn, true, 'Mengirim...');

        const formData = new FormData();
        formData.append('bukti_bayar', file);

        Utils.apiCall(`transactions/${trxId}/upload-proof`, 'POST', formData).then(res => {
            if (res.success) {
                Utils.showToast('Bukti pembayaran berhasil dikirim dan sedang menunggu verifikasi.', 'success');
                const section = document.getElementById(sectionContainerId);
                if (section) {
                    section.className = 'p-4 bg-sky-500/10 border border-sky-500/20 rounded-md text-xs space-y-2';
                    section.innerHTML = `
                        <div class="flex items-start space-x-2.5">
                            <i data-lucide="clock" class="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5"></i>
                            <div>
                                <div class="font-bold text-sky-300">Bukti pembayaran berhasil dikirim dan sedang menunggu verifikasi.</div>
                                <div class="text-[11px] text-sky-200/80 mt-1">
                                    File: <strong class="font-mono-numbers text-slate-100">${Utils.escapeHtml(file.name)}</strong>
                                </div>
                                <div class="text-[10px] text-slate-400 mt-0.5">Status Pembayaran: <strong class="text-sky-300">Menunggu Konfirmasi</strong></div>
                            </div>
                        </div>
                    `;
                    lucide.createIcons();
                }
                this.renderOrders();
            } else {
                Utils.showToast(res.message || 'Gagal mengirim bukti pembayaran.', 'error');
                if (submitBtn) Utils.setLoading(submitBtn, false, 'Kirim Bukti Pembayaran');
            }
        }).catch(err => {
            console.error(err);
            Utils.showToast('Gagal mengirim bukti pembayaran ke server.', 'error');
            if (submitBtn) Utils.setLoading(submitBtn, false, 'Kirim Bukti Pembayaran');
        });
    },

    getPaymentStatusBadge: function(status) {
        status = status || 'Menunggu Pembayaran';
        if (status === 'Dibayar') {
            return `<span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><i data-lucide="check-circle-2" class="w-3 h-3 mr-1"></i> Dibayar</span>`;
        }
        if (status === 'Menunggu Konfirmasi') {
            return `<span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20"><i data-lucide="clock" class="w-3 h-3 mr-1"></i> Menunggu Konfirmasi</span>`;
        }
        if (status === 'Ditolak') {
            return `<span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20"><i data-lucide="x-circle" class="w-3 h-3 mr-1"></i> Ditolak</span>`;
        }
        return `<span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20"><i data-lucide="clock" class="w-3 h-3 mr-1"></i> Menunggu Pembayaran</span>`;
    },

    getOrderStatusBadge: function(status) {
        status = status || 'Menunggu Pembayaran';
        if (status === 'Selesai') {
            return `<span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><i data-lucide="check" class="w-3 h-3 mr-1"></i> Selesai</span>`;
        }
        if (status === 'Diproses') {
            return `<span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20"><i data-lucide="package" class="w-3 h-3 mr-1"></i> Diproses</span>`;
        }
        if (status === 'Dibatalkan') {
            return `<span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20"><i data-lucide="slash" class="w-3 h-3 mr-1"></i> Dibatalkan</span>`;
        }
        return `<span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">Menunggu Pembayaran</span>`;
    },

    renderOrders: function() {
        const tbody = document.getElementById('store-orders-table-body');
        if (!tbody) return;

        Utils.apiCall('transactions').then(res => {
            if (res.success && res.data) {
                const list = res.data;
                if (list.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-12 text-slate-500">Anda belum pernah melakukan pesanan. <a href="#store-catalog" class="text-brand-red font-bold hover:underline">Ayo Belanja!</a></td></tr>`;
                    return;
                }

                tbody.innerHTML = list.map((trx, index) => `
                    <tr class="hover:bg-slate-850/40 transition-colors">
                        <td class="px-4 py-3 text-xs text-center text-slate-400 font-mono-numbers">${index + 1}</td>
                        <td class="px-4 py-3 text-xs font-bold text-slate-200 font-mono-numbers">${Utils.escapeHtml(trx.no_invoice)}</td>
                        <td class="px-4 py-3 text-xs text-slate-400">${Utils.formatDateTime(trx.created_at)}</td>
                        <td class="px-4 py-3 text-xs text-center font-semibold text-slate-300 uppercase">${trx.metode_bayar === 'transfer' ? `Transfer (${trx.bank || 'BCA'})` : Utils.escapeHtml(trx.metode_bayar)}</td>
                        <td class="px-4 py-3 text-center">${this.getPaymentStatusBadge(trx.status_pembayaran)}</td>
                        <td class="px-4 py-3 text-center">${this.getOrderStatusBadge(trx.status_pesanan)}</td>
                        <td class="px-4 py-3 text-sm text-right font-semibold font-mono-numbers text-brand-red">${Utils.formatRupiah(trx.total)}</td>
                        <td class="px-4 py-3 text-center">
                            <button onclick="Store.showOrderDetail(${trx.id})" class="px-2.5 py-1 text-xs bg-slate-850 hover:bg-brand-red hover:text-white text-slate-300 border border-slate-800 rounded transition-colors font-medium" title="Lihat Detail">
                                Detail
                            </button>
                        </td>
                    </tr>
                `).join('');
                lucide.createIcons();
            } else {
                tbody.innerHTML = `<tr><td colspan="8" class="text-center py-6 text-red-500">Gagal memuat riwayat pesanan.</td></tr>`;
            }
        });
    },

    showOrderDetail: function(id) {
        Utils.apiCall(`transactions/${id}`).then(res => {
            if (res.success && res.data) {
                const trx = res.data;
                const statusPembayaran = trx.status_pembayaran || 'Menunggu Pembayaran';
                const statusPesanan = trx.status_pesanan || 'Menunggu Pembayaran';

                const itemsHtml = (trx.items || []).map(item => `
                    <div class="py-2.5 flex justify-between items-center text-xs border-b border-slate-850">
                        <div>
                            <div class="font-semibold text-slate-200">${Utils.escapeHtml(item.nama_produk)}</div>
                            <div class="text-[9px] text-slate-400 font-mono-numbers">${item.qty} pcs x ${Utils.formatRupiah(item.harga)}</div>
                        </div>
                        <span class="font-mono-numbers text-slate-200 font-semibold">${Utils.formatRupiah(item.subtotal)}</span>
                    </div>
                `).join('');

                let paymentActionSection = '';

                if (statusPembayaran === 'Menunggu Pembayaran') {
                    let bankInfo = '';
                    if (trx.metode_bayar === 'transfer') {
                        const bankObj = this.getBankAccount(trx.bank);
                        bankInfo = `
                            <div class="bg-slate-950 p-3.5 rounded-md border border-slate-850 space-y-1.5 text-xs">
                                <p class="text-[11px] text-slate-400 mb-1">Silakan transfer sesuai nominal ke rekening MotoStock:</p>
                                <div class="flex justify-between items-center text-slate-300">
                                    <span>Bank:</span>
                                    <span class="font-bold text-slate-100">${bankObj.bankName}</span>
                                </div>
                                <div class="flex justify-between items-center text-slate-300">
                                    <span>Nomor Rekening:</span>
                                    <span class="font-mono-numbers font-bold text-base text-brand-red">${bankObj.accNo}</span>
                                </div>
                                <div class="flex justify-between items-center text-slate-300">
                                    <span>Nama Pemilik Rekening:</span>
                                    <span class="font-semibold text-slate-100">${bankObj.holder}</span>
                                </div>
                                <div class="flex justify-between items-center text-slate-300 border-t border-slate-850 pt-2">
                                    <span>Nominal yang Harus Dibayar:</span>
                                    <span class="font-mono-numbers font-bold text-sm text-amber-400">${Utils.formatRupiah(trx.total)}</span>
                                </div>
                            </div>
                        `;
                    } else if (trx.metode_bayar === 'qris') {
                        bankInfo = `
                            <div class="bg-slate-950 p-3 rounded-md text-xs text-slate-200 text-center space-y-2">
                                <div class="text-slate-400 text-[11px]">Scan QRIS & bayar sejumlah <strong class="text-amber-400 font-mono-numbers">${Utils.formatRupiah(trx.total)}</strong>:</div>
                                <div class="w-32 h-32 mx-auto bg-slate-900 border border-slate-800 rounded flex items-center justify-center">
                                    <i data-lucide="qr-code" class="w-20 h-20 text-slate-300"></i>
                                </div>
                            </div>
                        `;
                    } else {
                        bankInfo = `
                            <div class="bg-slate-950 p-3 rounded-md text-xs text-slate-300">
                                Silakan lakukan pembayaran senilai <strong class="text-amber-400 font-mono-numbers">${Utils.formatRupiah(trx.total)}</strong> di kasir toko MotoStock.
                            </div>
                        `;
                    }

                    paymentActionSection = `
                        <div id="order-upload-section-${trx.id}" class="p-4 bg-amber-500/10 border border-amber-500/20 rounded-md space-y-3">
                            <div class="flex items-center justify-between">
                                <span class="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center">
                                    <i data-lucide="credit-card" class="w-4 h-4 mr-1.5"></i> Informasi Pembayaran
                                </span>
                                <span class="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded">Menunggu Pembayaran</span>
                            </div>
                            ${bankInfo}

                            <div class="pt-2 border-t border-amber-500/20 space-y-2">
                                <label class="block text-[11px] font-bold text-slate-200 uppercase tracking-wider">Upload Bukti Pembayaran</label>

                                <input type="file" id="order-file-input-${trx.id}" accept=".jpg,.jpeg,.png,.pdf" class="hidden" onchange="Store.onProofFileSelected(${trx.id}, 'order-file-input-${trx.id}', 'order-file-display-${trx.id}', 'order-file-name-${trx.id}', 'order-btn-submit-${trx.id}')">

                                <button type="button" onclick="document.getElementById('order-file-input-${trx.id}').click()" class="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-md border border-slate-700 transition-colors flex items-center justify-center">
                                    <i data-lucide="file-plus" class="w-4 h-4 mr-1.5 text-brand-red"></i> Upload Bukti Pembayaran
                                </button>

                                <div id="order-file-display-${trx.id}" class="hidden p-2.5 bg-slate-950 rounded border border-slate-800 text-xs text-slate-200 flex items-center justify-between">
                                    <div class="flex items-center space-x-2 truncate">
                                        <i data-lucide="file-check" class="w-4 h-4 text-emerald-400 flex-shrink-0"></i>
                                        <span class="truncate font-mono-numbers" id="order-file-name-${trx.id}"></span>
                                    </div>
                                    <button type="button" onclick="Store.clearSelectedProofFile('order-file-input-${trx.id}', 'order-file-display-${trx.id}', 'order-btn-submit-${trx.id}')" class="text-slate-400 hover:text-red-400 ml-2" title="Ganti File">
                                        <i data-lucide="x" class="w-4 h-4"></i>
                                    </button>
                                </div>

                                <button type="button" id="order-btn-submit-${trx.id}" onclick="Store.submitProofUpload(${trx.id}, 'order-file-input-${trx.id}', 'order-upload-section-${trx.id}', 'order-btn-submit-${trx.id}')" class="hidden w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-md transition-colors flex items-center justify-center shadow">
                                    <i data-lucide="send" class="w-3.5 h-3.5 mr-1.5"></i> Kirim Bukti Pembayaran
                                </button>
                            </div>
                        </div>
                    `;
                } else if (statusPembayaran === 'Menunggu Konfirmasi') {
                    paymentActionSection = `
                        <div class="p-4 bg-sky-500/10 border border-sky-500/20 rounded-md text-xs space-y-3">
                            <div class="flex items-start space-x-2.5">
                                <i data-lucide="clock" class="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5"></i>
                                <div class="space-y-1">
                                    <div class="font-bold text-sky-300 text-sm">Bukti pembayaran berhasil dikirim dan sedang menunggu verifikasi.</div>
                                    <div class="text-[11px] text-sky-200/80 leading-relaxed">
                                        Tim Admin/Kasir MotoStock sedang memeriksa dan memverifikasi pembayaran Anda.
                                    </div>
                                </div>
                            </div>

                            <div class="bg-slate-950/80 p-3 rounded-md border border-sky-500/20 space-y-2">
                                <div class="flex items-center justify-between text-[11px]">
                                    <span class="text-slate-400">File Bukti:</span>
                                    <span class="font-mono-numbers font-semibold text-slate-200 truncate max-w-[200px]">${Utils.escapeHtml(trx.bukti_bayar_original_name || 'bukti_transfer')}</span>
                                </div>
                                <div class="flex items-center justify-between text-[11px]">
                                    <span class="text-slate-400">Waktu Kirim:</span>
                                    <span class="font-mono-numbers text-slate-300">${trx.bukti_bayar_at ? Utils.formatDateTime(trx.bukti_bayar_at) : '-'}</span>
                                </div>
                                <button type="button" onclick="Store.viewProof(${trx.id}, '${Utils.escapeHtml(trx.bukti_bayar_original_name || 'bukti_bayar')}')" class="w-full mt-1 py-1.5 bg-slate-850 hover:bg-slate-800 text-sky-300 border border-slate-800 rounded text-xs font-semibold flex items-center justify-center transition-colors">
                                    <i data-lucide="eye" class="w-3.5 h-3.5 mr-1.5"></i> Lihat Bukti Pembayaran
                                </button>
                            </div>
                        </div>
                    `;
                } else if (statusPembayaran === 'Dibayar') {
                    paymentActionSection = `
                        <div class="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-xs space-y-2.5">
                            <div class="flex items-start space-x-2.5">
                                <i data-lucide="check-circle-2" class="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5"></i>
                                <div class="space-y-0.5">
                                    <div class="font-bold text-emerald-300 text-sm">Pembayaran telah dikonfirmasi.</div>
                                    <div class="text-[11px] text-emerald-200/80 leading-relaxed">
                                        Status pesanan: <strong class="text-emerald-300 uppercase">${statusPesanan}</strong>. Tim MotoStock sedang menyiapkan suku cadang Anda.
                                    </div>
                                </div>
                            </div>
                            ${trx.bukti_bayar ? `
                                <button type="button" onclick="Store.viewProof(${trx.id}, '${Utils.escapeHtml(trx.bukti_bayar_original_name || 'bukti_bayar')}')" class="w-full py-1.5 bg-slate-950 hover:bg-slate-900 text-emerald-400 border border-emerald-500/20 rounded text-xs font-semibold flex items-center justify-center transition-colors">
                                    <i data-lucide="file-check" class="w-3.5 h-3.5 mr-1.5"></i> Lihat Bukti Pembayaran Terverifikasi
                                </button>
                            ` : ''}
                        </div>
                    `;
                } else if (statusPembayaran === 'Ditolak') {
                    paymentActionSection = `
                        <div id="order-upload-section-retry-${trx.id}" class="p-4 bg-red-500/10 border border-red-500/20 rounded-md text-xs space-y-3">
                            <div class="flex items-start space-x-2.5">
                                <i data-lucide="alert-circle" class="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5"></i>
                                <div class="space-y-1">
                                    <div class="font-bold text-red-300 text-sm">Pembayaran ditolak.</div>
                                    <div class="text-[11px] text-red-200/80 leading-relaxed">
                                        Alasan: <strong class="text-red-200">${Utils.escapeHtml(trx.catatan_penolakan || 'Bukti pembayaran tidak sesuai atau transfer belum masuk.')}</strong>
                                    </div>
                                </div>
                            </div>

                            <div class="pt-2 border-t border-red-500/20 space-y-2">
                                <label class="block text-[11px] font-bold text-slate-200 uppercase tracking-wider">Upload Bukti Pembayaran Baru</label>
                                <input type="file" id="order-file-input-retry-${trx.id}" accept=".jpg,.jpeg,.png,.pdf" class="hidden" onchange="Store.onProofFileSelected(${trx.id}, 'order-file-input-retry-${trx.id}', 'order-file-display-retry-${trx.id}', 'order-file-name-retry-${trx.id}', 'order-btn-submit-retry-${trx.id}')">

                                <button type="button" onclick="document.getElementById('order-file-input-retry-${trx.id}').click()" class="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-md border border-slate-700 transition-colors flex items-center justify-center">
                                    <i data-lucide="file-plus" class="w-4 h-4 mr-1.5 text-brand-red"></i> Pilih File Bukti Baru
                                </button>

                                <div id="order-file-display-retry-${trx.id}" class="hidden p-2.5 bg-slate-950 rounded border border-slate-800 text-xs text-slate-200 flex items-center justify-between">
                                    <div class="flex items-center space-x-2 truncate">
                                        <i data-lucide="file-check" class="w-4 h-4 text-emerald-400 flex-shrink-0"></i>
                                        <span class="truncate font-mono-numbers" id="order-file-name-retry-${trx.id}"></span>
                                    </div>
                                    <button type="button" onclick="Store.clearSelectedProofFile('order-file-input-retry-${trx.id}', 'order-file-display-retry-${trx.id}', 'order-btn-submit-retry-${trx.id}')" class="text-slate-400 hover:text-red-400 ml-2" title="Ganti File">
                                        <i data-lucide="x" class="w-4 h-4"></i>
                                    </button>
                                </div>

                                <button type="button" id="order-btn-submit-retry-${trx.id}" onclick="Store.submitProofUpload(${trx.id}, 'order-file-input-retry-${trx.id}', 'order-upload-section-retry-${trx.id}', 'order-btn-submit-retry-${trx.id}')" class="hidden w-full py-2.5 bg-brand-red hover:bg-brand-darkred text-white text-xs font-bold rounded-md transition-colors flex items-center justify-center shadow">
                                    <i data-lucide="send" class="w-3.5 h-3.5 mr-1.5"></i> Kirim Bukti Pembayaran Baru
                                </button>
                            </div>
                        </div>
                    `;
                }

                const contentHtml = `
                    <div class="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
                        <!-- Status Badges Header -->
                        <div class="grid grid-cols-2 gap-3 bg-slate-900/80 p-3 rounded-md border border-slate-800 text-xs">
                            <div>
                                <span class="block text-[9px] text-slate-400 uppercase tracking-widest font-semibold mb-1">Status Pembayaran</span>
                                <div>${this.getPaymentStatusBadge(statusPembayaran)}</div>
                            </div>
                            <div>
                                <span class="block text-[9px] text-slate-400 uppercase tracking-widest font-semibold mb-1">Status Pesanan</span>
                                <div>${this.getOrderStatusBadge(statusPesanan)}</div>
                            </div>
                        </div>

                        <!-- Date & Payment Method -->
                        <div class="grid grid-cols-2 gap-3 text-xs bg-slate-950/60 p-3 rounded-md border border-slate-850">
                            <div>
                                <span class="block text-[9px] text-slate-400 uppercase tracking-widest">Tanggal Pesanan</span>
                                <span class="text-slate-200 font-mono-numbers font-medium">${Utils.formatDateTime(trx.created_at)}</span>
                            </div>
                            <div>
                                <span class="block text-[9px] text-slate-400 uppercase tracking-widest">Metode Pembayaran</span>
                                <span class="text-slate-200 uppercase font-semibold">${trx.metode_bayar === 'transfer' ? `Transfer (${trx.bank || 'BCA'})` : (trx.metode_bayar === 'qris' ? 'QRIS' : 'Tunai')}</span>
                            </div>
                        </div>

                        <!-- Payment instructions / Interactive action banner -->
                        ${paymentActionSection}

                        <!-- Items List -->
                        <div class="border-t border-b border-slate-850 py-2">
                            <h5 class="text-[10px] font-bold text-brand-red uppercase tracking-wider mb-2">Item Pembelian (${trx.items ? trx.items.length : 0})</h5>
                            ${itemsHtml}
                        </div>

                        <!-- Total Summary -->
                        <div class="space-y-1.5 text-xs">
                            <div class="flex justify-between text-slate-400">
                                <span>Subtotal Produk:</span>
                                <span class="font-mono-numbers text-slate-200">${Utils.formatRupiah(trx.subtotal)}</span>
                            </div>
                            ${parseFloat(trx.diskon) > 0 ? `
                                <div class="flex justify-between text-red-400">
                                    <span>Potongan Diskon:</span>
                                    <span class="font-mono-numbers">-${Utils.formatRupiah(trx.diskon)}</span>
                                </div>
                            ` : ''}
                            <div class="flex justify-between items-center text-sm font-bold text-slate-100 border-t border-slate-850 pt-2">
                                <span>Total Tagihan:</span>
                                <span class="text-brand-red font-mono-numbers text-base">${Utils.formatRupiah(trx.total)}</span>
                            </div>
                        </div>

                        <!-- Address & Notes -->
                        <div class="p-3 bg-slate-900 border border-slate-800 rounded text-xs text-slate-400 space-y-1">
                            <span class="block text-[9px] text-slate-500 uppercase tracking-wider font-bold">Alamat Kirim / Catatan</span>
                            <p class="whitespace-pre-wrap leading-relaxed text-slate-300">${Utils.escapeHtml(trx.catatan || '-')}</p>
                        </div>
                    </div>
                `;

                const modalFooterHtml = `
                    <div class="flex justify-end space-x-2 w-full">
                        <button type="button" class="px-4 py-2 bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs font-semibold rounded-md transition-colors" onclick="Utils.closeModal()">Tutup</button>
                    </div>
                `;

                Utils.showModal(`Detail Pesanan: ${trx.no_invoice}`, contentHtml, modalFooterHtml);
            } else {
                Utils.showToast('Gagal memuat detail pesanan.', 'error');
            }
        }).catch(err => {
            console.error(err);
            Utils.showToast('Terjadi kesalahan memuat detail pesanan.', 'error');
        });
    },

    viewProof: function(transactionId, filename) {
        const url = `api/transactions/${transactionId}/proof`;
        const isPdf = (filename || '').toLowerCase().endsWith('.pdf');

        if (isPdf) {
            window.open(url, '_blank');
            return;
        }

        // Image modal preview
        const imgModalHtml = `
            <div class="flex flex-col items-center justify-center p-2 space-y-3">
                <div class="max-h-[65vh] max-w-full overflow-hidden rounded bg-slate-950 flex items-center justify-center border border-slate-800">
                    <img src="${url}" alt="Bukti Pembayaran" class="max-h-[60vh] max-w-full object-contain rounded" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'p-8 text-center text-slate-500 text-xs\\'>Gagal memuat preview gambar. <a href=\\'${url}\\' target=\\'_blank\\' class=\\'text-brand-red font-bold underline\\'>Buka File</a></div>';">
                </div>
                <div class="text-[11px] text-slate-400 font-mono-numbers">${Utils.escapeHtml(filename || '')}</div>
            </div>
        `;

        const imgModalFooterHtml = `
            <div class="flex justify-end space-x-2 w-full">
                <button type="button" class="px-4 py-2 bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs font-semibold rounded-md" onclick="window.open('${url}', '_blank')">Buka di Tab Baru</button>
                <button type="button" class="px-4 py-2 bg-brand-red text-white hover:bg-brand-darkred text-xs font-semibold rounded-md" onclick="Utils.closeModal()">Tutup</button>
            </div>
        `;

        Utils.showModal(`Bukti Pembayaran: ${filename || 'Foto Bukti'}`, imgModalHtml, imgModalFooterHtml);
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