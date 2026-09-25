// Products Module for MotoStock

const Products = {
    products: [],
    categories: [],

    // Constant list of motorcycle models
    MOTORCYCLE_MODELS: [
        'Honda Beat',
        'Honda Beat Street',
        'Honda Vario 110',
        'Honda Vario 125',
        'Honda Vario 150',
        'Honda Vario 160',
        'Honda Scoopy',
        'Honda PCX 160',
        'Honda Supra X 125',
        'Honda Sonic',
        'Honda CB150R',
        'Honda CBR150R'
    ],

    init: async function() {
        // Reset Search Input and Filters
        document.getElementById('product-search-input').value = '';
        document.getElementById('product-cat-filter').value = '';
        document.getElementById('product-motor-filter').value = '';
        document.getElementById('product-stock-status-filter').value = '';
        document.getElementById('product-sort-filter').value = 'nama-asc';

        this.registerEvents();
        this.populateMotorFilter();
        await this.loadCategories();
        await this.loadProducts();
    },

    registerEvents: function() {
        const searchInput = document.getElementById('product-search-input');
        if (searchInput) {
            searchInput.oninput = Utils.debounce(() => this.loadProducts(), 300);
        }

        const catFilter = document.getElementById('product-cat-filter');
        if (catFilter) {
            catFilter.onchange = () => this.loadProducts();
        }

        const motorFilter = document.getElementById('product-motor-filter');
        if (motorFilter) {
            motorFilter.onchange = () => this.loadProducts();
        }

        const stockFilter = document.getElementById('product-stock-status-filter');
        if (stockFilter) {
            stockFilter.onchange = () => this.loadProducts();
        }

        const sortFilter = document.getElementById('product-sort-filter');
        if (sortFilter) {
            sortFilter.onchange = () => this.loadProducts();
        }

        const btnAdd = document.getElementById('btn-tambah-produk');
        if (btnAdd) {
            btnAdd.onclick = () => this.showForm();
        }
    },

    populateMotorFilter: function() {
        const filterDropdown = document.getElementById('product-motor-filter');
        if (filterDropdown) {
            let options = '<option value="">Semua Model Motor</option>';
            options += this.MOTORCYCLE_MODELS.map(m => `<option value="${Utils.escapeHtml(m)}">${Utils.escapeHtml(m)}</option>`).join('');
            filterDropdown.innerHTML = options;
        }
    },

    loadCategories: async function() {
        const response = await Utils.apiCall('categories');
        if (response.success) {
            this.categories = response.data;
            const filterDropdown = document.getElementById('product-cat-filter');
            if (filterDropdown) {
                let options = '<option value="">Semua Kategori</option>';
                options += this.categories.map(c => `<option value="${c.id}">${Utils.escapeHtml(c.nama)}</option>`).join('');
                filterDropdown.innerHTML = options;
            }
        }
    },

    loadProducts: async function() {
        const tbody = document.getElementById('products-table-body');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="10" class="text-center py-6 text-slate-500"><i class="animate-spin inline-block w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full mr-2 align-middle"></i> Memuat data...</td></tr>`;
        }

        const search = document.getElementById('product-search-input').value.trim();
        const categoryId = document.getElementById('product-cat-filter').value;
        const motor = document.getElementById('product-motor-filter').value;
        const stockStatus = document.getElementById('product-stock-status-filter').value;
        const sortVal = document.getElementById('product-sort-filter').value;

        let sortBy = 'nama';
        let sortOrder = 'asc';
        if (sortVal) {
            const parts = sortVal.split('-');
            sortBy = parts[0];
            sortOrder = parts[1];
        }

        let queryParams = [];
        if (search) queryParams.push(`search=${encodeURIComponent(search)}`);
        if (categoryId) queryParams.push(`category_id=${categoryId}`);
        if (motor) queryParams.push(`motor=${encodeURIComponent(motor)}`);
        if (stockStatus) queryParams.push(`stock_status=${stockStatus}`);
        queryParams.push(`sort_by=${sortBy}`);
        queryParams.push(`sort_order=${sortOrder}`);

        const queryString = queryParams.length > 0 ? '?' + queryParams.join('&') : '';
        const response = await Utils.apiCall(`products${queryString}`);

        if (response.success) {
            this.products = response.data;
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
                const filterDropdown = document.getElementById('product-cat-filter');
                if (filterDropdown && this.categories.length > 0) {
                    let options = '<option value="">Semua Kategori</option>';
                    options += this.categories.map(c => `<option value="${c.id}">${Utils.escapeHtml(c.nama)}</option>`).join('');
                    filterDropdown.innerHTML = options;
                }
            }
            this.renderTable(response.data);
        } else {
            Utils.showToast('Gagal memuat produk.', 'error');
        }
    },

    renderTable: function(products) {
        const tbody = document.getElementById('products-table-body');
        if (!tbody) return;

        if (products.length === 0) {
            tbody.innerHTML = `<tr><td colspan="10" class="text-center py-8 text-gray-500 text-sm">Tidak ada produk ditemukan.</td></tr>`;
            return;
        }

        tbody.innerHTML = products.map((product, index) => {
            const isLowStock = parseInt(product.stok) <= parseInt(product.stok_minimum);
            const isOutOfStock = parseInt(product.stok) <= 0;

            let stockBadge = '';
            if (isOutOfStock) {
                stockBadge = '<span class="px-2.5 py-0.5 text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/20 rounded">HABIS</span>';
            } else if (isLowStock) {
                stockBadge = `<span class="px-2.5 py-0.5 text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded">${product.stok} (Limit)</span>`;
            } else {
                stockBadge = `<span class="px-2.5 py-0.5 text-[10px] font-semibold bg-green-500/10 text-green-400 border border-green-500/20 rounded">${product.stok}</span>`;
            }

            // Neatly display compatibility list
            const motorModels = product.motor ? product.motor.split(',').map(m => m.trim()).filter(Boolean) : [];
            let motorHtml = '-';
            if (motorModels.length > 0) {
                if (motorModels.length <= 2) {
                    motorHtml = Utils.escapeHtml(motorModels.join(', '));
                } else {
                    const tooltipText = Utils.escapeHtml(product.motor);
                    motorHtml = `${Utils.escapeHtml(motorModels.slice(0, 2).join(', '))} <span class="text-brand-red font-semibold cursor-help" title="${tooltipText}">+${motorModels.length - 2} lainnya</span>`;
                }
            }

            // Determine if the product is active/inactive
            const statusLabel = parseInt(product.is_active) === 0 ? ' <span class="text-[9px] bg-slate-800 text-slate-500 border border-slate-700 px-1 py-0.2 rounded ml-1 uppercase font-bold">Non-aktif</span>' : '';
            const imgUrl = product.image_url || product.image || ('images/products/' + (product.sku ? product.sku.toLowerCase() : '') + '.png');

            return `
                <tr class="border-b border-slate-700/50 hover:bg-slate-800/40 transition-colors ${parseInt(product.is_active) === 0 ? 'opacity-50' : ''}">
                    <td class="px-4 py-3 text-xs text-gray-500 font-mono-numbers">${index + 1}</td>
                    <td class="px-4 py-3 text-xs font-bold text-gray-400 font-mono-numbers">${Utils.escapeHtml(product.sku)}</td>
                    <td class="px-4 py-3 text-xs text-gray-400 font-mono-numbers">${Utils.escapeHtml(product.part_number || '-')}</td>
                    <td class="px-4 py-3 text-sm">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded bg-slate-850 p-1 flex-shrink-0 flex items-center justify-center border border-slate-800">
                                <img src="${imgUrl}" alt="${Utils.escapeHtml(product.nama)}" class="max-h-full max-w-full object-contain" onerror="this.onerror=null; this.parentElement.style.display='none';">
                            </div>
                            <div>
                                <div class="font-semibold text-gray-200 inline-flex items-center">${Utils.escapeHtml(product.nama)}${statusLabel}</div>
                                <div class="text-[11px] text-gray-400 mt-0.5">Motor: <span class="font-medium">${motorHtml}</span></div>
                            </div>
                        </div>
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-400">${Utils.escapeHtml(product.category_nama || '-')}</td>
                    <td class="px-4 py-3 text-sm text-right font-mono-numbers text-gray-400">${Utils.formatRupiah(product.harga_beli)}</td>
                    <td class="px-4 py-3 text-sm text-right font-semibold font-mono-numbers text-amber-500">${Utils.formatRupiah(product.harga_jual)}</td>
                    <td class="px-4 py-3 text-sm text-center font-mono-numbers">${stockBadge}</td>
                    <td class="px-4 py-3 text-xs text-center text-gray-400">${Utils.escapeHtml(product.satuan)}</td>
                    <td class="px-4 py-3 text-sm text-center">
                        <div class="flex items-center justify-center space-x-2">
                            <button class="p-1 text-slate-400 hover:text-blue-500 hover:bg-slate-700 rounded-md transition-colors" onclick="Products.showForm(${product.id})" title="Edit">
                                <i data-lucide="edit-3" class="w-4 h-4"></i>
                            </button>
                            <button class="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-700 rounded-md transition-colors" onclick="Products.deleteProduct(${product.id})" title="${parseInt(product.is_active) === 0 ? 'Hapus' : 'Hapus / Nonaktifkan'}">
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        lucide.createIcons();
    },

    // Show add/edit product modal
    showForm: function(id = null) {
        const product = id ? this.products.find(p => p.id === id) : null;
        const title = product ? 'Edit Produk Spare Part' : 'Tambah Produk Baru';

        const categoryOptions = this.categories.map(c => `
            <option value="${c.id}" ${product && product.category_id === c.id ? 'selected' : ''}>
                ${Utils.escapeHtml(c.nama)}
            </option>
        `).join('');

        // Get selected motor models
        const activeMotors = product && product.motor ? product.motor.split(',').map(m => m.trim()) : [];

        // Generate checkboxes for motorcycle models
        const motorCheckboxes = this.MOTORCYCLE_MODELS.map(model => {
            const isChecked = activeMotors.includes(model) ? 'checked' : '';
            return `
                <label class="flex items-center space-x-2 text-xs text-gray-300 hover:text-white cursor-pointer select-none">
                    <input type="checkbox" name="motor_models" value="${Utils.escapeHtml(model)}" ${isChecked}
                        class="rounded border-slate-700 bg-slate-800 text-brand-red focus:ring-0 focus:ring-offset-0">
                    <span>${Utils.escapeHtml(model)}</span>
                </label>
            `;
        }).join('');

        const formHtml = `
            <form id="product-form" class="space-y-4 text-left">
                <input type="hidden" name="id" value="${product ? product.id : ''}">

                <!-- Group 1: Informasi Dasar -->
                <div class="border-b border-slate-800 pb-3">
                    <h5 class="text-[10px] font-bold uppercase tracking-wider text-brand-red mb-3">Informasi Dasar</h5>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                            <label class="block text-[10px] font-semibold text-gray-400 uppercase mb-1">Kode SKU *</label>
                            <input type="text" name="sku" required value="${product ? Utils.escapeHtml(product.sku) : ''}"
                                class="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-xs text-gray-100 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red" placeholder="Contoh: OLI-001">
                        </div>
                        <div>
                            <label class="block text-[10px] font-semibold text-gray-400 uppercase mb-1">Part Number / OEM *</label>
                            <input type="text" name="part_number" required value="${product ? Utils.escapeHtml(product.part_number || '') : ''}"
                                class="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-xs text-gray-100 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red" placeholder="Contoh: 08232-2M9-K81N9">
                        </div>
                        <div>
                            <label class="block text-[10px] font-semibold text-gray-400 uppercase mb-1">Nama Suku Cadang *</label>
                            <input type="text" name="nama" required value="${product ? Utils.escapeHtml(product.nama) : ''}"
                                class="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-xs text-gray-100 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red" placeholder="Nama spare part lengkap">
                        </div>
                    </div>
                </div>

                <!-- Group 2: Inventori & Kompatibilitas -->
                <div class="border-b border-slate-800 pb-3">
                    <h5 class="text-[10px] font-bold uppercase tracking-wider text-brand-red mb-3">Inventori & Kompatibilitas</h5>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                        <div>
                            <label class="block text-[10px] font-semibold text-gray-400 uppercase mb-1">Kategori *</label>
                            <select name="category_id" required class="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-xs text-gray-100 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red">
                                <option value="">Pilih Kategori</option>
                                ${categoryOptions}
                            </select>
                        </div>
                        <div>
                            <label class="block text-[10px] font-semibold text-gray-400 uppercase mb-1">Satuan *</label>
                            <input type="text" name="satuan" required value="${product ? Utils.escapeHtml(product.satuan) : 'pcs'}"
                                class="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-xs text-gray-100 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red" placeholder="pcs, set, botol">
                        </div>
                        <div>
                            <label class="block text-[10px] font-semibold text-gray-400 uppercase mb-1">Batas Stok Minimum *</label>
                            <input type="number" name="stok_minimum" required min="1" value="${product ? product.stok_minimum : '5'}"
                                class="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-xs text-gray-100 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red font-mono-numbers" placeholder="5">
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                            <label class="block text-[10px] font-semibold text-gray-400 uppercase mb-1">Stok Awal</label>
                            <input type="number" name="stok" ${product ? 'readonly' : ''} min="0" value="${product ? product.stok : '0'}"
                                class="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-xs text-gray-100 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red font-mono-numbers ${product ? 'bg-slate-900 text-gray-500 cursor-not-allowed' : ''}" placeholder="0">
                            ${product ? '<p class="text-[9px] text-gray-500 mt-1">Stok diubah lewat menu Stok Masuk</p>' : ''}
                        </div>
                        <div class="md:col-span-2">
                            <label class="block text-[10px] font-semibold text-gray-400 uppercase mb-1">Kompatibilitas Motor (Pilih Multi)</label>
                            <div class="grid grid-cols-2 gap-2 p-2 bg-slate-950 border border-slate-800 rounded-md max-h-[110px] overflow-y-auto" id="motor-checkbox-container">
                                ${motorCheckboxes}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Group 3: Harga & Keuangan -->
                <div class="border-b border-slate-800 pb-3">
                    <h5 class="text-[10px] font-bold uppercase tracking-wider text-brand-red mb-3">Harga & Keuangan</h5>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label class="block text-[10px] font-semibold text-gray-400 uppercase mb-1">Harga Beli (Rp) *</label>
                            <input type="number" name="harga_beli" required min="0" value="${product ? product.harga_beli : ''}"
                                class="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-xs text-gray-100 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red font-mono-numbers" placeholder="0">
                        </div>
                        <div>
                            <label class="block text-[10px] font-semibold text-gray-400 uppercase mb-1">Harga Jual (Rp) *</label>
                            <input type="number" name="harga_jual" required min="0" value="${product ? product.harga_jual : ''}"
                                class="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-xs text-gray-100 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red font-mono-numbers" placeholder="0">
                        </div>
                    </div>
                </div>

                <!-- Group 4: Tambahan -->
                <div>
                    <h5 class="text-[10px] font-bold uppercase tracking-wider text-brand-red mb-3">Informasi Tambahan</h5>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div class="md:col-span-2">
                            <label class="block text-[10px] font-semibold text-gray-400 uppercase mb-1">Deskripsi / Catatan Spesifikasi</label>
                            <textarea name="deskripsi" rows="2"
                                class="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-xs text-gray-100 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red" placeholder="Keterangan tambahan produk">${product ? Utils.escapeHtml(product.deskripsi || '') : ''}</textarea>
                        </div>
                        <div>
                            <label class="block text-[10px] font-semibold text-gray-400 uppercase mb-1">Status Keaktifan</label>
                            <select name="is_active" class="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-xs text-gray-100 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red">
                                <option value="1" ${product && product.is_active ? 'selected' : ''}>Aktif</option>
                                <option value="0" ${product && !product.is_active ? 'selected' : ''}>Tidak Aktif</option>
                            </select>
                        </div>
                    </div>
                </div>
            </form>
        `;

        const footerHtml = `
            <button type="button" class="px-4 py-2 text-sm text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md" onclick="Utils.closeModal()">Batal</button>
            <button type="button" class="px-4 py-2 text-sm bg-brand-red hover:bg-brand-darkred text-white rounded-md ml-2" id="btn-save-product">Simpan</button>
        `;

        Utils.showModal(title, formHtml, footerHtml);

        document.getElementById('btn-save-product').onclick = () => this.saveProduct();
    },

    saveProduct: async function() {
        const form = document.getElementById('product-form');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        // Get all selected checkboxes for motor and merge to comma-separated string
        const checkedMotors = Array.from(form.querySelectorAll('input[name="motor_models"]:checked'))
            .map(cb => cb.value)
            .join(', ');

        const formData = new FormData(form);
        formData.append('motor', checkedMotors);

        const productId = formData.get('id');
        const btnSave = document.getElementById('btn-save-product');
        Utils.setLoading(btnSave, true, 'Simpan');

        let result;
        if (productId) {
            // Update (PUT)
            // convert formData to JSON object for PUT requests
            const payload = {};
            formData.forEach((value, key) => {
                payload[key] = value;
            });
            // Make sure is_active is boolean formatted
            payload['is_active'] = payload['is_active'] === '1';
            result = await Utils.apiCall(`products`, 'PUT', payload);
        } else {
            // Create (POST)
            // convert standard is_active to 1 or 0 for POST
            formData.set('is_active', formData.get('is_active') === '1' ? '1' : '0');
            result = await Utils.apiCall('products', 'POST', formData);
        }

        Utils.setLoading(btnSave, false, 'Simpan');

        if (result.success) {
            Utils.showToast(productId ? 'Produk berhasil diubah.' : 'Produk baru berhasil didaftarkan.', 'success');
            Utils.closeModal();
            this.loadProducts();
        } else {
            Utils.showToast(result.message || 'Gagal menyimpan data produk.', 'error');
        }
    },

    deleteProduct: async function(id) {
        const confirm = await Utils.confirmDialog('Apakah Anda yakin ingin menghapus / menonaktifkan produk ini? Produk yang memiliki riwayat transaksi akan dinonaktifkan (diarsipkan), sedangkan produk baru tanpa riwayat akan dihapus permanen.');
        if (!confirm) return;

        const result = await Utils.apiCall(`products/${id}`, 'DELETE');
        if (result.success) {
            Utils.showToast(result.message || 'Produk berhasil diproses.', 'success');
            this.loadProducts();
        } else {
            Utils.showToast(result.message || 'Gagal menghapus produk.', 'error');
        }
    }
};

window.Products = Products;