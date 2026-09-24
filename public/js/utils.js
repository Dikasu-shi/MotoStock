// Utilities and helper functions for MyKasir

const Utils = {
    // Format number to Rupiah currency
    formatRupiah: function(number) {
        if (number === null || number === undefined) return 'Rp 0';
        return 'Rp ' + parseFloat(number).toLocaleString('id-ID', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
    },

    // Format generic number with thousand separator
    formatNumber: function(number) {
        if (number === null || number === undefined) return '0';
        return parseFloat(number).toLocaleString('id-ID');
    },

    // Format date string to Indonesian style (e.g. 12 Jul 2026)
    formatDate: function(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;

        const months = [
            'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
            'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
        ];
        return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    },

    // Format date and time string to Indonesian style (e.g. 12 Jul 2026, 14:30)
    formatDateTime: function(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;

        const months = [
            'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
            'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
        ];

        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}, ${hours}:${minutes}`;
    },

    // Standard AJAX fetch helper for PHP backend endpoints
    apiCall: async function(endpoint, method = 'GET', data = null) {
        // Auto-detect base path (e.g. /mykasir/ or /)
        const pathParts = window.location.pathname.split('/');
        if (pathParts[pathParts.length - 1].endsWith('.html') || pathParts[pathParts.length - 1].endsWith('.php')) {
            pathParts.pop();
        }

        let basePath = pathParts.join('/');
        let apiBase = '';

        if (basePath.endsWith('/public') || basePath.endsWith('/public/')) {
            apiBase = basePath.replace(/\/public\/?$/, '') + '/api/';
        } else {
            apiBase = basePath + (basePath.endsWith('/') ? '' : '/') + 'api/';
        }

        // Clean double slashes
        apiBase = apiBase.replace(/\/+/g, '/');
        if (!apiBase.startsWith('/')) apiBase = '/' + apiBase;

        // Strip duplicate api/ prefix or leading slash if provided
        const cleanEndpoint = endpoint.replace(/^\/?(api\/)?/, '');
        const url = `${apiBase}${cleanEndpoint}`;

        const options = {
            method: method,
            credentials: 'same-origin',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        };

        if (data) {
            if (data instanceof FormData) {
                options.body = data;
                // Don't set Content-Type header when using FormData, browser will do it with boundary
            } else {
                options.headers['Content-Type'] = 'application/json';
                options.body = JSON.stringify(data);
            }
        }

        try {
            const response = await fetch(url, options);

            // Check session expiry or unauthorized
            if (response.status === 401) {
                if (cleanEndpoint !== 'auth/check') {
                    Utils.showToast('Sesi Anda telah habis. Silakan login kembali.', 'error');
                    window.location.hash = '#login';
                }
                return { success: false, message: 'Unauthorized' };
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('API Call Error:', error);
            Utils.showToast('Gagal terhubung ke server. Periksa koneksi Anda.', 'error');
            return { success: false, message: 'Network or Server Error' };
        }
    },

    // Floating notification (toast) helper
    showToast: function(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        // Toast element
        const toast = document.createElement('div');
        toast.className = `flex items-center w-full max-w-xs p-4 mb-3 text-gray-100 rounded-md shadow glass-panel border-l-4 animate-slide-in`;

        // Colors and icons based on type
        let borderClass = 'border-green-500';
        let iconHtml = '<i data-lucide="check-circle-2" class="text-green-500 mr-3 w-5 h-5 flex-shrink-0"></i>';

        if (type === 'error') {
            borderClass = 'border-red-500';
            iconHtml = '<i data-lucide="x-circle" class="text-red-500 mr-3 w-5 h-5 flex-shrink-0"></i>';
        } else if (type === 'warning') {
            borderClass = 'border-yellow-500';
            iconHtml = '<i data-lucide="alert-triangle" class="text-yellow-500 mr-3 w-5 h-5 flex-shrink-0"></i>';
        } else if (type === 'info') {
            borderClass = 'border-blue-500';
            iconHtml = '<i data-lucide="info" class="text-blue-500 mr-3 w-5 h-5 flex-shrink-0"></i>';
        }

        toast.classList.add(borderClass);
        toast.innerHTML = `
            ${iconHtml}
            <div class="text-sm font-medium text-gray-200 pr-2">${message}</div>
            <button type="button" class="ml-auto -mx-1.5 -my-1.5 text-gray-400 hover:text-white rounded-md focus:ring-2 focus:ring-gray-300 p-1.5 inline-flex h-8 w-8 items-center justify-center" onclick="this.parentElement.remove()">
                <span class="sr-only">Close</span>
                <i data-lucide="x" class="w-4 h-4"></i>
            </button>
        `;

        container.appendChild(toast);
        lucide.createIcons();

        // Auto remove toast after 3.5s
        setTimeout(() => {
            toast.classList.add('animate-fade-out');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3500);
    },

    // Modal dialog manager
    showModal: function(title, contentHtml, footerHtml = '') {
        const overlay = document.getElementById('modal-overlay');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        const modalFooter = document.getElementById('modal-footer');

        if (!overlay) return;

        modalTitle.textContent = title;
        modalBody.innerHTML = contentHtml;

        if (footerHtml) {
            modalFooter.innerHTML = footerHtml;
            modalFooter.classList.remove('hidden');
        } else {
            modalFooter.innerHTML = '';
            modalFooter.classList.add('hidden');
        }

        overlay.classList.remove('hidden');
        overlay.classList.add('flex');

        // Render lucide icons in modal
        lucide.createIcons();
    },

    closeModal: function() {
        const overlay = document.getElementById('modal-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
            overlay.classList.remove('flex');
        }
    },

    // Simple confirmation modal dialog
    confirmDialog: function(message) {
        return new Promise((resolve) => {
            const footerHtml = `
                <button type="button" class="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 rounded-md hover:bg-slate-700 hover:text-white focus:outline-none" id="confirm-btn-cancel">Batal</button>
                <button type="button" class="px-4 py-2 text-sm font-medium text-white bg-brand-red rounded-md hover:bg-brand-darkred focus:outline-none ml-2" id="confirm-btn-yes">Ya, Lanjutkan</button>
            `;

            Utils.showModal(
                'Konfirmasi Tindakan',
                `<div class="flex items-center space-x-3 p-2">
                    <div class="bg-red-500/10 p-3 rounded-md flex-shrink-0 text-red-500">
                        <i data-lucide="alert-triangle" class="w-6 h-6"></i>
                    </div>
                    <p class="text-gray-300 text-sm">${message}</p>
                </div>`,
                footerHtml
            );

            document.getElementById('confirm-btn-cancel').addEventListener('click', () => {
                Utils.closeModal();
                resolve(false);
            });

            document.getElementById('confirm-btn-yes').addEventListener('click', () => {
                Utils.closeModal();
                resolve(true);
            });
        });
    },

    // Set loading state on action buttons
    setLoading: function(element, isLoading, defaultText = 'Simpan') {
        if (!element) return;
        if (isLoading) {
            element.disabled = true;
            element.innerHTML = `
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Memproses...
            `;
        } else {
            element.disabled = false;
            element.innerHTML = defaultText;
        }
    },

    // Debounce function to limit rapid calls (e.g. search keyboard entry)
    debounce: function(func, wait) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    },

    // Escape raw input data
    escapeHtml: function(text) {
        if (!text) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return String(text).replace(/[&<>"']/g, function(m) { return map[m]; });
    },

    // Standard empty state component generator
    emptyState: function(message, iconName = 'folder-open') {
        return `
            <div class="flex flex-col items-center justify-center p-8 text-center text-gray-500">
                <i data-lucide="${iconName}" class="w-12 h-12 mb-3 text-gray-600"></i>
                <p class="text-sm font-medium">${message}</p>
            </div>
        `;
    }
};

// Export to global scope
window.Utils = Utils;