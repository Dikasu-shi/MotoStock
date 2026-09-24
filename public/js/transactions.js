// Transactions History Module for MotoStock

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

        const startDateInput = document.getElementById('trx-start-date');
        const endDateInput = document.getElementById('trx-end-date');

        if (startDateInput) startDateInput.value = formatDateInput(thirtyDaysAgo);
        if (endDateInput) endDateInput.value = formatDateInput(today);

        this.registerEvents();
        await this.loadTransactions();
    },

    registerEvents: function() {
        const btnFilter = document.getElementById('btn-filter-trx');
        if (btnFilter) {
            btnFilter.onclick = () => this.loadTransactions();
        }

        const statusFilter = document.getElementById('trx-payment-status');
        if (statusFilter) {
            statusFilter.onchange = () => this.loadTransactions();
        }
    },

    loadTransactions: async function() {
        const tbody = document.getElementById('transactions-table-body');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="10" class="text-center py-6 text-slate-500"><i class="animate-spin inline-block w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full mr-2 align-middle"></i> Memuat data...</td></tr>`;
        }

        const startDate = document.getElementById('trx-start-date')?.value || '';
        const endDate = document.getElementById('trx-end-date')?.value || '';
        const paymentStatus = document.getElementById('trx-payment-status')?.value || '';

        let query = `transactions?start_date=${startDate}&end_date=${endDate}`;
        if (paymentStatus) {
            query += `&status_pembayaran=${encodeURIComponent(paymentStatus)}`;
        }

        const response = await Utils.apiCall(query);
        if (response.success) {
            this.transactions = response.data;
            this.renderTable(response.data);
        } else {
            Utils.showToast('Gagal memuat riwayat transaksi.', 'error');
        }
    },

    getPaymentBadge: function(status) {
        status = status || 'Dibayar';
        if (status === 'Dibayar') {
            return '<span class="inline-flex items-center bg-emerald-500/10 text-emerald-400 text-xs px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-medium"><i data-lucide="check-circle-2" class="w-3 h-3 mr-1"></i> Dibayar</span>';
        }
        if (status === 'Menunggu Konfirmasi') {
            return '<span class="inline-flex items-center bg-sky-500/10 text-sky-400 text-xs px-2.5 py-0.5 rounded-full border border-sky-500/20 font-medium animate-pulse"><i data-lucide="clock" class="w-3 h-3 mr-1"></i> Konfirmasi</span>';
        }
        if (status === 'Ditolak') {
            return '<span class="inline-flex items-center bg-red-500/10 text-red-400 text-xs px-2.5 py-0.5 rounded-full border border-red-500/20 font-medium"><i data-lucide="x-circle" class="w-3 h-3 mr-1"></i> Ditolak</span>';
        }
        return '<span class="inline-flex items-center bg-amber-500/10 text-amber-400 text-xs px-2.5 py-0.5 rounded-full border border-amber-500/20 font-medium"><i data-lucide="clock" class="w-3 h-3 mr-1"></i> Menunggu Bayar</span>';
    },

    getOrderBadge: function(status) {
        status = status || 'Selesai';
        if (status === 'Selesai') {
            return '<span class="inline-flex items-center bg-emerald-500/10 text-emerald-400 text-xs px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-medium">Selesai</span>';
        }
        if (status === 'Diproses') {
            return '<span class="inline-flex items-center bg-blue-500/10 text-blue-400 text-xs px-2.5 py-0.5 rounded-full border border-blue-500/20 font-medium">Diproses</span>';
        }
        if (status === 'Dibatalkan') {
            return '<span class="inline-flex items-center bg-red-500/10 text-red-400 text-xs px-2.5 py-0.5 rounded-full border border-red-500/20 font-medium">Dibatalkan</span>';
        }
        return '<span class="inline-flex items-center bg-slate-800 text-slate-400 text-xs px-2.5 py-0.5 rounded-full border border-slate-700 font-medium">Menunggu Bayar</span>';
    },

    renderTable: function(transactions) {
        const tbody = document.getElementById('transactions-table-body');
        if (!tbody) return;

        if (transactions.length === 0) {
            tbody.innerHTML = `<tr><td colspan="10" class="text-center py-8 text-slate-500 text-sm">Tidak ada transaksi pada periode ini.</td></tr>`;
            return;
        }

        tbody.innerHTML = transactions.map((trx, index) => {
            let methodBadge = '';
            if (trx.metode_bayar === 'tunai') {
                methodBadge = '<span class="bg-green-500/10 text-green-400 text-xs px-2.5 py-0.5 rounded-full border border-green-500/20 font-medium">Tunai</span>';
            } else if (trx.metode_bayar === 'qris') {
                methodBadge = '<span class="bg-blue-500/10 text-blue-400 text-xs px-2.5 py-0.5 rounded-full border border-blue-500/20 font-medium">QRIS</span>';
            } else {
                const bankLabel = trx.bank ? `Transfer (${trx.bank})` : 'Transfer';
                methodBadge = `<span class="bg-purple-500/10 text-purple-400 text-xs px-2.5 py-0.5 rounded-full border border-purple-500/20 font-medium">${bankLabel}</span>`;
            }

            const isPendingConfirm = trx.status_pembayaran === 'Menunggu Konfirmasi';
            const rowClass = isPendingConfirm
                ? 'border-b border-sky-500/30 bg-sky-950/20 hover:bg-sky-900/30 transition-colors'
                : 'border-b border-slate-700/50 hover:bg-slate-800/40 transition-colors';

            return `
                <tr class="${rowClass}">
                    <td class="px-4 py-3 text-xs text-gray-500 font-mono-numbers text-center">${index + 1}</td>
                    <td class="px-4 py-3 text-sm font-bold font-mono-numbers text-gray-200">${Utils.escapeHtml(trx.no_invoice)}</td>
                    <td class="px-4 py-3 text-xs text-gray-400 font-mono-numbers">${Utils.formatDateTime(trx.created_at)}</td>
                    <td class="px-4 py-3 text-sm text-gray-300">${Utils.escapeHtml(trx.kasir_nama || '-')}</td>
                    <td class="px-4 py-3 text-sm text-gray-300">${Utils.escapeHtml(trx.customer_nama || 'Umum (Walk-in)')}</td>
                    <td class="px-4 py-3 text-sm text-right font-semibold font-mono-numbers text-amber-500">${Utils.formatRupiah(trx.total)}</td>
                    <td class="px-4 py-3 text-sm text-center">${methodBadge}</td>
                    <td class="px-4 py-3 text-sm text-center">${this.getPaymentBadge(trx.status_pembayaran)}</td>
                    <td class="px-4 py-3 text-sm text-center">${this.getOrderBadge(trx.status_pesanan)}</td>
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
        const statusPembayaran = trx.status_pembayaran || 'Dibayar';
        const statusPesanan = trx.status_pesanan || 'Selesai';

        let statusBanner = '';
        if (statusPembayaran === 'Menunggu Konfirmasi') {
            statusBanner = `
                <div class="p-3 bg-sky-500/10 border border-sky-500/20 rounded-md text-xs flex items-center justify-between">
                    <div class="flex items-center space-x-2 text-sky-400">
                        <i data-lucide="help-circle" class="w-4 h-4"></i>
                        <span class="font-semibold">Pelanggan telah mengupload bukti pembayaran dan menunggu verifikasi Anda.</span>
                    </div>
                </div>
            `;
        } else if (statusPembayaran === 'Ditolak') {
            statusBanner = `
                <div class="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-xs text-red-400 space-y-1">
                    <div class="font-bold flex items-center"><i data-lucide="alert-circle" class="w-4 h-4 mr-1"></i> Pembayaran Ditolak</div>
                    <div>Alasan: <strong>${Utils.escapeHtml(trx.catatan_penolakan || '-')}</strong></div>
                </div>
            `;
        }

        // Bukti Pembayaran Section
        let proofSectionHtml = '';
        if (trx.bukti_bayar) {
            const isPdf = (trx.bukti_bayar_original_name || trx.bukti_bayar || '').toLowerCase().endsWith('.pdf');
            const proofUrl = `api/transactions/${trx.id}/proof`;
            const fileName = trx.bukti_bayar_original_name || 'bukti_transfer';
            const uploadTime = trx.bukti_bayar_at ? Utils.formatDateTime(trx.bukti_bayar_at) : '-';

            if (isPdf) {
                proofSectionHtml = `
                    <div class="bg-slate-900/80 p-3.5 rounded-md border border-slate-800 space-y-2.5">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center">
                                <i data-lucide="file-text" class="w-4 h-4 mr-1.5 text-sky-400"></i> Bukti Pembayaran (Dokumen PDF)
                            </span>
                            <span class="text-[10px] text-gray-400 font-mono-numbers">Upload: ${uploadTime}</span>
                        </div>
                        <div class="p-3 bg-slate-950 rounded border border-slate-850 flex items-center justify-between">
                            <div class="flex items-center space-x-2 truncate">
                                <i data-lucide="file-type-2" class="w-5 h-5 text-red-400 flex-shrink-0"></i>
                                <span class="text-xs text-gray-200 font-mono-numbers font-medium truncate">${Utils.escapeHtml(fileName)}</span>
                            </div>
                            <a href="${proofUrl}" target="_blank" class="px-3 py-1.5 bg-brand-red hover:bg-brand-darkred text-white text-xs font-semibold rounded transition-colors flex items-center flex-shrink-0 ml-2">
                                <i data-lucide="external-link" class="w-3.5 h-3.5 mr-1"></i> Buka PDF
                            </a>
                        </div>
                    </div>
                `;
            } else {
                proofSectionHtml = `
                    <div class="bg-slate-900/80 p-3.5 rounded-md border border-slate-800 space-y-2.5">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center">
                                <i data-lucide="image" class="w-4 h-4 mr-1.5 text-emerald-400"></i> Bukti Pembayaran (Gambar / Foto Struk)
                            </span>
                            <span class="text-[10px] text-gray-400 font-mono-numbers">Upload: ${uploadTime}</span>
                        </div>
                        <div class="flex flex-col sm:flex-row items-center gap-3 p-3 bg-slate-950 rounded border border-slate-850">
                            <div class="w-full sm:w-32 h-28 bg-slate-900 rounded overflow-hidden flex items-center justify-center border border-slate-800 flex-shrink-0 cursor-pointer" onclick="Transactions.viewProof(${trx.id}, '${Utils.escapeHtml(fileName)}')">
                                <img src="${proofUrl}" alt="Bukti Transfer" class="max-h-full max-w-full object-contain hover:scale-105 transition-transform" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'p-2 text-center text-[10px] text-slate-500\\'>Foto bukti</div>';">
                            </div>
                            <div class="space-y-1.5 text-xs text-left w-full">
                                <div class="text-gray-300 font-semibold truncate font-mono-numbers">${Utils.escapeHtml(fileName)}</div>
                                <div class="text-[11px] text-gray-500">Klik gambar atau tombol di bawah untuk memperbesar</div>
                                <button type="button" onclick="Transactions.viewProof(${trx.id}, '${Utils.escapeHtml(fileName)}')" class="px-3 py-1.5 bg-slate-850 hover:bg-slate-800 text-sky-300 border border-slate-800 rounded text-xs font-semibold flex items-center transition-colors">
                                    <i data-lucide="zoom-in" class="w-3.5 h-3.5 mr-1.5"></i> Perbesar Foto Bukti
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }
        } else if (trx.metode_bayar === 'transfer' || trx.metode_bayar === 'qris') {
            proofSectionHtml = `
                <div class="p-3 bg-amber-500/10 border border-amber-500/20 rounded-md text-xs text-amber-400 flex items-center space-x-2">
                    <i data-lucide="alert-circle" class="w-4 h-4 flex-shrink-0"></i>
                    <span>Pelanggan belum mengupload bukti pembayaran pada sistem.</span>
                </div>
            `;
        }

        const contentHtml = `
            <div class="space-y-4 text-left max-h-[75vh] overflow-y-auto pr-1">
                ${statusBanner}

                <!-- Status Summary Cards -->
                <div class="grid grid-cols-2 gap-3 bg-slate-900/80 p-3 rounded-md border border-slate-800 text-xs">
                    <div>
                        <span class="block text-[9px] text-gray-500 uppercase tracking-widest font-semibold mb-1">Status Pembayaran</span>
                        <div>${this.getPaymentBadge(statusPembayaran)}</div>
                    </div>
                    <div>
                        <span class="block text-[9px] text-gray-500 uppercase tracking-widest font-semibold mb-1">Status Pesanan</span>
                        <div>${this.getOrderBadge(statusPesanan)}</div>
                    </div>
                </div>

                <!-- Info Header -->
                <div class="grid grid-cols-2 gap-4 bg-slate-900/60 p-3 rounded-md border border-slate-800 text-xs">
                    <div>
                        <div class="text-gray-500">NOMOR INVOICE</div>
                        <div class="font-bold text-gray-200 font-mono-numbers">${trx.no_invoice}</div>
                        <div class="text-gray-500 mt-2">TANGGAL TRANSAKSI</div>
                        <div class="text-gray-300 font-mono-numbers">${Utils.formatDateTime(trx.created_at)}</div>
                        <div class="text-gray-500 mt-2">METODE PEMBAYARAN</div>
                        <div class="text-gray-200 font-semibold uppercase">
                            ${trx.metode_bayar === 'transfer' ? 'Transfer' : (trx.metode_bayar === 'qris' ? 'QRIS' : 'Tunai')}
                        </div>
                        ${trx.metode_bayar === 'transfer' ? `
                            <div class="text-gray-500 mt-2">BANK TUJUAN</div>
                            <div class="text-brand-red font-bold font-mono-numbers">${trx.bank ? `Bank ${trx.bank}` : 'Bank BCA'}</div>
                        ` : ''}
                    </div>
                    <div>
                        <div class="text-gray-500">KASIR / OPERATOR</div>
                        <div class="text-gray-300 font-semibold">${trx.kasir_nama || '-'}</div>
                        <div class="text-gray-500 mt-2">PELANGGAN / PEMESAN</div>
                        <div class="text-gray-300 font-semibold">${trx.customer_nama || 'Umum (Walk-in)'}</div>
                    </div>
                </div>

                <!-- Bukti Pembayaran Section -->
                ${proofSectionHtml}

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
                            <span>Bayar (${trx.metode_bayar === 'transfer' ? (trx.bank ? `TRANSFER ${trx.bank}` : 'TRANSFER') : trx.metode_bayar.toUpperCase()}):</span>
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
                        <span class="font-semibold text-gray-400">Catatan / Alamat Pengiriman:</span>
                        <p class="text-gray-300 whitespace-pre-wrap mt-0.5">${Utils.escapeHtml(trx.catatan)}</p>
                    </div>
                ` : ''}
            </div>
        `;

        // Payment Verification Buttons for Staff/Admin
        let verificationButtons = '';
        if (statusPembayaran === 'Menunggu Konfirmasi' || statusPembayaran === 'Menunggu Pembayaran' || statusPembayaran === 'Ditolak') {
            verificationButtons += `
                <button class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold flex items-center transition-colors shadow" onclick="Transactions.verifyPayment(${trx.id})">
                    <i data-lucide="check-circle-2" class="w-3.5 h-3.5 mr-1"></i> Konfirmasi Pembayaran
                </button>
            `;
            if (statusPembayaran !== 'Ditolak') {
                verificationButtons += `
                    <button class="px-3 py-1.5 bg-red-950/50 text-red-400 border border-red-900/40 hover:bg-red-900 hover:text-white rounded-md text-xs font-semibold flex items-center transition-colors" onclick="Transactions.rejectPayment(${trx.id})">
                        <i data-lucide="x-circle" class="w-3.5 h-3.5 mr-1"></i> Tolak Pembayaran
                    </button>
                `;
            }
        }

        if (statusPesanan === 'Diproses') {
            verificationButtons += `
                <button class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold flex items-center transition-colors shadow" onclick="Transactions.updateOrderStatus(${trx.id}, 'Selesai')">
                    <i data-lucide="check-check" class="w-3.5 h-3.5 mr-1"></i> Selesaikan Pesanan
                </button>
            `;
        }

        const footerHtml = `
            <div class="flex flex-wrap items-center justify-between gap-2 w-full">
                <div class="flex items-center space-x-2">
                    ${verificationButtons}
                    <!-- Void Transaction Button for Admin Roles -->
                    ${Auth.currentUser && Auth.currentUser.role === 'admin' ? `
                        <button class="px-3 py-1.5 bg-slate-900 text-red-400 border border-red-900/30 hover:bg-red-900 hover:text-white rounded-md text-xs font-semibold flex items-center transition-colors" onclick="Transactions.void(${trx.id})">
                            <i data-lucide="trash-2" class="w-3.5 h-3.5 mr-1"></i> Void
                        </button>
                    ` : ''}
                </div>

                <div class="flex space-x-2 ml-auto">
                    <button class="px-4 py-2 text-xs bg-slate-800 text-slate-400 hover:text-white rounded-md" onclick="Utils.closeModal()">Tutup</button>
                    <button class="px-4 py-2 text-xs bg-brand-red hover:bg-brand-darkred text-white rounded-md flex items-center" onclick="POS.showReceipt(${trx.id})">
                        <i data-lucide="printer" class="w-4 h-4 mr-1"></i> Buka Cetak Struk
                    </button>
                </div>
            </div>
        `;

        Utils.showModal('Detail Transaksi Penjualan', contentHtml, footerHtml);
    },

    viewProof: function(transactionId, filename) {
        const url = `api/transactions/${transactionId}/proof`;
        const isPdf = (filename || '').toLowerCase().endsWith('.pdf');

        if (isPdf) {
            window.open(url, '_blank');
            return;
        }

        // Image modal preview
        Utils.showModal(`Bukti Pembayaran: ${filename || 'Foto Bukti'}`, `
            <div class="flex flex-col items-center justify-center p-2 space-y-3">
                <div class="max-h-[65vh] max-w-full overflow-hidden rounded bg-slate-950 flex items-center justify-center border border-slate-800">
                    <img src="${url}" alt="Bukti Pembayaran" class="max-h-[60vh] max-w-full object-contain rounded" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'p-8 text-center text-slate-500 text-xs\\'>Gagal memuat preview gambar. <a href=\\'${url}\\' target=\\'_blank\\' class=\\'text-brand-red font-bold underline\\'>Buka File</a></div>';">
                </div>
                <div class="text-[11px] text-slate-400 font-mono-numbers">${Utils.escapeHtml(filename || '')}</div>
            </div>
        `, {
            buttons: [
                { text: 'Buka di Tab Baru', class: 'bg-slate-800 text-slate-200 hover:bg-slate-700', onclick: `window.open('${url}', '_blank')` },
                { text: 'Tutup', class: 'bg-brand-red text-white hover:bg-brand-darkred', onclick: 'Utils.closeModal()' }
            ]
        });
    },

    verifyPayment: async function(id) {
        const confirmed = await Utils.confirmDialog('Konfirmasi pembayaran transaksi ini? Status pembayaran akan menjadi "Dibayar" dan status pesanan menjadi "Diproses".');
        if (!confirmed) return;

        const response = await Utils.apiCall(`transactions/${id}/verify-payment`, 'POST');
        if (response.success) {
            Utils.showToast('Pembayaran berhasil dikonfirmasi!', 'success');
            this.showDetail(id);
            this.loadTransactions();
        } else {
            Utils.showToast(response.message || 'Gagal memverifikasi pembayaran.', 'error');
        }
    },

    rejectPayment: function(id) {
        const dialogHtml = `
            <div class="space-y-3 text-left">
                <p class="text-xs text-gray-300">Pilih atau masukkan alasan penolakan pembayaran ini:</p>
                <div class="space-y-2 bg-slate-900/60 p-3 rounded-md border border-slate-800">
                    <label class="flex items-center space-x-2 text-xs text-gray-300 cursor-pointer">
                        <input type="radio" name="reject-reason-radio" value="Nominal transfer tidak sesuai dengan total tagihan" checked class="text-brand-red focus:ring-brand-red">
                        <span>Nominal transfer tidak sesuai dengan total tagihan</span>
                    </label>
                    <label class="flex items-center space-x-2 text-xs text-gray-300 cursor-pointer">
                        <input type="radio" name="reject-reason-radio" value="Bukti pembayaran tidak jelas / buram / tidak terbaca" class="text-brand-red focus:ring-brand-red">
                        <span>Bukti pembayaran tidak jelas / buram / tidak terbaca</span>
                    </label>
                    <label class="flex items-center space-x-2 text-xs text-gray-300 cursor-pointer">
                        <input type="radio" name="reject-reason-radio" value="Bukti pembayaran tidak sesuai / palsu" class="text-brand-red focus:ring-brand-red">
                        <span>Bukti pembayaran tidak sesuai / palsu</span>
                    </label>
                    <label class="flex items-center space-x-2 text-xs text-gray-300 cursor-pointer">
                        <input type="radio" name="reject-reason-radio" value="Pembayaran belum diterima di rekening toko" class="text-brand-red focus:ring-brand-red">
                        <span>Pembayaran belum diterima / dana belum masuk di rekening</span>
                    </label>
                    <label class="flex items-center space-x-2 text-xs text-gray-300 cursor-pointer">
                        <input type="radio" name="reject-reason-radio" value="custom" class="text-brand-red focus:ring-brand-red">
                        <span>Alasan lainnya (tulis di bawah):</span>
                    </label>
                </div>
                <div>
                    <textarea id="reject-reason-custom" rows="2" placeholder="Tulis alasan khusus jika memilih opsi lainnya..." class="w-full bg-slate-950 border border-slate-800 rounded-md p-2.5 text-xs text-gray-200 focus:outline-none focus:border-brand-red"></textarea>
                </div>
            </div>
        `;

        Utils.showModal('Tolak Pembayaran Pesanan', dialogHtml, {
            buttons: [
                { text: 'Batal', class: 'bg-slate-800 text-slate-300 hover:bg-slate-700', onclick: 'Utils.closeModal()' },
                { text: 'Tolak Pembayaran', class: 'bg-brand-red text-white hover:bg-brand-darkred', onclick: `Transactions.submitRejectPayment(${id})` }
            ]
        });
    },

    submitRejectPayment: async function(id) {
        const selectedRadio = document.querySelector('input[name="reject-reason-radio"]:checked')?.value || '';
        const customText = document.getElementById('reject-reason-custom')?.value.trim() || '';

        let finalReason = selectedRadio;
        if (selectedRadio === 'custom') {
            finalReason = customText || 'Bukti pembayaran ditolak oleh admin.';
        }

        Utils.closeModal();

        const response = await Utils.apiCall(`transactions/${id}/reject-payment`, 'POST', {
            catatan_penolakan: finalReason
        });

        if (response.success) {
            Utils.showToast('Pembayaran telah ditolak.', 'info');
            this.showDetail(id);
            this.loadTransactions();
        } else {
            Utils.showToast(response.message || 'Gagal menolak pembayaran.', 'error');
        }
    },

    updateOrderStatus: async function(id, status) {
        const confirmed = await Utils.confirmDialog(`Ubah status pesanan menjadi "${status}"?`);
        if (!confirmed) return;

        const response = await Utils.apiCall(`transactions/${id}/update-status`, 'POST', {
            status_pesanan: status
        });

        if (response.success) {
            Utils.showToast(`Status pesanan berhasil diubah menjadi ${status}.`, 'success');
            this.showDetail(id);
            this.loadTransactions();
        } else {
            Utils.showToast(response.message || 'Gagal memperbarui status pesanan.', 'error');
        }
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