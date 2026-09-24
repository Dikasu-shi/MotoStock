// StockOpname Module for MotoStock

const StockOpname = {
    adjustments: [],
    products: [],

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
            Utils.showToast('Gagal memuat log stock opname.', 'error');
        }
    },

    renderTable: function(data) {
        const tbody = document.getElementById('opname-table-body');
        if (!tbody) return;

        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-gray-500 text-sm">Belum ada pemeriksaan stock opname dicatat.</td></tr>`;
            return;
        }

        tbody.innerHTML = data.map((adj, index) => {
            const qtyDiff = parseInt(adj.qty);
            const badgeClass = qtyDiff > 0 ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20';
            const diffText = qtyDiff > 0 ? `+${qtyDiff}` : `${qtyDiff}`;

            return `
                <tr class="border-b border-slate-850 hover:bg-slate-800/40 transition-colors">
                    <td class="px-4 py-3 text-xs text-center text-gray-500 font-mono-numbers">${index + 1}</td>
                    <td class="px-4 py-3 text-xs text-gray-400">${Utils.formatDateTime(adj.created_at)}</td>
                    <td class="px-4 py-3 text-sm">
                        <div class="font-semibold text-gray-200">${Utils.escapeHtml(adj.product_nama)}</div>
                        <div class="text-[10px] text-gray-500 font-mono-numbers">${Utils.escapeHtml(adj.sku)}</div>
                    </td>
                    <td class="px-4 py-3 text-xs text-gray-400">${Utils.escapeHtml(adj.user_nama)}</td>
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
        const title = 'Stock Opname / Penyesuaian Fisik';

        // Load active products
        const prodRes = await Utils.apiCall('products');
        if (!prodRes.success) {
            Utils.showToast('Gagal memuat daftar produk.', 'error');
            return;
        }

        this.products = prodRes.data.filter(p => parseInt(p.is_active) === 1);

        const productOptions = this.products.map(p => `
            <option value="${p.id}" data-stok="${p.stok}">
                ${Utils.escapeHtml(p.sku)} - ${Utils.escapeHtml(p.nama)} (Stok: ${p.stok})
            </option>
        `).join('');

        const formHtml = `
            <form id="opname-form" class="space-y-4 text-left">
                <div>
                    <label class="block text-xs font-semibold text-gray-400 mb-1">PILIH SUKU CADANG *</label>
                    <select id="opname-product" required class="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-brand-red">
                        <option value="">Pilih Produk...</option>
                        ${productOptions}
                    </select>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-semibold text-gray-400 mb-1">STOK SISTEM (DATABASE)</label>
                        <input type="text" id="opname-stok-sistem" readonly class="w-full bg-slate-900 border border-slate-800 rounded-md px-3 py-2 text-sm text-gray-500 font-mono-numbers focus:outline-none cursor-not-allowed" value="0">
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-gray-400 mb-1">JUMLAH STOK FISIK NYATA *</label>
                        <input type="number" id="opname-stok-fisik" min="0" required class="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-brand-red font-mono-numbers" placeholder="0">
                    </div>
                </div>

                <div>
                    <label class="block text-xs font-semibold text-gray-400 mb-1">ALASAN / KETERANGAN PENYESUAIAN *</label>
                    <input type="text" id="opname-keterangan" required class="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-brand-red" placeholder="Contoh: Barang hilang, selisih hitung, barang rusak">
                </div>
            </form>
        `;

        const footerHtml = `
            <button type="button" class="px-4 py-2 text-sm text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md" onclick="Utils.closeModal()">Batal</button>
            <button type="button" class="px-4 py-2 text-sm bg-brand-red hover:bg-brand-darkred text-white rounded-md ml-2" id="btn-save-opname">Simpan Penyesuaian</button>
        `;

        Utils.showModal(title, formHtml, footerHtml);

        const selectEl = document.getElementById('opname-product');
        const stokSistemInput = document.getElementById('opname-stok-sistem');
        const stokFisikInput = document.getElementById('opname-stok-fisik');

        selectEl.onchange = function() {
            const selectedOpt = selectEl.options[selectEl.selectedIndex];
            const stok = selectedOpt.getAttribute('data-stok') || '0';
            stokSistemInput.value = stok;
            stokFisikInput.value = stok; // default to system value
        };

        document.getElementById('btn-save-opname').onclick = () => this.submitAdjustment();
    },

    submitAdjustment: async function() {
        const form = document.getElementById('opname-form');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const productId = document.getElementById('opname-product').value;
        const physicalQty = document.getElementById('opname-stok-fisik').value;
        const keterangan = document.getElementById('opname-keterangan').value.trim();

        const payload = {
            product_id: parseInt(productId),
            physical_qty: parseInt(physicalQty),
            keterangan: keterangan
        };

        const btnSave = document.getElementById('btn-save-opname');
        Utils.setLoading(btnSave, true, 'Simpan Penyesuaian');

        const response = await Utils.apiCall('stock/adjust', 'POST', payload);
        Utils.setLoading(btnSave, false, 'Simpan Penyesuaian');

        if (response.success) {
            Utils.showToast('Penyesuaian stok berhasil disimpan.', 'success');
            Utils.closeModal();
            this.loadAdjustments();
        } else {
            Utils.showToast(response.message || 'Gagal menyesuaikan stok.', 'error');
        }
    }
};

window.StockOpname = StockOpname;