// Categories Module for MyKasir

const Categories = {
    categories: [],

    init: async function() {
        this.registerEvents();
        await this.loadCategories();
    },

    registerEvents: function() {
        const btnAdd = document.getElementById('btn-tambah-kategori');
        if (btnAdd) {
            btnAdd.onclick = () => this.showForm();
        }
    },

    loadCategories: async function() {
        const listContainer = document.getElementById('categories-list');
        if (listContainer) {
            listContainer.innerHTML = `<div class="col-span-full text-center py-6 text-slate-500"><i class="animate-spin inline-block w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full mr-2 align-middle"></i> Memuat data...</div>`;
        }

        const response = await Utils.apiCall('categories');
        if (response.success) {
            this.categories = response.data;
            this.renderList(response.data);
        } else {
            Utils.showToast('Gagal memuat kategori.', 'error');
        }
    },

    renderList: function(categories) {
        const listContainer = document.getElementById('categories-list');
        if (!listContainer) return;

        if (categories.length === 0) {
            listContainer.innerHTML = `<div class="col-span-full py-8 text-center text-slate-500 text-sm">Tidak ada kategori. Tambahkan baru!</div>`;
            return;
        }

        listContainer.innerHTML = categories.map(cat => `
            <div class="bg-slate-900 border border-slate-800 rounded-md p-4 flex flex-col justify-between hover:border-brand-red/40 transition-colors">
                <div>
                    <div class="flex items-center justify-between">
                        <div class="p-2 bg-slate-800 text-slate-400 rounded-md border border-slate-700/60 inline-flex items-center justify-center">
                            <i data-lucide="package" class="w-5 h-5"></i>
                        </div>
                        <div class="flex space-x-1">
                            <button class="p-1 hover:text-blue-400 text-slate-400 transition-colors" onclick="Categories.showForm(${cat.id})" title="Edit">
                                <i data-lucide="edit-3" class="w-4 h-4"></i>
                            </button>
                            <button class="p-1 hover:text-red-500 text-slate-400 transition-colors" onclick="Categories.deleteCategory(${cat.id})" title="Hapus">
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                    <h4 class="text-base font-bold text-gray-200 mt-3">${Utils.escapeHtml(cat.nama)}</h4>
                    <p class="text-xs text-gray-400 mt-1.5 min-h-[36px] line-clamp-2">${Utils.escapeHtml(cat.deskripsi || 'Tidak ada deskripsi.')}</p>
                </div>
                <div class="mt-4 pt-3 border-t border-slate-700/40 flex justify-between items-center text-xs">
                    <span class="text-gray-400">Total Produk:</span>
                    <span class="font-bold text-gray-300 font-mono-numbers bg-slate-950 px-2.5 py-0.5 rounded border border-slate-800">${cat.total_produk || 0} Item</span>
                </div>
            </div>
        `).join('');

        lucide.createIcons();
    },

    showForm: function(id = null) {
        const category = id ? this.categories.find(c => c.id === id) : null;
        const title = category ? 'Edit Kategori' : 'Tambah Kategori Baru';

        const formHtml = `
            <form id="category-form" class="space-y-4 text-left">
                <input type="hidden" name="id" value="${category ? category.id : ''}">

                <div class="grid grid-cols-4 gap-4">
                    <div class="col-span-3">
                        <label class="block text-xs font-semibold text-gray-400 mb-1">NAMA KATEGORI *</label>
                        <input type="text" name="nama" required value="${category ? Utils.escapeHtml(category.nama) : ''}"
                            class="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red" placeholder="Contoh: Oli & Pelumas">
                    </div>
                    <div class="col-span-1">
                        <label class="block text-xs font-semibold text-gray-400 mb-1 text-center">ICON / EMOJI</label>
                        <input type="text" name="icon" value="${category ? Utils.escapeHtml(category.icon || '') : '📦'}"
                            class="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-center text-gray-100 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red" placeholder="📦">
                    </div>
                </div>

                <div>
                    <label class="block text-xs font-semibold text-gray-400 mb-1">DESKRIPSI KATEGORI</label>
                    <textarea name="deskripsi" rows="3"
                        class="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red" placeholder="Keterangan singkat tentang kelompok spare part">${category ? Utils.escapeHtml(category.deskripsi || '') : ''}</textarea>
                </div>
            </form>
        `;

        const footerHtml = `
            <button type="button" class="px-4 py-2 text-sm text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md" onclick="Utils.closeModal()">Batal</button>
            <button type="button" class="px-4 py-2 text-sm bg-brand-red hover:bg-brand-darkred text-white rounded-md ml-2" id="btn-save-category">Simpan</button>
        `;

        Utils.showModal(title, formHtml, footerHtml);

        document.getElementById('btn-save-category').onclick = () => this.saveCategory();
    },

    saveCategory: async function() {
        const form = document.getElementById('category-form');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = new FormData(form);
        const categoryId = formData.get('id');

        const btnSave = document.getElementById('btn-save-category');
        Utils.setLoading(btnSave, true, 'Simpan');

        let result;
        if (categoryId) {
            const payload = {};
            formData.forEach((value, key) => {
                payload[key] = value;
            });
            result = await Utils.apiCall('categories', 'PUT', payload);
        } else {
            result = await Utils.apiCall('categories', 'POST', formData);
        }

        Utils.setLoading(btnSave, false, 'Simpan');

        if (result.success) {
            Utils.showToast(categoryId ? 'Kategori berhasil diperbarui.' : 'Kategori baru berhasil dibuat.', 'success');
            Utils.closeModal();
            this.loadCategories();
        } else {
            Utils.showToast(result.message || 'Gagal menyimpan kategori.', 'error');
        }
    },

    deleteCategory: async function(id) {
        const confirm = await Utils.confirmDialog('Apakah Anda yakin ingin menghapus kategori ini? Kategori hanya bisa dihapus jika tidak ada produk aktif di dalamnya.');
        if (!confirm) return;

        const result = await Utils.apiCall(`categories/${id}`, 'DELETE');
        if (result.success) {
            Utils.showToast('Kategori berhasil dihapus.', 'success');
            this.loadCategories();
        } else {
            Utils.showToast(result.message || 'Gagal menghapus kategori.', 'error');
        }
    }
};

window.Categories = Categories;