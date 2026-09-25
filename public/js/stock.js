// Stock Management Module for MotoStock

const Stock = {
    products: [],
    history: [],
    selectedStockInProduct: null,

    init: async function() {
        this.registerEvents();
        await this.loadProductsDropdown();
        await this.loadLowStock();
        await this.loadHistory();
    },

    registerEvents: function() {
        const btnStockIn = document.getElementById('btn-stok-masuk');
        if (btnStockIn) {
            btnStockIn.onclick = () => this.showStockInForm();
        }

        const filterProduct = document.getElementById('stock-filter-product');
        if (filterProduct) {
            filterProduct.onchange = () => this.loadHistory();
        }
    },

    loadProductsDropdown: async function() {
        const response = await Utils.apiCall('products');
        if (response.success) {
            this.products = response.data.filter(p => parseInt(p.is_active) === 1 || p.is_active === true || p.is_active === '1');

            // Populate filter dropdown
            const filterDropdown = document.getElementById('stock-filter-product');
            if (filterDropdown) {
                let options = '<option value="">Semua Spare Part</option>';
                options += this.products.map(p => `<option value="${p.id}">${Utils.escapeHtml(p.sku)} - ${Utils.escapeHtml(p.nama)}</option>`).join('');
                filterDropdown.innerHTML = options;
            }
        }
    },

    loadLowStock: async function() {
        const container = document.getElementById('low-stock-list');
        if (!container) return;

        const response = await Utils.apiCall('stock?low_stock=1');
        if (response.success) {
            const list = response.data || [];

            if (list.length === 0) {
                container.innerHTML = `
                    <div class="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl flex items-center justify-between">
                        <div class="flex items-center space-x-3">
                            <i data-lucide="check-circle-2" class="w-6 h-6"></i>
                            <div>
                                <span class="font-bold text-sm">Stok Aman</span>
                                <p class="text-xs mt-0.5">Semua stok spare part dalam jumlah aman.</p>
                            </div>
                        </div>
                    </div>
                `;
                lucide.createIcons();
                return;
            }

            container.innerHTML = `
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    ${list.map(p => `
                        <div class="bg-red-500/5 border border-red-500/20 hover:border-red-500/40 rounded-xl p-3.5 flex justify-between items-center transition-all low-stock-pulse">
                            <div class="truncate mr-3">
                                <div class="text-[10px] text-gray-500 font-mono-numbers">${Utils.escapeHtml(p.sku)}</div>
                                <h5 class="text-sm font-semibold text-gray-200 mt-0.5 truncate" title="${Utils.escapeHtml(p.nama)}">${Utils.escapeHtml(p.nama)}</h5>
                                <p class="text-xs text-gray-500 mt-0.5">Motor: ${Utils.escapeHtml(p.motor || '-')}</p>
                            </div>
                            <div class="text-right flex-shrink-0 pl-2">
                                <div class="text-sm font-semibold text-gray-300">Stok: <strong class="text-base font-bold text-red-500 font-mono-numbers">${p.stok}</strong></div>
                                <div class="text-xs text-gray-500 mt-0.5 font-medium font-mono-numbers">Min: ${p.stok_minimum}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            lucide.createIcons();
        }
    },

    loadHistory: async function() {
        const tbody = document.getElementById('stock-history-body');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center py-6 text-slate-500"><i class="animate-spin inline-block w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full mr-2 align-middle"></i> Memuat data...</td></tr>`;
        }

        const filterProduct = document.getElementById('stock-filter-product').value;
        const query = filterProduct ? `?product_id=${filterProduct}` : '';

        const response = await Utils.apiCall(`stock${query}`);
        if (response.success) {
            this.history = response.data;
            this.renderHistory(response.data);
        } else {
            Utils.showToast('Gagal memuat riwayat mutasi stok.', 'error');
        }
    },

    renderHistory: function(history) {
        const tbody = document.getElementById('stock-history-body');
        if (!tbody) return;

        if (history.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-slate-500 text-sm">Belum ada catatan mutasi stok.</td></tr>`;
            return;
        }

        tbody.innerHTML = history.map((log, index) => {
            let typeBadge = '';

            if (log.type === 'in') {
                typeBadge = '<span class="bg-green-500/10 text-green-400 text-xs px-2.5 py-0.5 rounded-full border border-green-500/20 font-medium">Stok Masuk</span>';
            } else if (log.type === 'out') {
                typeBadge = '<span class="bg-red-500/10 text-red-400 text-xs px-2.5 py-0.5 rounded-full border border-red-500/20 font-medium">Stok Keluar</span>';
            } else if (log.type === 'sale') {
                typeBadge = '<span class="bg-blue-500/10 text-blue-400 text-xs px-2.5 py-0.5 rounded-full border border-blue-500/20 font-medium">Penjualan</span>';
            } else {
                typeBadge = '<span class="bg-amber-500/10 text-amber-400 text-xs px-2.5 py-0.5 rounded-full border border-amber-500/20 font-medium">Penyesuaian</span>';
            }

            return `
                <tr class="border-b border-slate-700/50 hover:bg-slate-800/40 transition-colors">
                    <td class="px-4 py-3 text-xs text-gray-500 font-mono-numbers text-center">${index + 1}</td>
                    <td class="px-4 py-3 text-xs text-gray-400 font-mono-numbers">${Utils.formatDateTime(log.created_at)}</td>
                    <td class="px-4 py-3 text-sm">
                        <div class="font-semibold text-gray-200">${Utils.escapeHtml(log.product_nama)}</div>
                        <div class="text-[10px] text-gray-500 font-mono-numbers">${Utils.escapeHtml(log.sku)}</div>
                    </td>
                    <td class="px-4 py-3 text-sm text-center">${typeBadge}</td>
                    <td class="px-4 py-3 text-sm text-center font-bold font-mono-numbers ${log.type === 'in' ? 'text-green-400' : 'text-red-400'}">${log.type === 'in' ? '+' : '-'}${log.qty}</td>
                    <td class="px-4 py-3 text-sm text-center text-gray-400 font-mono-numbers">${log.stok_sebelum} <i data-lucide="arrow-right" class="w-3.5 h-3.5 inline mx-1"></i> ${log.stok_sesudah}</td>
                    <td class="px-4 py-3 text-xs text-gray-400 max-w-[150px] truncate" title="${Utils.escapeHtml(log.keterangan || '')}">${Utils.escapeHtml(log.keterangan || '-')}</td>
                </tr>
            `;
        }).join('');

        lucide.createIcons();
    },

    showStockInForm: function() {
        this.selectedStockInProduct = null;

        const formHtml = `
            <form id="stock-in-form" class="space-y-4 text-left">
                <div>
                    <label class="block text-xs font-semibold text-gray-400 mb-1">PILIH SPARE PART *</label>
                    <input type="hidden" name="product_id" id="stock-in-product-id" required>
                    
                    <!-- Search Input & Results Container -->
                    <div id="stock-search-container" class="relative">
                        <div class="relative">
                            <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"></i>
                            <input type="text" id="stock-product-search"
                                class="w-full bg-slate-800 border border-slate-700 rounded-md pl-9 pr-8 py-2 text-sm text-gray-100 placeholder-slate-400 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
                                placeholder="Cari nama atau SKU..." autocomplete="off">
                            <button type="button" id="stock-clear-search" class="hidden absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1">
                                <i data-lucide="x" class="w-3.5 h-3.5"></i>
                            </button>
                        </div>

                        <!-- Dropdown Search Results List -->
                        <div id="stock-search-results" class="hidden absolute left-0 right-0 top-full mt-1.5 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl max-h-60 overflow-y-auto z-50 divide-y divide-slate-800">
                            <!-- Populated via JS -->
                        </div>
                    </div>

                    <!-- Selected Product Card View -->
                    <div id="stock-selected-product" class="hidden mt-2 p-3 bg-slate-800/90 border border-slate-700 rounded-lg flex items-center justify-between">
                        <div class="flex items-center space-x-3 truncate mr-2">
                            <div class="w-9 h-9 rounded-md bg-red-500/10 border border-red-500/20 text-brand-red flex items-center justify-center font-bold text-xs flex-shrink-0">
                                <i data-lucide="package" class="w-5 h-5"></i>
                            </div>
                            <div class="truncate">
                                <h6 class="text-sm font-semibold text-gray-100 truncate" id="selected-prod-name">-</h6>
                                <div class="flex items-center space-x-2 text-[11px] text-gray-400 mt-0.5">
                                    <span class="font-mono-numbers text-slate-300 font-medium" id="selected-prod-sku">-</span>
                                    <span>•</span>
                                    <span id="selected-prod-motor">-</span>
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center space-x-3 flex-shrink-0">
                            <div class="text-right">
                                <span class="text-[10px] text-gray-400 block uppercase">Stok Sekarang</span>
                                <span class="text-xs font-bold text-amber-400 font-mono-numbers" id="selected-prod-stok">0</span>
                            </div>
                            <button type="button" id="btn-change-selected-prod" class="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-colors" title="Ganti spare part">
                                <i data-lucide="x" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <div>
                    <label class="block text-xs font-semibold text-gray-400 mb-1">JUMLAH STOK MASUK *</label>
                    <input type="number" name="qty" required min="1"
                        class="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red font-mono-numbers" placeholder="0">
                </div>

                <div>
                    <label class="block text-xs font-semibold text-gray-400 mb-1">KETERANGAN *</label>
                    <input type="text" name="keterangan" required
                        class="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red" placeholder="Contoh: Kulakan / Pembelian supplier / Restock">
                </div>
            </form>
        `;

        const footerHtml = `
            <button type="button" class="px-4 py-2 text-sm text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md" onclick="Utils.closeModal()">Batal</button>
            <button type="button" class="px-4 py-2 text-sm bg-brand-red hover:bg-brand-darkred text-white rounded-md ml-2" id="btn-save-stock-in">Tambah Stok</button>
        `;

        Utils.showModal('Tambah Stok', formHtml, footerHtml);
        lucide.createIcons();

        this.setupSearchableSelector();
        document.getElementById('btn-save-stock-in').onclick = () => this.saveStockIn();
    },

    setupSearchableSelector: function() {
        const searchInput = document.getElementById('stock-product-search');
        const resultsContainer = document.getElementById('stock-search-results');
        const hiddenIdInput = document.getElementById('stock-in-product-id');
        const selectedContainer = document.getElementById('stock-selected-product');
        const clearSearchBtn = document.getElementById('stock-clear-search');
        const changeProdBtn = document.getElementById('btn-change-selected-prod');

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
                            <span class="text-[10px] text-slate-500">Min: <span class="font-mono-numbers">${p.stok_minimum}</span></span>
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
            this.selectedStockInProduct = product;
            hiddenIdInput.value = product.id;

            document.getElementById('selected-prod-name').textContent = product.nama;
            document.getElementById('selected-prod-sku').textContent = product.sku;
            document.getElementById('selected-prod-motor').textContent = product.motor || 'Universal';
            document.getElementById('selected-prod-stok').textContent = product.stok;

            document.getElementById('stock-search-container').classList.add('hidden');
            selectedContainer.classList.remove('hidden');
            resultsContainer.classList.add('hidden');
            lucide.createIcons();
        };

        const unselectProduct = () => {
            this.selectedStockInProduct = null;
            hiddenIdInput.value = '';
            selectedContainer.classList.add('hidden');
            document.getElementById('stock-search-container').classList.remove('hidden');
            searchInput.value = '';
            clearSearchBtn.classList.add('hidden');
            resultsContainer.classList.add('hidden');
            searchInput.focus();
        };

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value;
            if (query.trim().length > 0) {
                clearSearchBtn.classList.remove('hidden');
                renderResults(query);
            } else {
                clearSearchBtn.classList.add('hidden');
                renderResults('');
            }
        });

        searchInput.addEventListener('focus', () => {
            renderResults(searchInput.value);
        });

        clearSearchBtn.addEventListener('click', () => {
            searchInput.value = '';
            clearSearchBtn.classList.add('hidden');
            renderResults('');
            searchInput.focus();
        });

        changeProdBtn.addEventListener('click', () => {
            unselectProduct();
        });

        // Click outside to close dropdown
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#stock-search-container')) {
                resultsContainer.classList.add('hidden');
            }
        });
    },

    saveStockIn: async function() {
        const form = document.getElementById('stock-in-form');
        const prodId = document.getElementById('stock-in-product-id').value;

        if (!prodId) {
            Utils.showToast('Silakan cari dan pilih spare part terlebih dahulu.', 'warning');
            const searchInput = document.getElementById('stock-product-search');
            if (searchInput) searchInput.focus();
            return;
        }

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = new FormData(form);
        const payload = {};
        formData.forEach((value, key) => {
            payload[key] = value;
        });

        const btnSave = document.getElementById('btn-save-stock-in');
        Utils.setLoading(btnSave, true, 'Tambah Stok');

        const result = await Utils.apiCall('stock', 'POST', payload);

        Utils.setLoading(btnSave, false, 'Tambah Stok');

        if (result.success) {
            Utils.showToast('Stok berhasil ditambahkan.', 'success');
            Utils.closeModal();

            // Reload statistics
            await this.loadProductsDropdown();
            await this.loadLowStock();
            await this.loadHistory();
        } else {
            Utils.showToast(result.message || 'Gagal menyimpan stok masuk.', 'error');
        }
    }
};

window.Stock = Stock;