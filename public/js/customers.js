// Customers (Member) Module for MyKasir

const Customers = {
    customers: [],

    init: async function() {
        document.getElementById('customer-search-input').value = '';
        this.registerEvents();
        await this.loadCustomers();
    },

    registerEvents: function() {
        const searchInput = document.getElementById('customer-search-input');
        if (searchInput) {
            searchInput.oninput = Utils.debounce(() => this.loadCustomers(), 300);
        }

        const btnAdd = document.getElementById('btn-tambah-customer');
        if (btnAdd) {
            btnAdd.onclick = () => this.showForm();
        }
    },

    loadCustomers: async function() {
        const search = document.getElementById('customer-search-input').value.trim();
        const query = search ? `?search=${encodeURIComponent(search)}` : '';

        const response = await Utils.apiCall(`customers${query}`);
        if (response.success) {
            this.customers = response.data;
            this.renderTable(response.data);
        } else {
            Utils.showToast('Gagal memuat daftar pelanggan.', 'error');
        }
    },

    renderTable: function(customers) {
        const tbody = document.getElementById('customers-table-body');
        if (!tbody) return;

        if (customers.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-slate-500 text-sm">Tidak ada data pelanggan ditemukan.</td></tr>`;
            return;
        }

        tbody.innerHTML = customers.map((c, index) => {
            const isWalkIn = c.nama === 'Umum (Walk-in)';
            return `
                <tr class="border-b border-slate-700/50 hover:bg-slate-800/40 transition-colors">
                    <td class="px-4 py-3 text-xs text-gray-500 font-mono-numbers">${index + 1}</td>
                    <td class="px-4 py-3 text-sm font-semibold text-gray-200">${Utils.escapeHtml(c.nama)} ${isWalkIn ? '<span class="ml-2 text-[10px] bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full border border-slate-700">DEFAULT</span>' : ''}</td>
                    <td class="px-4 py-3 text-sm text-gray-400 font-mono-numbers">${Utils.escapeHtml(c.telepon || '-')}</td>
                    <td class="px-4 py-3 text-sm text-gray-400">${Utils.escapeHtml(c.email || '-')}</td>
                    <td class="px-4 py-3 text-sm text-gray-400 max-w-[200px] truncate" title="${Utils.escapeHtml(c.alamat || '')}">${Utils.escapeHtml(c.alamat || '-')}</td>
                    <td class="px-4 py-3 text-sm text-center font-bold text-amber-500 font-mono-numbers">${Utils.formatNumber(c.poin)}</td>
                    <td class="px-4 py-3 text-sm text-center">
                        ${isWalkIn ? '<span class="text-xs text-gray-600 italic">Sistem</span>' : `
                            <div class="flex items-center justify-center space-x-2">
                                <button class="p-1 text-slate-400 hover:text-blue-500 hover:bg-slate-700 rounded-md transition-colors" onclick="Customers.showForm(${c.id})" title="Edit">
                                    <i data-lucide="edit-3" class="w-4 h-4"></i>
                                </button>
                                <button class="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-700 rounded-md transition-colors" onclick="Customers.deleteCustomer(${c.id})" title="Hapus">
                                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                                </button>
                            </div>
                        `}
                    </td>
                </tr>
            `;
        }).join('');

        lucide.createIcons();
    },

    showForm: function(id = null) {
        const customer = id ? this.customers.find(c => c.id === id) : null;
        const title = customer ? 'Edit Pelanggan / Member' : 'Tambah Pelanggan Baru';

        const formHtml = `
            <form id="customer-form" class="space-y-4 text-left">
                <input type="hidden" name="id" value="${customer ? customer.id : ''}">

                <div>
                    <label class="block text-xs font-semibold text-gray-400 mb-1">NAMA LENGKAP PELANGGAN *</label>
                    <input type="text" name="nama" required value="${customer ? Utils.escapeHtml(customer.nama) : ''}"
                        class="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red" placeholder="Nama Pelanggan / Bengkel">
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-semibold text-gray-400 mb-1">NOMOR TELEPON / WA *</label>
                        <input type="text" name="telepon" required value="${customer ? Utils.escapeHtml(customer.telepon) : ''}"
                            class="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red font-mono-numbers" placeholder="08xxxxxxxxxx">
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-gray-400 mb-1">EMAIL</label>
                        <input type="email" name="email" value="${customer ? Utils.escapeHtml(customer.email || '') : ''}"
                            class="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red" placeholder="email@domain.com">
                    </div>
                </div>

                <div>
                    <label class="block text-xs font-semibold text-gray-400 mb-1">ALAMAT LENGKAP</label>
                    <textarea name="alamat" rows="3"
                        class="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red" placeholder="Alamat rumah / lokasi bengkel partner">${customer ? Utils.escapeHtml(customer.alamat || '') : ''}</textarea>
                </div>
            </form>
        `;

        const footerHtml = `
            <button type="button" class="px-4 py-2 text-sm text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md" onclick="Utils.closeModal()">Batal</button>
            <button type="button" class="px-4 py-2 text-sm bg-brand-red hover:bg-brand-darkred text-white rounded-md ml-2" id="btn-save-customer">Simpan</button>
        `;

        Utils.showModal(title, formHtml, footerHtml);

        document.getElementById('btn-save-customer').onclick = () => this.saveCustomer();
    },

    saveCustomer: async function() {
        const form = document.getElementById('customer-form');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = new FormData(form);
        const customerId = formData.get('id');

        const btnSave = document.getElementById('btn-save-customer');
        Utils.setLoading(btnSave, true, 'Simpan');

        let result;
        if (customerId) {
            const payload = {};
            formData.forEach((value, key) => {
                payload[key] = value;
            });
            result = await Utils.apiCall('customers', 'PUT', payload);
        } else {
            result = await Utils.apiCall('customers', 'POST', formData);
        }

        Utils.setLoading(btnSave, false, 'Simpan');

        if (result.success) {
            Utils.showToast(customerId ? 'Data pelanggan diperbarui.' : 'Pelanggan baru didaftarkan.', 'success');
            Utils.closeModal();
            this.loadCustomers();
        } else {
            Utils.showToast(result.message || 'Gagal menyimpan pelanggan.', 'error');
        }
    },

    deleteCustomer: async function(id) {
        const confirm = await Utils.confirmDialog('Apakah Anda yakin ingin menghapus data pelanggan ini?');
        if (!confirm) return;

        const result = await Utils.apiCall(`customers/${id}`, 'DELETE');
        if (result.success) {
            Utils.showToast('Pelanggan terhapus.', 'success');
            this.loadCustomers();
        } else {
            Utils.showToast(result.message || 'Gagal menghapus data pelanggan.', 'error');
        }
    }
};

window.Customers = Customers;