// Suppliers Module for MyKasir

const Suppliers = {
    suppliers: [],

    init: async function() {
        document.getElementById('supplier-search-input').value = '';
        this.registerEvents();
        await this.loadSuppliers();
    },

    registerEvents: function() {
        const searchInput = document.getElementById('supplier-search-input');
        if (searchInput) {
            searchInput.oninput = Utils.debounce(() => this.loadSuppliers(), 300);
        }

        const btnAdd = document.getElementById('btn-tambah-supplier');
        if (btnAdd) {
            btnAdd.onclick = () => this.showForm();
        }
    },

    loadSuppliers: async function() {
        const search = document.getElementById('supplier-search-input').value.trim();
        const query = search ? `?search=${encodeURIComponent(search)}` : '';

        const response = await Utils.apiCall(`suppliers${query}`);
        if (response.success) {
            this.suppliers = response.data;
            this.renderTable(response.data);
        } else {
            Utils.showToast('Gagal memuat data supplier.', 'error');
        }
    },

    renderTable: function(suppliers) {
        const tbody = document.getElementById('suppliers-table-body');
        if (!tbody) return;

        if (suppliers.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-slate-500 text-sm">Tidak ada data supplier ditemukan.</td></tr>`;
            return;
        }

        tbody.innerHTML = suppliers.map((s, index) => `
            <tr class="border-b border-slate-700/50 hover:bg-slate-800/40 transition-colors">
                <td class="px-4 py-3 text-xs text-gray-500 font-mono-numbers">${index + 1}</td>
                <td class="px-4 py-3 text-sm font-semibold text-gray-200">${Utils.escapeHtml(s.nama)}</td>
                <td class="px-4 py-3 text-sm text-gray-400">${Utils.escapeHtml(s.kontak_person || '-')}</td>
                <td class="px-4 py-3 text-sm text-gray-400 font-mono-numbers">${Utils.escapeHtml(s.telepon || '-')}</td>
                <td class="px-4 py-3 text-sm text-gray-400">${Utils.escapeHtml(s.email || '-')}</td>
                <td class="px-4 py-3 text-sm text-gray-400 max-w-[200px] truncate" title="${Utils.escapeHtml(s.alamat || '')}">${Utils.escapeHtml(s.alamat || '-')}</td>
                <td class="px-4 py-3 text-sm text-center">
                    <div class="flex items-center justify-center space-x-2">
                        <button class="p-1 text-slate-400 hover:text-blue-500 hover:bg-slate-700 rounded-md transition-colors" onclick="Suppliers.showForm(${s.id})" title="Edit">
                            <i data-lucide="edit-3" class="w-4 h-4"></i>
                        </button>
                        <button class="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-700 rounded-md transition-colors" onclick="Suppliers.deleteSupplier(${s.id})" title="Hapus">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        lucide.createIcons();
    },

    showForm: function(id = null) {
        const supplier = id ? this.suppliers.find(s => s.id === id) : null;
        const title = supplier ? 'Edit Data Supplier' : 'Tambah Supplier Baru';

        const formHtml = `
            <form id="supplier-form" class="space-y-4 text-left">
                <input type="hidden" name="id" value="${supplier ? supplier.id : ''}">

                <div>
                    <label class="block text-xs font-semibold text-gray-400 mb-1">NAMA SUPPLIER / DISTRIBUTOR *</label>
                    <input type="text" name="nama" required value="${supplier ? Utils.escapeHtml(supplier.nama) : ''}"
                        class="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red" placeholder="Contoh: PT. Astra Otoparts">
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label class="block text-xs font-semibold text-gray-400 mb-1">CONTACT PERSON (CP) *</label>
                        <input type="text" name="kontak_person" required value="${supplier ? Utils.escapeHtml(supplier.kontak_person) : ''}"
                            class="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red" placeholder="Nama Sales/Admin">
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-gray-400 mb-1">NOMOR TELEPON *</label>
                        <input type="text" name="telepon" required value="${supplier ? Utils.escapeHtml(supplier.telepon) : ''}"
                            class="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red font-mono-numbers" placeholder="021xxxxxxxx / 08xx">
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-gray-400 mb-1">EMAIL</label>
                        <input type="email" name="email" value="${supplier ? Utils.escapeHtml(supplier.email || '') : ''}"
                            class="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red" placeholder="sales@distributor.com">
                    </div>
                </div>

                <div>
                    <label class="block text-xs font-semibold text-gray-400 mb-1">ALAMAT KANTOR/GUDANG</label>
                    <textarea name="alamat" rows="3"
                        class="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red" placeholder="Alamat lengkap distributor">${supplier ? Utils.escapeHtml(supplier.alamat || '') : ''}</textarea>
                </div>
            </form>
        `;

        const footerHtml = `
            <button type="button" class="px-4 py-2 text-sm text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md" onclick="Utils.closeModal()">Batal</button>
            <button type="button" class="px-4 py-2 text-sm bg-brand-red hover:bg-brand-darkred text-white rounded-md ml-2" id="btn-save-supplier">Simpan</button>
        `;

        Utils.showModal(title, formHtml, footerHtml);

        document.getElementById('btn-save-supplier').onclick = () => this.saveSupplier();
    },

    saveSupplier: async function() {
        const form = document.getElementById('supplier-form');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = new FormData(form);
        const supplierId = formData.get('id');

        const btnSave = document.getElementById('btn-save-supplier');
        Utils.setLoading(btnSave, true, 'Simpan');

        let result;
        if (supplierId) {
            const payload = {};
            formData.forEach((value, key) => {
                payload[key] = value;
            });
            result = await Utils.apiCall('suppliers', 'PUT', payload);
        } else {
            result = await Utils.apiCall('suppliers', 'POST', formData);
        }

        Utils.setLoading(btnSave, false, 'Simpan');

        if (result.success) {
            Utils.showToast(supplierId ? 'Data supplier berhasil disimpan.' : 'Supplier baru didaftarkan.', 'success');
            Utils.closeModal();
            this.loadSuppliers();
        } else {
            Utils.showToast(result.message || 'Gagal menyimpan data supplier.', 'error');
        }
    },

    deleteSupplier: async function(id) {
        const confirm = await Utils.confirmDialog('Apakah Anda yakin ingin menghapus data supplier ini?');
        if (!confirm) return;

        const result = await Utils.apiCall(`suppliers/${id}`, 'DELETE');
        if (result.success) {
            Utils.showToast('Supplier berhasil dihapus.', 'success');
            this.loadSuppliers();
        } else {
            Utils.showToast(result.message || 'Gagal menghapus data supplier.', 'error');
        }
    }
};

window.Suppliers = Suppliers;