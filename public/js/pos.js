// POS (Point of Sale) Module for MyKasir

const POS = {
    cart: [],
    products: [],
    categories: [],
    customers: [],
    selectedCustomerId: '',
    selectedCategoryFilter: '',
    searchQuery: '',

    init: async function() {
        this.cart = [];
        this.selectedCustomerId = '';
        this.selectedCategoryFilter = '';
        this.searchQuery = '';

        // Clear DOM elements
        document.getElementById('pos-search').value = '';
        document.getElementById('pos-diskon-input').value = '0';
        document.getElementById('pos-bayar-input').value = '';
        document.getElementById('pos-catatan').value = '';
        document.getElementById('pos-total-display').textContent = 'Rp 0';
        document.getElementById('pos-kembalian-display').textContent = 'Rp 0';

        // Register events
        this.registerEvents();

        // Fetch initialization data
        await this.loadInitialData();
    },

    registerEvents: function() {
        const searchInput = document.getElementById('pos-search');
        if (searchInput) {
            // Debounce keyboard entries for search
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.searchQuery = e.target.value.trim();
                this.filterAndRenderProducts();
            }, 300));
        }

        const diskonInput = document.getElementById('pos-diskon-input');
        if (diskonInput) {
            diskonInput.addEventListener('input', () => this.calculateTotals());
        }

        const bayarInput = document.getElementById('pos-bayar-input');
        if (bayarInput) {
            bayarInput.addEventListener('input', () => this.calculateTotals());
        }

        const btnClear = document.getElementById('pos-clear-btn');
        if (btnClear) {
            btnClear.onclick = () => {
                if (this.cart.length > 0) {
                    if (confirm('Kosongkan keranjang belanja?')) {
                        this.clearCart();
                    }
                }
            };
        }

        const btnBayar = document.getElementById('btn-proses-bayar');
        if (btnBayar) {
            btnBayar.onclick = () => this.processPayment();
        }
    },

    loadInitialData: async function() {
        // Load categories
        const catRes = await Utils.apiCall('categories');
        if (catRes.success) {
            this.categories = catRes.data;
            this.renderCategoryChips();
        }

        // Load customers
        const custRes = await Utils.apiCall('customers');
        if (custRes.success) {
            this.customers = custRes.data;
            this.populateCustomerSelect();
        }

        // Load active products
        const prodRes = await Utils.apiCall('products');
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
                this.renderCategoryChips();
            }
            this.filterAndRenderProducts();
        }
    },

    // Category filter chips generator
    renderCategoryChips: function() {
        const container = document.getElementById('pos-category-chips');
        if (!container) return;

        let chipsHtml = `
            <button class="px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${this.selectedCategoryFilter === '' ? 'bg-brand-red text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}" onclick="POS.selectCategory('')">
                Semua
            </button>
        `;

        chipsHtml += this.categories.map(cat => `
            <button class="px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${this.selectedCategoryFilter === String(cat.id) ? 'bg-brand-red text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}" onclick="POS.selectCategory('${cat.id}')">
                ${Utils.escapeHtml(cat.nama)}
            </button>
        `).join('');

        container.innerHTML = chipsHtml;
    },

    selectCategory: function(catId) {
        this.selectedCategoryFilter = catId;
        this.renderCategoryChips();
        this.filterAndRenderProducts();
    },

    // Dropdown customer loader
    populateCustomerSelect: function() {
        const select = document.getElementById('pos-customer-select');
        if (!select) return;

        let options = '<option value="">Umum (Walk-in)</option>';
        options += this.customers.map(cust => {
            if (cust.nama === 'Umum (Walk-in)') return ''; // Skip duplicates
            return `<option value="${cust.id}">${Utils.escapeHtml(cust.nama)} (${Utils.escapeHtml(cust.telepon || '-')})</option>`;
        }).join('');

        select.innerHTML = options;
        select.value = this.selectedCustomerId;

        select.onchange = (e) => {
            this.selectedCustomerId = e.target.value;
        };
    },

    // Client side filtering for maximum performance
    filterAndRenderProducts: function() {
        const grid = document.getElementById('pos-product-grid');
        if (!grid) return;

        let filtered = this.products;

        // Apply Category Filter
        if (this.selectedCategoryFilter !== '') {
            filtered = filtered.filter(p => String(p.category_id) === this.selectedCategoryFilter);
        }

        // Apply Search Text
        if (this.searchQuery !== '') {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(p =>
                p.nama.toLowerCase().includes(query) ||
                p.sku.toLowerCase().includes(query) ||
                (p.category_nama && p.category_nama.toLowerCase().includes(query)) ||
                (p.motor && p.motor.toLowerCase().includes(query))
            );
        }

        if (filtered.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full py-12 flex flex-col items-center text-center text-gray-500">
                    <i data-lucide="package-search" class="w-12 h-12 mb-3 text-slate-600"></i>
                    <p class="text-sm">Produk spare part tidak ditemukan.</p>
                </div>
            `;
            lucide.createIcons();
            return;
        }

        grid.innerHTML = filtered.map(product => {
            const isOutOfStock = parseInt(product.stok) <= 0;
            const isLowStock = parseInt(product.stok) <= parseInt(product.stok_minimum);

            let stockColor = 'text-green-400';
            let stockBg = 'bg-green-500/10 border-green-500/20';

            if (isOutOfStock) {
                stockColor = 'text-red-400';
                stockBg = 'bg-red-500/10 border-red-500/20';
            } else if (isLowStock) {
                stockColor = 'text-amber-400';
                stockBg = 'bg-amber-500/10 border-amber-500/20';
            }

            const imgUrl = product.image_url || product.image || ('images/products/' + (product.sku ? product.sku.toLowerCase() : '') + '.png');

            return `
                <div class="bg-slate-900 rounded-md overflow-hidden flex flex-col h-full border border-slate-800 hover:border-brand-red/40 transition-colors group ${isOutOfStock ? 'opacity-60' : ''}">
                    <div class="p-3 flex-1 flex flex-col justify-between">
                        <div>
                            <div class="flex justify-between items-start gap-1">
                                <span class="text-[10px] font-mono-numbers px-2 py-0.5 bg-slate-800 text-slate-400 rounded-md border border-slate-700">${Utils.escapeHtml(product.sku)}</span>
                                <span class="text-[10px] border px-2 py-0.5 rounded font-bold ${stockBg} ${stockColor} font-mono-numbers">
                                    Stok: ${product.stok}
                                </span>
                            </div>
                            <div class="flex items-start gap-2.5 mt-2">
                                <div class="w-12 h-12 rounded bg-slate-850 p-1 flex-shrink-0 flex items-center justify-center border border-slate-800">
                                    <img src="${imgUrl}" alt="${Utils.escapeHtml(product.nama)}" class="max-h-full max-w-full object-contain" onerror="this.onerror=null; this.parentElement.style.display='none';">
                                </div>
                                <div class="flex-1 min-w-0">
                                    <h4 class="text-xs font-semibold text-gray-200 line-clamp-2 group-hover:text-brand-red transition-colors">${Utils.escapeHtml(product.nama)}</h4>
                                    <p class="text-[10px] text-gray-500 mt-0.5 truncate">Cocok: <span class="text-gray-400 font-medium">${Utils.escapeHtml(product.motor || 'Universal')}</span></p>
                                </div>
                            </div>
                        </div>

                        <div class="mt-3 pt-2 border-t border-slate-700/60 flex items-center justify-between">
                            <span class="text-sm font-bold text-amber-500 font-mono-numbers">${Utils.formatRupiah(product.harga_jual)}</span>

                            ${isOutOfStock ? `
                                <button class="px-2 py-1 text-xs bg-gray-800 text-gray-600 rounded-md cursor-not-allowed" disabled>Habis</button>
                            ` : `
                                <button class="p-1.5 bg-brand-red text-white rounded-md hover:bg-brand-darkred transition-colors flex items-center justify-center" onclick="POS.addToCart(${product.id})">
                                    <i data-lucide="plus" class="w-4 h-4"></i>
                                </button>
                            `}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        lucide.createIcons();
    },

    addToCart: function(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        // Check availability
        const currentInCart = this.cart.find(item => item.product_id === productId);
        const qtyInCart = currentInCart ? currentInCart.qty : 0;

        if (qtyInCart >= parseInt(product.stok)) {
            Utils.showToast(`Stok tidak mencukupi! Batas stok ${product.stok} ${product.satuan}.`, 'error');
            return;
        }

        if (currentInCart) {
            currentInCart.qty += 1;
        } else {
            this.cart.push({
                product_id: product.id,
                sku: product.sku,
                nama: product.nama,
                harga: parseFloat(product.harga_jual),
                qty: 1,
                max_stock: parseInt(product.stok),
                satuan: product.satuan
            });
        }

        Utils.showToast(`${product.nama} dimasukkan ke keranjang.`, 'success');
        this.renderCart();
    },

    updateQty: function(productId, delta) {
        const item = this.cart.find(i => i.product_id === productId);
        if (!item) return;

        const newQty = item.qty + delta;
        if (newQty <= 0) {
            this.removeItem(productId);
            return;
        }

        if (newQty > item.max_stock) {
            Utils.showToast(`Stok tidak cukup! Stok maksimal: ${item.max_stock}`, 'error');
            return;
        }

        item.qty = newQty;
        this.renderCart();
    },

    removeItem: function(productId) {
        this.cart = this.cart.filter(item => item.product_id !== productId);
        this.renderCart();
    },

    // Render cart items to panel
    renderCart: function() {
        const container = document.getElementById('pos-cart-items');
        if (!container) return;

        if (this.cart.length === 0) {
            container.innerHTML = `
                <div class="flex flex-col items-center justify-center h-48 text-center text-slate-500">
                    <i data-lucide="shopping-cart" class="w-12 h-12 mb-2 text-slate-700"></i>
                    <p class="text-sm">Keranjang kosong.</p>
                </div>
            `;
            this.calculateTotals();
            lucide.createIcons();
            return;
        }

        container.innerHTML = this.cart.map(item => {
            const subtotal = item.harga * item.qty;
            return `
                <div class="flex items-center justify-between p-3 border-b border-gray-700/60 hover:bg-slate-800/20 transition-all">
                    <div class="flex-1 min-w-0 pr-3">
                        <h5 class="text-sm font-medium text-gray-200 truncate">${Utils.escapeHtml(item.nama)}</h5>
                        <div class="flex items-center mt-1 space-x-2">
                            <span class="text-xs text-amber-500 font-mono-numbers">${Utils.formatRupiah(item.harga)}</span>
                            <span class="text-xs text-gray-500">x</span>
                            <span class="text-xs text-gray-400 font-mono-numbers">${item.qty} ${item.satuan}</span>
                        </div>
                    </div>

                    <div class="flex items-center space-x-2 flex-shrink-0">
                        <span class="text-sm font-semibold text-gray-100 font-mono-numbers mr-2">${Utils.formatRupiah(subtotal)}</span>

                        <div class="flex items-center bg-slate-800 border border-slate-700 rounded-md">
                            <button class="p-1 text-slate-400 hover:text-white" onclick="POS.updateQty(${item.product_id}, -1)">
                                <i data-lucide="minus" class="w-3.5 h-3.5"></i>
                            </button>
                            <span class="px-2 text-xs font-mono-numbers font-medium text-gray-300 min-w-[20px] text-center">${item.qty}</span>
                            <button class="p-1 text-slate-400 hover:text-white" onclick="POS.updateQty(${item.product_id}, 1)">
                                <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                            </button>
                        </div>

                        <button class="p-1 text-slate-500 hover:text-red-500" onclick="POS.removeItem(${item.product_id})">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        this.calculateTotals();
        lucide.createIcons();
    },

    // Totalizer calculator
    calculateTotals: function() {
        const subtotal = this.cart.reduce((sum, item) => sum + (item.harga * item.qty), 0);

        // Calculate Discount
        const diskonInput = document.getElementById('pos-diskon-input');
        let discount = parseFloat(diskonInput.value) || 0;

        // Protect discount negative
        if (discount < 0) {
            discount = 0;
            diskonInput.value = '0';
        }

        // Adjust for percent/flat
        const total = Math.max(0, subtotal - discount);

        // Render values
        document.getElementById('pos-subtotal-display').textContent = Utils.formatRupiah(subtotal);
        document.getElementById('pos-total-display').textContent = Utils.formatRupiah(total);

        // Calculate change (kembalian)
        const bayarInput = document.getElementById('pos-bayar-input');
        const bayarVal = parseFloat(bayarInput.value) || 0;
        const kembalian = Math.max(0, bayarVal - total);

        if (bayarVal > 0 && bayarVal >= total) {
            document.getElementById('pos-kembalian-display').textContent = Utils.formatRupiah(kembalian);
            document.getElementById('pos-kembalian-display').className = 'text-lg font-bold text-green-400 font-mono-numbers';
        } else {
            document.getElementById('pos-kembalian-display').textContent = 'Belum Cukup';
            document.getElementById('pos-kembalian-display').className = 'text-sm font-semibold text-red-400';
        }
    },

    // Process Transaction Submission
    processPayment: async function() {
        if (this.cart.length === 0) {
            Utils.showToast('Keranjang belanja masih kosong!', 'error');
            return;
        }

        const subtotal = this.cart.reduce((sum, item) => sum + (item.harga * item.qty), 0);
        const discount = parseFloat(document.getElementById('pos-diskon-input').value) || 0;
        const total = Math.max(0, subtotal - discount);

        const bayarInput = document.getElementById('pos-bayar-input');
        const bayarVal = parseFloat(bayarInput.value) || 0;

        if (bayarVal < total) {
            Utils.showToast('Jumlah pembayaran tidak mencukupi!', 'error');
            return;
        }

        const metodeBayar = document.getElementById('pos-metode-bayar').value;
        const catatan = document.getElementById('pos-catatan').value;

        // Build Payload
        const transactionPayload = {
            customer_id: this.selectedCustomerId === '' ? null : parseInt(this.selectedCustomerId),
            items: this.cart.map(i => ({
                product_id: i.product_id,
                qty: i.qty
            })),
            diskon: discount,
            bayar: bayarVal,
            metode_bayar: metodeBayar,
            catatan: catatan
        };

        const btnBayar = document.getElementById('btn-proses-bayar');
        Utils.setLoading(btnBayar, true, 'Proses Transaksi');

        const result = await Utils.apiCall('transactions', 'POST', transactionPayload);

        Utils.setLoading(btnBayar, false, 'Proses Transaksi');

        if (result.success) {
            Utils.showToast('Transaksi Berhasil!', 'success');

            // Show Receipt Modal
            this.showReceipt(result.data.id);

            // Clear current cart
            this.clearCart();
        } else {
            Utils.showToast(result.message || 'Gagal menyimpan transaksi', 'error');
        }
    },

    showReceipt: async function(transactionId) {
        const response = await Utils.apiCall(`transactions/${transactionId}`);
        if (!response.success) {
            Utils.showToast('Gagal memuat detail struk belanja', 'error');
            return;
        }

        const transaction = response.data;
        const items = transaction.items || [];

        let clientInitials = transaction.customer_nama === 'Umum (Walk-in)' ? '-' : transaction.customer_nama;

        const storeName = window.AppSettings?.store_name || 'MotoStock';
        const storeTagline = window.AppSettings?.store_tagline || 'Inventory & Point of Sale';
        const storeAddress = window.AppSettings?.store_address || 'Jl. Raya Serpong No. 45, Tangerang';
        const storePhone = window.AppSettings?.store_phone || '021-5551234';

        const receiptHtml = `
            <div class="receipt-print p-4 max-w-sm mx-auto bg-white text-black font-mono text-sm leading-tight border border-gray-200 shadow-md">
                <div class="text-center border-b border-dashed border-gray-400 pb-2 mb-2">
                    <h3 class="font-bold text-base tracking-wider uppercase">${Utils.escapeHtml(storeName)}</h3>
                    <p class="text-[10px] text-gray-500 font-sans font-semibold">${Utils.escapeHtml(storeTagline)}</p>
                    <p class="text-xs mt-1">${Utils.escapeHtml(storeAddress)}</p>
                    <p class="text-xs">Telp: ${Utils.escapeHtml(storePhone)}</p>
                </div>

                <div class="text-xs space-y-1 mb-2">
                    <div class="flex justify-between">
                        <span>Invoice:</span>
                        <span class="font-bold">${transaction.no_invoice}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Tanggal:</span>
                        <span>${Utils.formatDateTime(transaction.created_at)}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Kasir:</span>
                        <span>${transaction.kasir_nama}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Pelanggan:</span>
                        <span>${transaction.customer_nama}</span>
                    </div>
                </div>

                <div class="border-b border-dashed border-gray-400 mb-2"></div>

                <table class="w-full text-xs mb-2">
                    <thead>
                        <tr class="border-b border-dashed border-gray-400 text-left">
                            <th class="py-1">Barang</th>
                            <th class="py-1 text-center">Qty</th>
                            <th class="py-1 text-right">Harga</th>
                            <th class="py-1 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map(item => `
                            <tr class="border-b border-dashed border-gray-200">
                                <td class="py-1 max-w-[120px] truncate">${Utils.escapeHtml(item.nama_produk)}</td>
                                <td class="py-1 text-center font-bold">${item.qty}</td>
                                <td class="py-1 text-right">${Utils.formatNumber(item.harga)}</td>
                                <td class="py-1 text-right font-bold">${Utils.formatNumber(item.subtotal)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="text-xs space-y-1 pt-1 border-t border-dashed border-gray-400">
                    <div class="flex justify-between">
                        <span>Subtotal:</span>
                        <span>${Utils.formatRupiah(transaction.subtotal)}</span>
                    </div>
                    ${parseFloat(transaction.diskon) > 0 ? `
                        <div class="flex justify-between text-red-600">
                            <span>Diskon Potongan:</span>
                            <span>-${Utils.formatRupiah(transaction.diskon)}</span>
                        </div>
                    ` : ''}
                    <div class="flex justify-between font-bold text-sm pt-1 border-t border-gray-300">
                        <span>Total Bayar:</span>
                        <span>${Utils.formatRupiah(transaction.total)}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Bayar (${transaction.metode_bayar.toUpperCase()}):</span>
                        <span>${Utils.formatRupiah(transaction.bayar)}</span>
                    </div>
                    <div class="flex justify-between font-medium">
                        <span>Kembalian:</span>
                        <span>${Utils.formatRupiah(transaction.kembalian)}</span>
                    </div>
                </div>

                ${transaction.catatan ? `
                    <div class="text-xs mt-3 pt-2 border-t border-dashed border-gray-300">
                        <span class="font-bold">Catatan:</span>
                        <p class="italic text-gray-700">${Utils.escapeHtml(transaction.catatan)}</p>
                    </div>
                ` : ''}

                <div class="text-center text-xs mt-4 pt-3 border-t border-dashed border-gray-400">
                    <p class="font-semibold">Terima Kasih Atas Kunjungan Anda</p>
                    <p class="text-[10px] text-gray-500 mt-1">MotoStock — Inventory & Point of Sale</p>
                </div>
            </div>
        `;

        const footerHtml = `
            <button class="px-4 py-2 bg-slate-800 text-slate-300 rounded-md hover:bg-slate-700 hover:text-white" onclick="Utils.closeModal()">Tutup</button>
            <button class="px-4 py-2 bg-brand-red text-white rounded-md hover:bg-brand-darkred ml-2" onclick="window.print()"><i data-lucide="printer" class="w-4 h-4 inline mr-1"></i> Cetak Struk</button>
        `;

        Utils.showModal('Struk Pembayaran / Invoice', receiptHtml, footerHtml);
    },

    clearCart: function() {
        this.cart = [];
        document.getElementById('pos-diskon-input').value = '0';
        document.getElementById('pos-bayar-input').value = '';
        document.getElementById('pos-catatan').value = '';
        this.renderCart();
    }
};

window.POS = POS;