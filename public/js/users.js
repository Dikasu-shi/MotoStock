// Users Management Module for MotoStock

const Users = {
    users: [],

    init: async function() {
        this.registerEvents();
        await this.loadUsers();
    },

    registerEvents: function() {
        const btnAdd = document.getElementById('btn-tambah-user');
        if (btnAdd) {
            btnAdd.onclick = () => this.showForm();
        }
    },

    loadUsers: async function() {
        const tbody = document.getElementById('users-table-body');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center py-6 text-slate-500"><i class="animate-spin inline-block w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full mr-2 align-middle"></i> Memuat data...</td></tr>`;
        }

        const response = await Utils.apiCall('users');
        if (response.success) {
            this.users = response.data;
            this.renderTable(this.users);
        } else {
            Utils.showToast('Gagal memuat daftar pengguna.', 'error');
        }
    },

    renderTable: function(users) {
        const tbody = document.getElementById('users-table-body');
        if (!tbody) return;

        if (users.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-gray-500 text-sm">Tidak ada pengguna terdaftar.</td></tr>`;
            return;
        }

        tbody.innerHTML = users.map((user, index) => {
            const roleBadge = user.role === 'admin'
                ? '<span class="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 uppercase">Admin</span>'
                : '<span class="px-2.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">Kasir</span>';

            const isActive = user.is_active === true || user.is_active === 1 || user.is_active === '1';
            const statusBadge = isActive
                ? '<span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-green-500/10 text-green-400 border border-green-500/20 uppercase">Aktif</span>'
                : '<span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-500 border border-slate-700 uppercase">Nonaktif</span>';

            return `
                <tr class="border-b border-slate-850 hover:bg-slate-800/40 transition-colors">
                    <td class="px-4 py-3 text-xs text-center text-gray-500 font-mono-numbers">${index + 1}</td>
                    <td class="px-4 py-3 text-sm font-semibold text-gray-200">${Utils.escapeHtml(user.nama)}</td>
                    <td class="px-4 py-3 text-sm text-gray-400">${Utils.escapeHtml(user.username)}</td>
                    <td class="px-4 py-3 text-center">${roleBadge}</td>
                    <td class="px-4 py-3 text-center">${statusBadge}</td>
                    <td class="px-4 py-3 text-sm text-center">
                        <div class="flex items-center justify-center space-x-2">
                            <button class="p-1 text-slate-400 hover:text-blue-500 hover:bg-slate-700 rounded transition-colors" onclick="Users.showForm(${user.id})" title="Edit">
                                <i data-lucide="edit-3" class="w-4 h-4"></i>
                            </button>
                            <button class="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-700 rounded transition-colors" onclick="Users.deleteUser(${user.id})" title="Hapus">
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        lucide.createIcons();
    },

    showForm: function(id = null) {
        const user = id ? this.users.find(u => u.id === id) : null;
        const title = user ? 'Edit Akun Pengguna' : 'Tambah Pengguna Baru';
        const isActive = user ? (user.is_active === true || user.is_active === 1 || user.is_active === '1') : true;

        const formHtml = `
            <form id="user-form" class="space-y-4 text-left">
                <input type="hidden" name="id" value="${user ? user.id : ''}">

                <div>
                    <label class="block text-xs font-semibold text-gray-400 mb-1">NAMA LENGKAP *</label>
                    <input type="text" name="nama" required value="${user ? Utils.escapeHtml(user.nama) : ''}"
                        class="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-brand-red" placeholder="Nama Lengkap Karyawan">
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-semibold text-gray-400 mb-1">USERNAME *</label>
                        <input type="text" name="username" required value="${user ? Utils.escapeHtml(user.username) : ''}"
                            class="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-brand-red" placeholder="username">
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-gray-400 mb-1">ROLE *</label>
                        <select name="role" required class="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-brand-red">
                            <option value="kasir" ${user && user.role === 'kasir' ? 'selected' : ''}>Kasir / Staff</option>
                            <option value="admin" ${user && user.role === 'admin' ? 'selected' : ''}>Administrator</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label class="block text-xs font-semibold text-gray-400 mb-1">PASSWORD ${user ? '(KOSONGKAN JIKA TIDAK DIUBAH)' : '*'}</label>
                    <input type="password" name="password" ${user ? '' : 'required'} minlength="6"
                        class="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-brand-red" placeholder="Minimal 6 karakter">
                </div>

                <div>
                    <label class="block text-xs font-semibold text-gray-400 mb-1">STATUS</label>
                    <select name="is_active" class="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-brand-red">
                        <option value="1" ${isActive ? 'selected' : ''}>Aktif</option>
                        <option value="0" ${!isActive ? 'selected' : ''}>Nonaktif</option>
                    </select>
                </div>
            </form>
        `;

        const footerHtml = `
            <button type="button" class="px-4 py-2 text-sm text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md" onclick="Utils.closeModal()">Batal</button>
            <button type="button" class="px-4 py-2 text-sm bg-brand-red hover:bg-brand-darkred text-white rounded-md ml-2" id="btn-save-user">Simpan</button>
        `;

        Utils.showModal(title, formHtml, footerHtml);

        document.getElementById('btn-save-user').onclick = () => this.saveUser();
    },

    saveUser: async function() {
        const form = document.getElementById('user-form');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = new FormData(form);
        const userId = formData.get('id');

        const btnSave = document.getElementById('btn-save-user');
        Utils.setLoading(btnSave, true, 'Simpan');

        let result;
        if (userId) {
            // Update (PUT)
            const payload = {};
            formData.forEach((value, key) => {
                payload[key] = value;
            });
            payload['is_active'] = payload['is_active'] === '1' || payload['is_active'] === true;
            result = await Utils.apiCall('users', 'PUT', payload);
        } else {
            // Create (POST)
            formData.set('is_active', formData.get('is_active') === '1' ? '1' : '0');
            result = await Utils.apiCall('users', 'POST', formData);
        }

        Utils.setLoading(btnSave, false, 'Simpan');

        if (result.success) {
            Utils.showToast(userId ? 'Akun pengguna berhasil diperbarui.' : 'Pengguna baru berhasil ditambahkan.', 'success');
            Utils.closeModal();
            this.loadUsers();
        } else {
            Utils.showToast(result.message || 'Gagal menyimpan akun pengguna.', 'error');
        }
    },

    deleteUser: async function(id) {
        const confirm = await Utils.confirmDialog('Apakah Anda yakin ingin menghapus pengguna ini?');
        if (!confirm) return;

        const result = await Utils.apiCall(`users/${id}`, 'DELETE');
        if (result.success) {
            Utils.showToast(result.message || 'Pengguna berhasil dihapus.', 'success');
            this.loadUsers();
        } else {
            Utils.showToast(result.message || 'Gagal menghapus pengguna.', 'error');
        }
    }
};

window.Users = Users;