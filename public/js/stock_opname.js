// StockOpname Module for MotoStock

const StockOpname = {
    adjustments: [],
    products: [],
    selectedProduct: null,

    init: async function() {
        this.registerEvents();
        await this.loadAdjustments();
    },

    registerEvents: function() {
        const btnMulai = document.getElementById('btn-mulai-opname');
        if (btnMulai) {
            btnMulai.onclick = () => this.showAdjustmentForm();
        }
    },

    loadAdjustments: async function() {
        const tbody = document.getElementById('opname-table-body');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center py-6 text-slate-500"><i class="animate-spin inline-block w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full mr-2 align-middle"></i> Memuat data...</td></tr>`;
        }

        const response = await Utils.apiCall('stock'); // stock history endpoint
        if (response.success) {
            // Filter only adjustments
            this.adjustments = response.data.filter(h => h.type === 'adjustment');
            this.renderTable(this.adjustments);
        } else {
            Utils.showToast('Gagal memuat riwayat stok opname.', 'error');
        }
    },

    renderTable: function(data) {
        const tbody = document.getElementById('opname-table-body');
        if (!tbody) return;

        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-gray-500 text-sm">Belum ada data stok opname.</td></tr>`;
            return;
        }

        tbody.innerHTML = data.map((adj, index) => {
            const qtyDiff = parseInt(adj.qty);
            const badgeClass = qtyDiff > 0 ? 'bg-green-500/10 text-green-400 border border-green-500/20' : (qtyDiff < 0 ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700');
            const diffText = qtyDiff > 0 ? `+${qtyDiff}` : `${qtyDiff}`;

            return `
                <tr class="border-b border-slate-850 hover:bg-slate-800/40 transition-colors">
                    <td class="px-4 py-3 text-xs text-center text-gray-500 font-mono-numbers">${index + 1}</td>
                    <td class="px-4 py-3 text-xs text-gray-400">${Utils.formatDateTime(adj.created_at)}</td>
                    <td class="px-4 py-3 text-sm">
                        <div class="font-semibold text-gray-200">${Utils.escapeHtml(adj.product_nama)}</div>
                        <div class="text-[10px] text-gray-500 font-mono-numbers">${Utils.escapeHtml(adj.sku)}</div>
                    </td>
                    <td class="px-4 py-3 text-xs text-gray-400">${Utils.escapeHtml(adj.user_nama || 'Admin')}</td>
                    <td class="px-4 py-3 text-center">
                        <span class="px-2.5 py-0.5 rounded text-[10px] font-bold font-mono-numbers ${badgeClass}">
                            ${diffText}
                        </span>
                    </td>
                    <td class="px-4 py-3 text-center text-xs font-mono-numbers text-gray-300">
                        ${adj.stok_sebelum} &rarr; ${adj.stok_sesudah}
                    </td>
                    <td class="px-4 py-3 text-xs text-gray-400 max-w-xs truncate" title="${Utils.escapeHtml(adj.keterangan || '-')}">
                        ${Utils.escapeHtml(adj.keterangan || '-')}
                    </td>
                </tr>
            `;
        }).join('');
    },

    showAdjustmentForm: async function() {
        this.selectedProduct = null;

        // Load active products
        const prodRes = await Utils.apiCall('products');
        if (!prodRes.success) {
            Utils.showToast('Gagal memuat daftar produk.', 'error');
            return;
        }

        this.products = prodRes.data.filter(p => parseInt(p.is_active) === 1 || p.is_active === true || p.is_active === '1');

        const title = 'Stok Opname';
        const formHtml = `
            <form id="opname-form" class="space-y-4 text-left">
                <div>
                    <label class="block text-xs font-semibold text-gray-400 mb-1">PILIH SPARE PART *</label>
                    <input type="hidden" name="product_id" id="opname-product-id" required>
                    <!-- Search Input & Results Container -->
                    <div id="opname-search-container" class="relative">
                        <div class="relative">
                            <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"></i>
                            <input type="text" id="opname-product-search"
                                class="w-full bg-slate-800 border border-slate-700 rounded-md pl-9 pr-8 py-2 text-sm text-gray-100 placeholder-slate-400 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
                                placeholder="Cari nama atau SKU..." autocomplete="off">
                            <button type="button" id="opname-clear-search" class="hidden absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1">
                                <i data-lucide="x" class="w-3.5 h-3.5"></i>
                            </button>
                        </div>

                        <!-- Dropdown Search Results List -->
                        <div id="opname-search-results" class="hidden absolute left-0 right-0 top-full mt-1.5 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl max-h-60 overflow-y-auto z-50 divide-y divide-slate-800">
                            <!-- Populated via JS -->
                        </div>
                    </div>

                    <!-- Selected Product Card View -->
                    <div id="opname-selected-product" class="hidden mt-2 p-3 bg-slate-800/90 border border-slate-700 rounded-lg flex items-center justify-between">
                        <div class="flex items-center space-x-3 truncate mr-2">
                            <div class="w-9 h-9 rounded-md bg-red-500/10 border border-red-500/20 text-brand-red flex items-center justify-center font-bold text-xs flex-shrink-0">
                                <i data-lucide="package" class="w-5 h-5"></i>
                            </div>
                            <div class="truncate">
                                <h6 class="text-sm font-semibold text-gray-100 truncate" id="opname-selected-name">-</h6>
                                <div class="flex items-center space-x-2 text-[11px] text-gray-400 mt-0.5">
                                    <span class="font-mono-numbers text-slate-300 font-medium" id="opname-selected-sku">-</span>
                                    <span>•</span>
                                    <span id="opname-selected-motor">-</span>
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center space-x-3 flex-shrink-0">
                            <div class="text-right">
                                <span class="text-[10px] text-gray-400 block uppercase">Stok Saat Ini</span>
                                <span class="text-xs font-bold text-amber-400 font-mono-numbers" id="opname-selected-stok">0</span>
                            </div>
                            <button type="button" id="btn-change-opname-prod" class="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-colors" title="Ganti spare part">
                                <i data-lucide="x" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-semibold text-gray-400 mb-1">STOK SAAT INI</label>
                        <input type="text" id="opname-stok-sistem" readonly class="w-full bg-slate-900 border border-slate-800 rounded-md px-3 py-2 text-sm text-gray-400 font-mono-numbers focus:outline-none cursor-not-allowed" value="0">
                    </div>
                    <div>
                        <div class="flex justify-between items-center mb-1">
                            <label class="block text-xs font-semibold text-gray-400">STOK FISIK *</label>
                            <span id="opname-selisih-badge" class="text-[11px] font-mono-numbers font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">Selisih: 0</span>
                        </div>
                        <input type="number" id="opname-stok-fisik" min="0" required class="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-brand-red font-mono-numbers" placeholder="0">
                    </div>
                </div>

                <div>
                    <label class="block text-xs font-semibold text-gray-400 mb-1">KETERANGAN *</label>
                    <input type="text" id="opname-keterangan" required class="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-brand-red" placeholder="Contoh: Barang rusak / salah hitung / stok fisik">
                </div>
            </form>
        `;

        const footerHtml = `
            <button type="button" class="px-4 py-2 text-sm text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md" onclick="Utils.closeModal()">Batal</button>
            <button type="button" class="px-4 py-2 text-sm bg-brand-red hover:bg-brand-darkred text-white rounded-md ml-2" id="btn-save-opname">Simpan</button>
        `;

        Utils.showModal(title, formHtml, footerHtml);
        lucide.createIcons();

        this.setupSearchableSelector();
        document.getElementById('btn-save-opname').onclick = () => this.submitAdjustment();
    },

    setupSearchableSelector: function() {
        const searchInput = document.getElementById('opname-product-search');
        const resultsContainer = document.getElementById('opname-search-results');
        const hiddenIdInput = document.getElementById('opname-product-id');
        const selectedContainer = document.getElementById('opname-selected-product');
        const clearSearchBtn = document.getElementById('opname-clear-search');
        const changeProdBtn = document.getElementById('btn-change-opname-prod');
        const stokSistemInput = document.getElementById('opname-stok-sistem');
        const stokFisikInput = document.getElementById('opname-stok-fisik');
        const selisihBadge = document.getElementById('opname-selisih-badge');

        const updateDifference = () => {
            const systemVal = parseInt(stokSistemInput.value || '0');
            const fisikVal = parseInt(stokFisikInput.value || '0');

            if (isNaN(fisikVal) || !this.selectedProduct) {
                selisihBadge.className = "text-[11px] font-mono-numbers font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700";
                selisihBadge.textContent = "Selisih: 0";
                return;
            }

            const diff = fisikVal - systemVal;
            if (diff > 0) {
                selisihBadge.className = "text-[11px] font-mono-numbers font-semibold px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20";
                selisihBadge.textContent = `Selisih: +${diff}`;
            } else if (diff < 0) {
                selisihBadge.className = "text-[11px] font-mono-numbers font-semibold px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20";
                selisihBadge.textContent = `Selisih: ${diff}`;
            } else {
                selisihBadge.className = "text-[11px] font-mono-numbers font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700";
                selisihBadge.textContent = "Selisih: 0";
            }
        };

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
                            <span class="text-[10px] text-gray-400 block">Stok Saat Ini: <strong class="text-amber-400 font-mono-numbers">${p.stok}</strong></span>
                            <span class="text-[10px] text-slate-500 font-mono-numbers">Min: ${p.stok_minimum}</span>
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

            document.getElementById('opname-selected-name').textContent = product.nama;
            document.getElementById('opname-selected-sku').textContent = product.sku;
            document.getElementById('opname-selected-motor').textContent = product.motor || 'Universal';
            document.getElementById('opname-selected-stok').textContent = product.stok;

            stokSistemInput.value = product.stok;
            stokFisikInput.value = product.stok;

            document.getElementById('opname-search-container').classList.add('hidden');
            selectedContainer.classList.remove('hidden');
            resultsContainer.classList.add('hidden');
            lucide.createIcons();

            updateDifference();

            if (stokFisikInput) {
                stokFisikInput.focus();
                stokFisikInput.select();
            }
        };

        const unselectProduct = () => {
            this.selectedProduct = null;
            hiddenIdInput.value = '';
            stokSistemInput.value = '0';
            stokFisikInput.value = '';
            selectedContainer.classList.add('hidden');
            document.getElementById('opname-search-container').classList.remove('hidden');
            searchInput.value = '';
            if (clearSearchBtn) clearSearchBtn.classList.add('hidden');
            resultsContainer.classList.add('hidden');
            updateDifference();
            searchInput.focus();
        };

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value;
            if (query.trim().length > 0) {
                if (clearSearchBtn) clearSearchBtn.classList.remove('hidden');
                renderResults(query);
            } else {
                if (clearSearchBtn) clearSearchBtn.classList.add('hidden');
                renderResults('');
            }
        });

        searchInput.addEventListener('focus', () => {
            renderResults(searchInput.value);
        });

        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
                searchInput.value = '';
                clearSearchBtn.classList.add('hidden');
                renderResults('');
                searchInput.focus();
            });
        }

        if (changeProdBtn) {
            changeProdBtn.addEventListener('click', () => {
                unselectProduct();
            });
        }

        stokFisikInput.addEventListener('input', updateDifference);

        document.addEventListener('click', (e) => {
            if (!e.target.closest('#opname-search-container')) {
                if (resultsContainer) resultsContainer.classList.add('hidden');
            }
        });
    },

    submitAdjustment: async function() {
        const form = document.getElementById('opname-form');
        const prodId = document.getElementById('opname-product-id').value;

        if (!prodId) {
            Utils.showToast('Silakan cari dan pilih spare part terlebih dahulu.', 'warning');
            const searchInput = document.getElementById('opname-product-search');
            if (searchInput) searchInput.focus();
            return;
        }

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const physicalQty = document.getElementById('opname-stok-fisik').value;
        const keterangan = document.getElementById('opname-keterangan').value.trim();

        const payload = {
            product_id: parseInt(prodId),
            physical_qty: parseInt(physicalQty),
            keterangan: keterangan
        };

        const btnSave = document.getElementById('btn-save-opname');
        Utils.setLoading(btnSave, true, 'Simpan');

        const response = await Utils.apiCall('stock/adjust', 'POST', payload);
        Utils.setLoading(btnSave, false, 'Simpan');

        if (response.success) {
            Utils.showToast('Stok opname berhasil disimpan.', 'success');
            Utils.closeModal();
            this.loadAdjustments();
        } else {
            Utils.showToast(response.message || 'Gagal menyimpan stok opname.', 'error');
        }
    }
};

window.StockOpname = StockOpname;