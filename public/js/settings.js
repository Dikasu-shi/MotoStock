// Settings Module for MotoStock

const Settings = {
    init: async function() {
        this.registerEvents();
        await this.loadSettings();
    },

    registerEvents: function() {
        const btnSave = document.getElementById('btn-save-settings');
        if (btnSave) {
            btnSave.onclick = () => this.saveSettings();
        }
    },

    loadSettings: async function() {
        const form = document.getElementById('settings-form');
        if (!form) return;

        // Show spinner / loading
        const btnSave = document.getElementById('btn-save-settings');
        Utils.setLoading(btnSave, true, 'Simpan Pengaturan');

        const response = await Utils.apiCall('settings');
        Utils.setLoading(btnSave, false, 'Simpan Pengaturan');

        if (response.success && response.data) {
            const data = response.data;
            if (form.elements['store_name']) form.elements['store_name'].value = data.store_name || '';
            if (form.elements['store_tagline']) form.elements['store_tagline'].value = data.store_tagline || '';
            if (form.elements['store_address']) form.elements['store_address'].value = data.store_address || '';
            if (form.elements['store_phone']) form.elements['store_phone'].value = data.store_phone || '';
            if (form.elements['point_rate']) form.elements['point_rate'].value = data.point_rate || '100';

            // Globally cache settings in window object for other modules
            window.AppSettings = data;
        } else {
            Utils.showToast('Gagal memuat pengaturan aplikasi.', 'error');
        }
    },

    saveSettings: async function() {
        const form = document.getElementById('settings-form');
        if (!form || !form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = new FormData(form);
        const payload = {};
        formData.forEach((value, key) => {
            payload[key] = value;
        });

        const btnSave = document.getElementById('btn-save-settings');
        Utils.setLoading(btnSave, true, 'Simpan Pengaturan');

        const response = await Utils.apiCall('settings', 'POST', payload);
        Utils.setLoading(btnSave, false, 'Simpan Pengaturan');

        if (response.success) {
            Utils.showToast('Pengaturan aplikasi berhasil disimpan.', 'success');
            // Cache updated settings
            window.AppSettings = payload;

            // Dynamically update UI branding if necessary
            const brandTitleEl = document.getElementById('sidebar-brand-name');
            if (brandTitleEl) brandTitleEl.textContent = payload.store_name;
            const brandTagEl = document.getElementById('sidebar-brand-tagline');
            if (brandTagEl) brandTagEl.textContent = payload.store_tagline;
        } else {
            Utils.showToast(response.message || 'Gagal menyimpan pengaturan.', 'error');
        }
    }
};

window.Settings = Settings;