// Stock Management Module for MyKasir

const Stock = {
    products: [],
    history: [],

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
            this.products = response.data.filter(p => parseInt(p.is_active) === 1);

            // Populate filter dropdown
            const filterDropdown = document.getElementById('stock-filter-product');
            if (filterDropdown) {
                let options = '<option value="">Semua Produk</option>';
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
                                <p class="text-xs mt-0.5">Tidak ada produk spare part yang berada di bawah limit minimum.</p>
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
                            <div>
                                <div class="text-[10px] text-gray-500 font-mono-numbers">${Utils.escapeHtml(p.sku)}</div>
                                <h5 class="text-sm font-semibold text-gray-200 mt-1 line-clamp-1">${Utils.escapeHtml(p.nama)}</h5>
                                <p class="text-xs text-gray-500 mt-0.5">Motor: ${Utils.escapeHtml(p.motor || '-')}</p>
                            </div>
                            <div class="text-right flex-shrink-0 pl-3">
                                <div class="text-xl font-bold text-red-500 font-mono-numbers">${p.stok}</div>
                                <div class="text-[10px] text-gray-500 mt-0.5 font-medium font-mono-numbers">Limit: ${p.stok_minimum}</div>
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
            tbody.innerHTML = `<tr><td colspan="6" class="text-center py-6 text-slate-500"><i class="animate-spin inline-block w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full mr-2 align-middle"></i> Memuat data...</td></tr>`;
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
            tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-slate-500 text-sm">Belum ada catatan mutasi stok.</td></tr>`;
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
                    <td class="px-4 py-3 text-xs text-gray-500 font-mono-numbers">${index + 1}</td>
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
        const productOptions = this.products.map(p => `
            <option value="${p.id}">
                ${Utils.escapeHtml(p.sku)} - ${Utils.escapeHtml(p.nama)} (Stok Saat Ini: ${p.stok})
            </option>
        `).join('');

        const formHtml = `
            <form id="stock-in-form" class="space-y-4 text-left">
                <div>
                    <label class="block text-xs font-semibold text-gray-400 mb-1">PILIH BARANG SPARE PART *</label>
                    <select name="product_id" required class="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red">
                        <option value="">Cari dan pilih spare part</option>
                        ${productOptions}
                    </select>
                </div>

                <div>
                    <label class="block text-xs font-semibold text-gray-400 mb-1">JUMLAH STOK MASUK *</label>
                    <input type="number" name="qty" required min="1"
                        class="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red font-mono-numbers" placeholder="0">
                </div>

                <div>
                    <label class="block text-xs font-semibold text-gray-400 mb-1">KETERANGAN / DOKUMEN REFERENSI *</label>
                    <input type="text" name="keterangan" required
                        class="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red" placeholder="Contoh: Kulakan / Penerimaan dari Supplier X / Invoice CP-900">
                </div>
            </form>
        `;

        const footerHtml = `
            <button type="button" class="px-4 py-2 text-sm text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md" onclick="Utils.closeModal()">Batal</button>
            <button type="button" class="px-4 py-2 text-sm bg-brand-red hover:bg-brand-darkred text-white rounded-md ml-2" id="btn-save-stock-in">Tambah Stok</button>
        `;

        Utils.showModal('Tambah Stok Masuk (Restock)', formHtml, footerHtml);

        document.getElementById('btn-save-stock-in').onclick = () => this.saveStockIn();
    },

    saveStockIn: async function() {
        const form = document.getElementById('stock-in-form');
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