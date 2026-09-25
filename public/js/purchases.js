// Purchases Module for MotoStock

const Purchases = {
    purchases: [],
    suppliers: [],
    products: [],
    cart: [],
    selectedProduct: null,

    init: async function() {
        this.cart = [];
        this.selectedProduct = null;
        this.updateCartDisplay();

        // Setup Tab Toggles
        const tabHistory = document.getElementById('tab-purchase-history');
        const tabNew = document.getElementById('tab-purchase-new');
        const secHistory = document.getElementById('section-purchase-history');
        const secNew = document.getElementById('section-purchase-new');

        tabHistory.onclick = () => {
            tabHistory.className = "px-4 py-1.5 text-xs font-semibold rounded-md bg-brand-red text-white";
            tabNew.className = "px-4 py-1.5 text-xs font-semibold rounded-md text-slate-400 hover:text-white";
            secHistory.classList.remove('hidden');
            secNew.classList.add('hidden');
            this.loadPurchases();
        };

        tabNew.onclick = async () => {
            tabNew.className = "px-4 py-1.5 text-xs font-semibold rounded-md bg-brand-red text-white";
            tabHistory.className = "px-4 py-1.5 text-xs font-semibold rounded-md text-slate-400 hover:text-white";
            secNew.classList.remove('hidden');
            secHistory.classList.add('hidden');

            await this.loadFormData();
        };

        // Reset Date Filters
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        document.getElementById('purchase-start-date').value = startOfMonth.toISOString().substring(0, 10);
        document.getElementById('purchase-end-date').value = today.toISOString().substring(0, 10);

        this.registerEvents();
        await this.loadPurchases();
    },

    registerEvents: function() {
        const btnFilter = document.getElementById('btn-filter-purchase');
        if (btnFilter) btnFilter.onclick = () => this.loadPurchases();

        const btnAddItem = document.getElementById('btn-add-purchase-item');
        if (btnAddItem) btnAddItem.onclick = () => this.addToCart();

        const btnClear = document.getElementById('btn-clear-purchase');
        if (btnClear) btnClear.onclick = () => this.clearCart();

        const btnSubmit = document.getElementById('btn-submit-purchase');
        if (btnSubmit) btnSubmit.onclick = () => this.submitPurchase();
    },

    loadPurchases: async function() {
        const tbody = document.getElementById('purchases-table-body');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center py-6 text-slate-500"><i class="animate-spin inline-block w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full mr-2 align-middle"></i> Memuat data...</td></tr>`;
        }

        const start = document.getElementById('purchase-start-date').value;
        const end = document.getElementById('purchase-end-date').value;

        const response = await Utils.apiCall(`purchases?start_date=${start}&end_date=${end}`);
        if (response.success) {
            this.purchases = response.data;
            this.renderTable(response.data);
        } else {
            Utils.showToast('Gagal memuat riwayat pembelian.', 'error');
        }
    },

    renderTable: function(purchases) {
        const tbody = document.getElementById('purchases-table-body');
        if (!tbody) return;

        if (purchases.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-gray-500 text-sm">Tidak ada riwayat pembelian dalam periode ini.</td></tr>`;
            return;
        }

        tbody.innerHTML = purchases.map((po, index) => `
            <tr class="border-b border-slate-850 hover:bg-slate-800/40 transition-colors">
                <td class="px-4 py-3 text-xs text-center text-gray-500 font-mono-numbers">${index + 1}</td>
                <td class="px-4 py-3 text-xs font-bold text-gray-400 font-mono-numbers">${Utils.escapeHtml(po.no_pembelian)}</td>
                <td class="px-4 py-3 text-xs text-gray-400">${Utils.formatDateTime(po.created_at)}</td>
                <td class="px-4 py-3 text-sm font-semibold text-gray-300">${Utils.escapeHtml(po.supplier_nama || 'Umum')}</td>
                <td class="px-4 py-3 text-xs text-gray-400">${Utils.escapeHtml(po.user_nama)}</td>
                <td class="px-4 py-3 text-sm text-right font-semibold font-mono-numbers text-amber-500">${Utils.formatRupiah(po.total)}</td>
                <td class="px-4 py-3 text-sm text-center">
                    <button class="p-1 text-slate-400 hover:text-brand-red hover:bg-slate-700 rounded transition-colors" onclick="Purchases.showDetail(${po.id})" title="Detail PO">
                        <i data-lucide="eye" class="w-4 h-4"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        lucide.createIcons();
    },

    loadFormData: async function() {
        // Load suppliers and products
        const supRes = await Utils.apiCall('suppliers');
        const prodRes = await Utils.apiCall('products');

        if (supRes.success) {
            this.suppliers = supRes.data;
            const select = document.getElementById('purchase-supplier-select');
            if (select) {
                select.innerHTML = this.suppliers.map(s => `<option value="${s.id}">${Utils.escapeHtml(s.nama)}</option>`).join('');
            }
        }

        if (prodRes.success) {
            this.products = prodRes.data.filter(p => parseInt(p.is_active) === 1 || p.is_active === true || p.is_active === '1');
            this.setupSearchableSelector();
        }
    },

    setupSearchableSelector: function() {
        const searchInput = document.getElementById('purchase-product-search');
        const resultsContainer = document.getElementById('purchase-search-results');
        const hiddenIdInput = document.getElementById('purchase-product-id');
        const selectedContainer = document.getElementById('purchase-selected-product');
        const clearSearchBtn = document.getElementById('purchase-clear-search');
        const changeProdBtn = document.getElementById('btn-change-purchase-prod');
        const priceInput = document.getElementById('purchase-price-input');
        const qtyInput = document.getElementById('purchase-qty-input');

        if (!searchInput || !resultsContainer || !hiddenIdInput || !selectedContainer) return;

        const renderResults = (query) => {
            const trimmed = query.trim().toLowerCase();
            const filtered = this.products.filter(p => {
                const nameMatch = (p.nama || '').toLowerCase().includes(trimmed);
                const skuMatch = (p.sku || '').toLowerCase().includes(trimmed);
                const partNoMatch = (p.part_number || '').toLowerCase().includes(trimmed);
                return nameMatch || skuMatch || partNoMatch;
            });

            if (filtered.length === 0) {
                resultsContainer.innerHTML = `
                    <div class="p-3 text-center text-xs text-slate-500">
                        Tidak ada spare part ditemukan untuk "${Utils.escapeHtml(query)}"
                    </div>
                `;
            } else {
                resultsContainer.innerHTML = filtered.slice(0, 30).map(p => `
                    <div class="p-2.5 hover:bg-slate-800 cursor-pointer transition-colors flex items-center justify-between group" data-product-id="${p.id}">
                        <div class="truncate mr-2">
                            <div class="text-xs font-semibold text-gray-100 group-hover:text-red-400 transition-colors truncate">
                                ${Utils.escapeHtml(p.nama)}
                            </div>
                            <div class="flex items-center space-x-2 text-[11px] text-gray-400 mt-0.5">
                                <span class="font-mono-numbers text-slate-300 font-medium">${Utils.escapeHtml(p.sku)}</span>
                                <span>•</span>
                                <span>${Utils.escapeHtml(p.motor || 'Universal')}</span>
                            </div>
                        </div>
                        <div class="text-right flex-shrink-0 pl-2">
                            <span class="text-[10px] text-gray-400 block">Stok: <strong class="text-amber-400 font-mono-numbers">${p.stok}</strong></span>
                            <span class="text-[10px] text-slate-500 font-mono-numbers">Beli: ${Utils.formatRupiah(p.harga_beli || 0)}</span>
                        </div>
                    </div>
                `).join('');

                resultsContainer.querySelectorAll('[data-product-id]').forEach(item => {
                    item.addEventListener('click', () => {
                        const prodId = parseInt(item.getAttribute('data-product-id'));
                        const product = this.products.find(p => p.id === prodId);
                        if (product) {
                            selectProduct(product);
                        }
                    });
                });
            }

            resultsContainer.classList.remove('hidden');
        };

        const selectProduct = (product) => {
            this.selectedProduct = product;
            hiddenIdInput.value = product.id;

            document.getElementById('purchase-selected-name').textContent = product.nama;
            document.getElementById('purchase-selected-sku').textContent = product.sku;
            document.getElementById('purchase-selected-motor').textContent = product.motor || 'Universal';
            document.getElementById('purchase-selected-stok').textContent = product.stok;

            // Auto fill harga beli baru if empty or update to product harga_beli
            if (priceInput && (!priceInput.value || parseFloat(priceInput.value) === 0)) {
                priceInput.value = Math.round(parseFloat(product.harga_beli || 0));
            }

            document.getElementById('purchase-search-container').classList.add('hidden');
            selectedContainer.classList.remove('hidden');
            resultsContainer.classList.add('hidden');
            lucide.createIcons();

            if (qtyInput) {
                qtyInput.focus();
                qtyInput.select();
            }
        };

        const unselectProduct = () => {
            this.selectedProduct = null;
            hiddenIdInput.value = '';
            selectedContainer.classList.add('hidden');
            document.getElementById('purchase-search-container').classList.remove('hidden');
            searchInput.value = '';
            if (clearSearchBtn) clearSearchBtn.classList.add('hidden');
            resultsContainer.classList.add('hidden');
            searchInput.focus();
        };

        this.unselectProduct = unselectProduct;

        // Clone element listeners cleanly
        searchInput.oninput = (e) => {
            const query = e.target.value;
            if (query.trim().length > 0) {
                if (clearSearchBtn) clearSearchBtn.classList.remove('hidden');
                renderResults(query);
            } else {
                if (clearSearchBtn) clearSearchBtn.classList.add('hidden');
                renderResults('');
            }
        };

        searchInput.onfocus = () => {
            renderResults(searchInput.value);
        };

        if (clearSearchBtn) {
            clearSearchBtn.onclick = () => {
                searchInput.value = '';
                clearSearchBtn.classList.add('hidden');
                renderResults('');
                searchInput.focus();
            };
        }

        if (changeProdBtn) {
            changeProdBtn.onclick = () => {
                unselectProduct();
            };
        }

        document.onclick = (e) => {
            if (!e.target.closest('#purchase-search-container')) {
                if (resultsContainer) resultsContainer.classList.add('hidden');
            }
        };
    },

    addToCart: function() {
        const qtyInput = document.getElementById('purchase-qty-input');
        const priceInput = document.getElementById('purchase-price-input');
        const hiddenIdInput = document.getElementById('purchase-product-id');

        const productId = this.selectedProduct ? this.selectedProduct.id : parseInt(hiddenIdInput ? hiddenIdInput.value : 0);
        const qty = parseInt(qtyInput ? qtyInput.value : 0);
        const price = parseFloat(priceInput ? priceInput.value : 0);

        if (!productId || isNaN(qty) || qty <= 0 || isNaN(price) || price < 0) {
            Utils.showToast('Lengkapi pilihan spare part, jumlah (qty), dan harga beli.', 'warning');
            const searchInput = document.getElementById('purchase-product-search');
            if (searchInput && !productId) searchInput.focus();
            return;
        }

        const product = this.selectedProduct || this.products.find(p => p.id === productId);
        if (!product) return;

        // Check if item already in cart
        const existingIndex = this.cart.findIndex(i => i.product_id === productId);
        if (existingIndex > -1) {
            this.cart[existingIndex].qty += qty;
            this.cart[existingIndex].harga_beli = price; // update with latest price
            this.cart[existingIndex].subtotal = this.cart[existingIndex].qty * price;
        } else {
            this.cart.push({
                product_id: product.id,
                sku: product.sku,
                nama: product.nama,
                qty: qty,
                harga_beli: price,
                subtotal: qty * price
            });
        }

        // Reset inputs & product selector
        if (typeof this.unselectProduct === 'function') {
            this.unselectProduct();
        }
        if (qtyInput) qtyInput.value = '1';
        if (priceInput) priceInput.value = '';

        this.updateCartDisplay();
        Utils.showToast('Item berhasil dimasukkan ke daftar.', 'info');
    },

    removeFromCart: function(index) {
        this.cart.splice(index, 1);
        this.updateCartDisplay();
    },

    updateCartDisplay: function() {
        const tbody = document.getElementById('purchase-cart-body');
        if (!tbody) return;

        if (this.cart.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-slate-500 text-xs">Belum ada barang belanjaan.</td></tr>`;
            document.getElementById('purchase-total-display').textContent = 'Rp 0';
            return;
        }

        let total = 0;
        tbody.innerHTML = this.cart.map((item, index) => {
            total += item.subtotal;
            return `
                <tr class="border-b border-slate-800 text-xs hover:bg-slate-800/20">
                    <td class="px-4 py-2.5">
                        <div class="font-semibold text-gray-200">${Utils.escapeHtml(item.nama)}</div>
                        <div class="text-[10px] text-gray-500 font-mono-numbers">${Utils.escapeHtml(item.sku)}</div>
                    </td>
                    <td class="px-4 py-2.5 text-right font-mono-numbers text-gray-400">${Utils.formatRupiah(item.harga_beli)}</td>
                    <td class="px-4 py-2.5 text-center font-mono-numbers text-gray-300 font-semibold">${item.qty}</td>
                    <td class="px-4 py-2.5 text-right font-mono-numbers text-amber-500 font-semibold">${Utils.formatRupiah(item.subtotal)}</td>
                    <td class="px-4 py-2.5 text-center">
                        <button class="p-1 text-slate-500 hover:text-red-500 transition-colors" onclick="Purchases.removeFromCart(${index})">
                            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        document.getElementById('purchase-total-display').textContent = Utils.formatRupiah(total);
        lucide.createIcons();
    },

    clearCart: function() {
        this.cart = [];
        this.updateCartDisplay();
        if (typeof this.unselectProduct === 'function') {
            this.unselectProduct();
        }
        const qtyInput = document.getElementById('purchase-qty-input');
        const priceInput = document.getElementById('purchase-price-input');
        if (qtyInput) qtyInput.value = '1';
        if (priceInput) priceInput.value = '';
        const catatan = document.getElementById('purchase-catatan');
        if (catatan) catatan.value = '';
    },

    submitPurchase: async function() {
        if (this.cart.length === 0) {
            Utils.showToast('Daftar belanja masih kosong.', 'warning');
            return;
        }

        const supplierId = document.getElementById('purchase-supplier-select').value;
        const catatan = document.getElementById('purchase-catatan').value.trim();

        const payload = {
            supplier_id: supplierId ? parseInt(supplierId) : null,
            catatan: catatan,
            items: this.cart.map(i => ({
                product_id: i.product_id,
                qty: i.qty,
                harga_beli: i.harga_beli
            }))
        };

        const btnSubmit = document.getElementById('btn-submit-purchase');
        Utils.setLoading(btnSubmit, true, 'Simpan PO');

        const response = await Utils.apiCall('purchases', 'POST', payload);
        Utils.setLoading(btnSubmit, false, 'Simpan PO');

        if (response.success) {
            Utils.showToast('PO Pembelian berhasil diproses.', 'success');
            this.clearCart();
            // Go back to history tab
            document.getElementById('tab-purchase-history').click();
        } else {
            Utils.showToast(response.message || 'Gagal menyimpan transaksi pembelian.', 'error');
        }
    },

    showDetail: async function(id) {
        const response = await Utils.apiCall(`purchases/${id}`);
        if (!response.success) {
            Utils.showToast('Gagal memuat detail pembelian.', 'error');
            return;
        }

        const po = response.data.purchase;
        const items = response.data.items;

        const title = `Detail Pembelian: ${po.no_pembelian}`;
        const contentHtml = `
            <div class="space-y-4 text-left text-sm text-gray-300">
                <div class="grid grid-cols-2 gap-4 bg-slate-950 p-4 border border-slate-800 rounded-md">
                    <div>
                        <div class="text-xs text-gray-500 font-semibold">TANGGAL TRANSAKSI</div>
                        <div class="font-semibold text-gray-200 mt-0.5">${Utils.formatDateTime(po.created_at)}</div>
                    </div>
                    <div>
                        <div class="text-xs text-gray-500 font-semibold">SUPPLIER</div>
                        <div class="font-semibold text-gray-200 mt-0.5">${Utils.escapeHtml(po.supplier ? po.supplier.nama : 'Umum')}</div>
                    </div>
                    <div>
                        <div class="text-xs text-gray-500 font-semibold">PENERIMA (STAFF KASIR)</div>
                        <div class="font-semibold text-gray-200 mt-0.5">${Utils.escapeHtml(po.user ? po.user.nama : 'System')}</div>
                    </div>
                    <div>
                        <div class="text-xs text-gray-500 font-semibold">TOTAL PEMBELIAN</div>
                        <div class="font-bold text-amber-500 font-mono-numbers mt-0.5">${Utils.formatRupiah(po.total)}</div>
                    </div>
                </div>

                <div>
                    <div class="text-xs font-semibold text-gray-400 mb-2 uppercase">Daftar Suku Cadang Terbeli</div>
                    <div class="glass-panel border border-slate-800 rounded-md overflow-hidden">
                        <table class="w-full text-left text-xs">
                            <thead>
                                <tr class="bg-slate-950 text-gray-500 border-b border-slate-800 font-semibold uppercase">
                                    <th class="px-4 py-3">Nama Produk / SKU</th>
                                    <th class="px-4 py-3 text-right">Harga Beli</th>
                                    <th class="px-4 py-3 text-center">Qty</th>
                                    <th class="px-4 py-3 text-right">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-850">
                                ${items.map(item => `
                                    <tr>
                                        <td class="px-4 py-3">
                                             <div class="font-semibold text-gray-200">${Utils.escapeHtml(item.nama_produk)}</div>
                                            <div class="text-[10px] text-gray-500 font-mono-numbers">${Utils.escapeHtml(item.sku)}</div>
                                        </td>
                                        <td class="px-4 py-3 text-right font-mono-numbers text-gray-400">${Utils.formatRupiah(item.harga_beli)}</td>
                                        <td class="px-4 py-3 text-center font-mono-numbers text-gray-200">${item.qty}</td>
                                        <td class="px-4 py-3 text-right font-semibold font-mono-numbers text-amber-500">${Utils.formatRupiah(item.subtotal)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                ${po.catatan ? `
                    <div class="p-3 bg-slate-900 border border-slate-800 rounded-md">
                        <div class="text-xs text-gray-500 font-semibold uppercase">Catatan Pembelian</div>
                        <div class="text-xs text-gray-300 mt-1">${Utils.escapeHtml(po.catatan)}</div>
                    </div>
                ` : ''}
            </div>
        `;

        const footerHtml = `
            <button class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded text-sm" onclick="Utils.closeModal()">Tutup</button>
        `;

        Utils.showModal(title, contentHtml, footerHtml);
    }
};

window.Purchases = Purchases;