// Transactions History Module for MyKasir

const Transactions = {
    transactions: [],

    init: async function() {
        // Set default dates: start date is 30 days ago, end date is today
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);

        const formatDateInput = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        document.getElementById('trx-start-date').value = formatDateInput(thirtyDaysAgo);
        document.getElementById('trx-end-date').value = formatDateInput(today);

        this.registerEvents();
        await this.loadTransactions();
    },

    registerEvents: function() {
        const btnFilter = document.getElementById('btn-filter-trx');
        if (btnFilter) {
            btnFilter.onclick = () => this.loadTransactions();
        }
    },

    loadTransactions: async function() {
        const tbody = document.getElementById('transactions-table-body');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center py-6 text-slate-500"><i class="animate-spin inline-block w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full mr-2 align-middle"></i> Memuat data...</td></tr>`;
        }

        const startDate = document.getElementById('trx-start-date').value;
        const endDate = document.getElementById('trx-end-date').value;

        const response = await Utils.apiCall(`transactions?start_date=${startDate}&end_date=${endDate}`);
        if (response.success) {
            this.transactions = response.data;
            this.renderTable(response.data);
        } else {
            Utils.showToast('Gagal memuat riwayat transaksi.', 'error');
        }
    },

    renderTable: function(transactions) {
        const tbody = document.getElementById('transactions-table-body');
        if (!tbody) return;

        if (transactions.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-slate-500 text-sm">Tidak ada transaksi pada periode ini.</td></tr>`;
            return;
        }

        tbody.innerHTML = transactions.map((trx, index) => {
            let methodBadge = '';
            if (trx.metode_bayar === 'tunai') {
                methodBadge = '<span class="bg-green-500/10 text-green-400 text-xs px-2.5 py-0.5 rounded-full border border-green-500/20 font-medium">Tunai</span>';
            } else if (trx.metode_bayar === 'qris') {
                methodBadge = '<span class="bg-blue-500/10 text-blue-400 text-xs px-2.5 py-0.5 rounded-full border border-blue-500/20 font-medium">QRIS</span>';
            } else {
                methodBadge = '<span class="bg-purple-500/10 text-purple-400 text-xs px-2.5 py-0.5 rounded-full border border-purple-500/20 font-medium">Transfer</span>';
            }

            return `
                <tr class="border-b border-slate-700/50 hover:bg-slate-800/40 transition-colors">
                    <td class="px-4 py-3 text-xs text-gray-500 font-mono-numbers">${index + 1}</td>
                    <td class="px-4 py-3 text-sm font-bold font-mono-numbers text-gray-200">${Utils.escapeHtml(trx.no_invoice)}</td>
                    <td class="px-4 py-3 text-xs text-gray-400 font-mono-numbers">${Utils.formatDateTime(trx.created_at)}</td>
                    <td class="px-4 py-3 text-sm text-gray-300">${Utils.escapeHtml(trx.kasir_nama || '-')}</td>
                    <td class="px-4 py-3 text-sm text-gray-300">${Utils.escapeHtml(trx.customer_nama || 'Umum (Walk-in)')}</td>
                    <td class="px-4 py-3 text-sm text-right font-semibold font-mono-numbers text-amber-500">${Utils.formatRupiah(trx.total)}</td>
                    <td class="px-4 py-3 text-sm text-center">${methodBadge}</td>
                    <td class="px-4 py-3 text-sm text-center">
                        <button class="px-3 py-1 bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-500 hover:text-white rounded-md text-xs font-semibold transition-all" onclick="Transactions.showDetail(${trx.id})">
                            Detail / Struk
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        lucide.createIcons();
    },

    showDetail: async function(id) {
        const response = await Utils.apiCall(`transactions/${id}`);
        if (!response.success) {
            Utils.showToast('Gagal memuat detail transaksi.', 'error');
            return;
        }

        const trx = response.data;
        const items = trx.items || [];

        const contentHtml = `
            <div class="space-y-4 text-left">
                <!-- Info Header -->
                <div class="grid grid-cols-2 gap-4 bg-slate-900/60 p-3 rounded-md border border-slate-800 text-xs">
                    <div>
                        <div class="text-gray-500">NOMOR INVOICE</div>
                        <div class="font-bold text-gray-200 font-mono-numbers">${trx.no_invoice}</div>
                        <div class="text-gray-500 mt-2">TANGGAL TRANSAKSI</div>
                        <div class="text-gray-300 font-mono-numbers">${Utils.formatDateTime(trx.created_at)}</div>
                    </div>
                    <div>
                        <div class="text-gray-500">NAMA KASIR</div>
                        <div class="text-gray-300 font-semibold">${trx.kasir_nama}</div>
                        <div class="text-gray-500 mt-2">MEMBER / PELANGGAN</div>
                        <div class="text-gray-300 font-semibold">${trx.customer_nama}</div>
                    </div>
                </div>

                <!-- Items Table -->
                <div>
                    <h5 class="text-xs font-semibold text-gray-400 mb-2">DAFTAR BARANG YANG DIBELI</h5>
                    <div class="overflow-x-auto border border-slate-800 rounded-md">
                        <table class="w-full text-xs">
                            <thead>
                                <tr class="bg-slate-800 text-gray-400 border-b border-slate-700">
                                    <th class="px-3 py-2 text-left">Spare Part</th>
                                    <th class="px-3 py-2 text-right">Harga Satuan</th>
                                    <th class="px-3 py-2 text-center">Qty</th>
                                    <th class="px-3 py-2 text-right">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${items.map(item => `
                                    <tr class="border-b border-slate-800/80">
                                        <td class="px-3 py-2">
                                            <div class="font-medium text-gray-300">${Utils.escapeHtml(item.nama_produk)}</div>
                                        </td>
                                        <td class="px-3 py-2 text-right font-mono-numbers text-gray-400">${Utils.formatRupiah(item.harga)}</td>
                                        <td class="px-3 py-2 text-center font-bold text-gray-300 font-mono-numbers">${item.qty}</td>
                                        <td class="px-3 py-2 text-right font-semibold font-mono-numbers text-gray-200">${Utils.formatRupiah(item.subtotal)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Summary -->
                <div class="flex justify-end pt-2">
                    <div class="w-64 space-y-1.5 text-xs">
                        <div class="flex justify-between text-gray-400">
                            <span>Subtotal:</span>
                            <span class="font-mono-numbers text-gray-200">${Utils.formatRupiah(trx.subtotal)}</span>
                        </div>
                        ${parseFloat(trx.diskon) > 0 ? `
                            <div class="flex justify-between text-red-400">
                                <span>Potongan Diskon:</span>
                                <span class="font-mono-numbers">-${Utils.formatRupiah(trx.diskon)}</span>
                            </div>
                        ` : ''}
                        <div class="flex justify-between font-bold text-sm text-gray-200 border-t border-slate-700 pt-1.5">
                            <span>Total Tagihan:</span>
                            <span class="font-mono-numbers text-amber-500">${Utils.formatRupiah(trx.total)}</span>
                        </div>
                        <div class="flex justify-between text-gray-400">
                            <span>Bayar (${trx.metode_bayar.toUpperCase()}):</span>
                            <span class="font-mono-numbers text-gray-200">${Utils.formatRupiah(trx.bayar)}</span>
                        </div>
                        <div class="flex justify-between text-gray-400 border-t border-slate-800 pt-1">
                            <span>Kembalian:</span>
                            <span class="font-mono-numbers text-green-400 font-semibold">${Utils.formatRupiah(trx.kembalian)}</span>
                        </div>
                    </div>
                </div>

                ${trx.catatan ? `
                    <div class="bg-slate-900/40 p-2.5 rounded-md border border-slate-800 text-xs">
                        <span class="font-semibold text-gray-400">Catatan Internal:</span>
                        <p class="text-gray-400 italic mt-0.5">${Utils.escapeHtml(trx.catatan)}</p>
                    </div>
                ` : ''}
            </div>
        `;

        const footerHtml = `
            <div class="flex justify-between w-full">
                <!-- Void Transaction Button for Admin Roles -->
                ${Auth.currentUser && Auth.currentUser.role === 'admin' ? `
                    <button class="px-3 py-1.5 bg-red-950/40 text-red-400 border border-red-900/30 hover:bg-red-900 hover:text-white rounded-md text-xs font-semibold" onclick="Transactions.void(${trx.id})">
                        <i data-lucide="trash-2" class="w-3.5 h-3.5 inline mr-1"></i> Batalkan Transaksi (Void)
                    </button>
                ` : '<div></div>'}

                <div class="flex space-x-2">
                    <button class="px-4 py-2 text-xs bg-slate-800 text-slate-400 hover:text-white rounded-md" onclick="Utils.closeModal()">Tutup</button>
                    <button class="px-4 py-2 text-xs bg-brand-red hover:bg-brand-darkred text-white rounded-md" onclick="POS.showReceipt(${trx.id})">
                        <i data-lucide="printer" class="w-4 h-4 inline mr-1"></i> Buka Cetak Struk
                    </button>
                </div>
            </div>
        `;

        Utils.showModal('Detail Transaksi Penjualan', contentHtml, footerHtml);
    },

    void: async function(id) {
        const confirm = await Utils.confirmDialog('PERHATIAN! Apakah Anda yakin ingin membatalkan transaksi ini (Void)? Pembatalan akan memulihkan stok produk kembali seperti sebelum transaksi, dan menghapus invoice ini dari pembukuan.');
        if (!confirm) return;

        Utils.closeModal(); // Close detail modal

        const response = await Utils.apiCall(`transactions/${id}/void`, 'POST');
        if (response.success) {
            Utils.showToast('Transaksi berhasil dibatalkan. Stok barang telah dipulihkan.', 'success');
            this.loadTransactions();
        } else {
            Utils.showToast(response.message || 'Gagal membatalkan transaksi.', 'error');
        }
    }
};

window.Transactions = Transactions;