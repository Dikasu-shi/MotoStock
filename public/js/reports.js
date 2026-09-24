// Reports Module for MyKasir

const Reports = {
    chartInstance: null,

    init: async function() {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        const formatDateInput = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        document.getElementById('report-start-date').value = formatDateInput(startOfMonth);
        document.getElementById('report-end-date').value = formatDateInput(today);

        this.registerEvents();
        await this.generateReport();
    },

    registerEvents: function() {
        const btnSubmit = document.getElementById('btn-generate-report');
        if (btnSubmit) {
            btnSubmit.onclick = () => this.generateReport();
        }
    },

    generateReport: async function() {
        const container = document.getElementById('report-summary');
        // Loading state

        const startDate = document.getElementById('report-start-date').value;
        const endDate = document.getElementById('report-end-date').value;
        const type = document.getElementById('report-type').value;

        const response = await Utils.apiCall(`reports?start_date=${startDate}&end_date=${endDate}&type=${type}`);
        if (!response.success) {
            Utils.showToast('Gagal memuat laporan penjualan.', 'error');
            return;
        }

        const data = response.data;

        // 1. Populate Summaries
        this.renderSummary(data.ringkasan || {});

        // 2. Render Chart
        this.renderChart(data.detail_harian || []);

        // 3. Render Top 10 Products
        this.renderTopProducts(data.produk_terlaris || []);

        // 4. Render Category Sales
        this.renderCategorySales(data.kategori_penjualan || []);
    },

    renderSummary: function(ringkasan) {
        document.getElementById('report-total-penjualan').textContent = Utils.formatRupiah(ringkasan.total_penjualan || 0);
        document.getElementById('report-jumlah-transaksi').textContent = Utils.formatNumber(ringkasan.jumlah_transaksi || 0) + ' Transaksi';
        document.getElementById('report-rata-transaksi').textContent = Utils.formatRupiah(ringkasan.rata_rata_transaksi || 0);

        // Show Profit Margin
        const profitVal = parseFloat(ringkasan.total_profit || 0);
        const profitElement = document.getElementById('report-total-profit');
        profitElement.textContent = Utils.formatRupiah(profitVal);

        if (profitVal > 0) {
            profitElement.className = 'text-2xl font-bold text-green-400 font-mono-numbers';
        } else {
            profitElement.className = 'text-2xl font-bold text-gray-400 font-mono-numbers';
        }
    },

    renderChart: function(detailHarian) {
        const ctx = document.getElementById('chart-report').getContext('2d');

        const labels = detailHarian.map(item => Utils.formatDate(item.tanggal));
        const totals = detailHarian.map(item => parseFloat(item.total));
        const counts = detailHarian.map(item => parseInt(item.jumlah_transaksi));

        if (this.chartInstance) {
            this.chartInstance.destroy();
        }

        this.chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Omset Penjualan (Rp)',
                        data: totals,
                        backgroundColor: 'rgba(204, 0, 0, 0.75)', // Brand Red
                        borderColor: '#cc0000',
                        borderWidth: 1,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Jumlah Transaksi',
                        data: counts,
                        type: 'line',
                        borderColor: '#f5a623', // Gold
                        backgroundColor: 'rgba(245, 166, 35, 0.1)',
                        borderWidth: 2,
                        tension: 0.2,
                        yAxisID: 'y1',
                        pointBackgroundColor: '#ffffff'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.datasetIndex === 0) {
                                    label += Utils.formatRupiah(context.raw);
                                } else {
                                    label += Utils.formatNumber(context.raw) + ' Transaksi';
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        grid: {
                            color: 'rgba(51, 65, 85, 0.2)'
                        },
                        ticks: {
                            color: '#94a3b8',
                            callback: function(value) {
                                return Utils.formatRupiah(value);
                            }
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        grid: {
                            drawOnChartArea: false // prevent grid lines overlap
                        },
                        ticks: {
                            color: '#94a3b8',
                            stepSize: 1
                        }
                    },
                    x: {
                        ticks: {
                            color: '#94a3b8'
                        }
                    }
                }
            }
        });
    },

    renderTopProducts: function(products) {
        const tbody = document.getElementById('report-produk-body');
        if (!tbody) return;

        if (products.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center py-6 text-slate-500 text-sm">Tidak ada penjualan pada periode ini.</td></tr>`;
            return;
        }

        tbody.innerHTML = products.map((p, index) => `
            <tr class="border-b border-slate-700/50 hover:bg-slate-800/40 transition-colors">
                <td class="px-4 py-3 text-xs text-gray-500 font-mono-numbers">${index + 1}</td>
                <td class="px-4 py-3 text-sm">
                    <div class="font-semibold text-gray-200">${Utils.escapeHtml(p.nama_produk)}</div>
                    <div class="text-[10px] text-gray-500 font-mono-numbers">${Utils.escapeHtml(p.sku)}</div>
                </td>
                <td class="px-4 py-3 text-sm text-center font-bold text-amber-500 font-mono-numbers">${Utils.formatNumber(p.total_qty)} ${Utils.escapeHtml(p.satuan || 'pcs')}</td>
                <td class="px-4 py-3 text-sm text-right font-mono-numbers text-gray-200">${Utils.formatRupiah(p.total_omset)}</td>
            </tr>
        `).join('');
    },

    renderCategorySales: function(categories) {
        const tbody = document.getElementById('report-kategori-body');
        if (!tbody) return;

        if (categories.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" class="text-center py-6 text-slate-500 text-sm">Tidak ada penjualan.</td></tr>`;
            return;
        }

        tbody.innerHTML = categories.map((c, index) => `
            <tr class="border-b border-slate-700/50 hover:bg-slate-800/40 transition-colors">
                <td class="px-4 py-3 text-xs text-gray-500 font-mono-numbers">${index + 1}</td>
                <td class="px-4 py-3 text-sm font-semibold text-gray-200">${Utils.escapeHtml(c.kategori_nama || 'Tanpa Kategori')}</td>
                <td class="px-4 py-3 text-sm text-center font-bold text-amber-500 font-mono-numbers">${Utils.formatNumber(c.total_qty)} Pcs</td>
                <td class="px-4 py-3 text-sm text-right font-mono-numbers text-gray-200">${Utils.formatRupiah(c.total_omset)}</td>
            </tr>
        `).join('');
    }
};

const ReportsPurchases = {
    init: async function() {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        const formatDateInput = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        document.getElementById('report-purchase-start').value = formatDateInput(startOfMonth);
        document.getElementById('report-purchase-end').value = formatDateInput(today);

        this.registerEvents();
        await this.generateReport();
    },

    registerEvents: function() {
        const btnSubmit = document.getElementById('btn-generate-purchase-report');
        if (btnSubmit) {
            btnSubmit.onclick = () => this.generateReport();
        }
    },

    generateReport: async function() {
        const startDate = document.getElementById('report-purchase-start').value;
        const endDate = document.getElementById('report-purchase-end').value;

        const response = await Utils.apiCall(`reports/purchases?start_date=${startDate}&end_date=${endDate}`);
        if (!response.success) {
            Utils.showToast('Gagal memuat laporan pembelian.', 'error');
            return;
        }

        const data = response.data;
        this.renderSummary(data.ringkasan || {});
        this.renderItems(data.items_purchased || []);
        this.renderSuppliers(data.top_suppliers || []);
    },

    renderSummary: function(ringkasan) {
        const container = document.getElementById('purchase-report-summary');
        if (!container) return;

        container.innerHTML = `
            <div class="glass-panel p-5 rounded-md border border-slate-800 flex items-center justify-between shadow-lg">
                <div>
                    <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Total Pengeluaran Belanja</span>
                    <h3 class="text-2xl font-bold font-mono-numbers text-amber-500 mt-1">${Utils.formatRupiah(ringkasan.total_pembelian || 0)}</h3>
                </div>
                <div class="p-3 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    <i data-lucide="shopping-bag" class="w-6 h-6"></i>
                </div>
            </div>
            <div class="glass-panel p-5 rounded-md border border-slate-800 flex items-center justify-between shadow-lg">
                <div>
                    <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Jumlah Transaksi PO</span>
                    <h3 class="text-2xl font-bold font-mono-numbers text-gray-200 mt-1">${Utils.formatNumber(ringkasan.jumlah_transaksi || 0)} PO</h3>
                </div>
                <div class="p-3 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <i data-lucide="receipt-text" class="w-6 h-6"></i>
                </div>
            </div>
            <div class="glass-panel p-5 rounded-md border border-slate-800 flex items-center justify-between shadow-lg">
                <div>
                    <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Rata-rata Nilai PO</span>
                    <h3 class="text-2xl font-bold font-mono-numbers text-gray-200 mt-1">${Utils.formatRupiah(ringkasan.rata_rata_transaksi || 0)}</h3>
                </div>
                <div class="p-3 rounded-md bg-green-500/10 text-green-400 border border-green-500/20">
                    <i data-lucide="line-chart" class="w-6 h-6"></i>
                </div>
            </div>
        `;
        lucide.createIcons();
    },

    renderItems: function(items) {
        const tbody = document.getElementById('report-purchase-items-body');
        if (!tbody) return;

        if (items.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" class="text-center py-6 text-slate-500">Tidak ada data.</td></tr>`;
            return;
        }

        tbody.innerHTML = items.map((item, index) => `
            <tr class="border-b border-slate-700/50 hover:bg-slate-800/40 transition-colors">
                <td class="px-4 py-2.5">
                    <div class="font-semibold text-gray-200">${Utils.escapeHtml(item.nama_produk)}</div>
                    <div class="text-[10px] text-gray-500 font-mono-numbers">${Utils.escapeHtml(item.sku)}</div>
                </td>
                <td class="px-4 py-2.5 text-center font-bold text-amber-500 font-mono-numbers">${Utils.formatNumber(item.total_qty)} Pcs</td>
                <td class="px-4 py-2.5 text-right font-mono-numbers text-gray-200">${Utils.formatRupiah(item.total_omset)}</td>
            </tr>
        `).join('');
    },

    renderSuppliers: function(suppliers) {
        const tbody = document.getElementById('report-purchase-suppliers-body');
        if (!tbody) return;

        if (suppliers.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" class="text-center py-6 text-slate-500">Tidak ada data.</td></tr>`;
            return;
        }

        tbody.innerHTML = suppliers.map((sup, index) => `
            <tr class="border-b border-slate-700/50 hover:bg-slate-800/40 transition-colors">
                <td class="px-4 py-2.5 font-semibold text-gray-200">${Utils.escapeHtml(sup.supplier_nama)}</td>
                <td class="px-4 py-2.5 text-center font-bold text-blue-400 font-mono-numbers">${Utils.formatNumber(sup.jumlah_transaksi)} PO</td>
                <td class="px-4 py-2.5 text-right font-mono-numbers text-gray-200 font-semibold">${Utils.formatRupiah(sup.total_omset)}</td>
            </tr>
        `).join('');
    }
};

const ReportsStock = {
    init: async function() {
        await this.generateReport();
    },

    generateReport: async function() {
        const response = await Utils.apiCall('reports/stock');
        if (!response.success) {
            Utils.showToast('Gagal memuat laporan valuasi stok.', 'error');
            return;
        }

        const data = response.data;
        this.renderSummary(data.ringkasan || {});
        this.renderCategories(data.kategori_valuation || []);
    },

    renderSummary: function(ringkasan) {
        const container = document.getElementById('stock-report-summary');
        if (!container) return;

        const margin = parseFloat(ringkasan.total_jual_valuation || 0) - parseFloat(ringkasan.total_beli_valuation || 0);

        container.innerHTML = `
            <div class="glass-panel p-5 rounded-md border border-slate-800 flex items-center justify-between shadow-lg">
                <div>
                    <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Nilai Aset Awal (Harga Beli)</span>
                    <h3 class="text-2xl font-bold font-mono-numbers text-amber-500 mt-1">${Utils.formatRupiah(ringkasan.total_beli_valuation || 0)}</h3>
                    <div class="text-[10px] text-gray-400 mt-1">Valuasi modal terikat pada ${Utils.formatNumber(ringkasan.total_items || 0)} barang</div>
                </div>
                <div class="p-3 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    <i data-lucide="warehouse" class="w-6 h-6"></i>
                </div>
            </div>
            <div class="glass-panel p-5 rounded-md border border-slate-800 flex items-center justify-between shadow-lg">
                <div>
                    <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Nilai Aset Jual (Harga Jual)</span>
                    <h3 class="text-2xl font-bold font-mono-numbers text-gray-200 mt-1">${Utils.formatRupiah(ringkasan.total_jual_valuation || 0)}</h3>
                    <div class="text-[10px] text-gray-400 mt-1">Potensi omset kotor jika semua barang terjual</div>
                </div>
                <div class="p-3 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <i data-lucide="receipt-text" class="w-6 h-6"></i>
                </div>
            </div>
            <div class="glass-panel p-5 rounded-md border border-slate-800 flex items-center justify-between shadow-lg">
                <div>
                    <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Potensi Keuntungan Bersih</span>
                    <h3 class="text-2xl font-bold font-mono-numbers text-green-400 mt-1">${Utils.formatRupiah(margin)}</h3>
                    <div class="text-[10px] text-gray-400 mt-1">Status: ${Utils.formatNumber(ringkasan.stok_aman || 0)} Aman / ${Utils.formatNumber(ringkasan.stok_menipis || 0)} Limit / ${Utils.formatNumber(ringkasan.stok_habis || 0)} Habis</div>
                </div>
                <div class="p-3 rounded-md bg-green-500/10 text-green-400 border border-green-500/20">
                    <i data-lucide="line-chart" class="w-6 h-6"></i>
                </div>
            </div>
        `;
        lucide.createIcons();
    },

    renderCategories: function(categories) {
        const tbody = document.getElementById('stock-report-categories-body');
        if (!tbody) return;

        if (categories.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-slate-500">Tidak ada data.</td></tr>`;
            return;
        }

        tbody.innerHTML = categories.map((c, index) => {
            const margin = parseFloat(c.total_valuasi_jual || 0) - parseFloat(c.total_valuasi_beli || 0);
            return `
                <tr class="border-b border-slate-850 hover:bg-slate-800/40 transition-colors">
                    <td class="px-4 py-3 text-xs font-semibold text-gray-200">${Utils.escapeHtml(c.kategori_nama || 'Tanpa Kategori')}</td>
                    <td class="px-4 py-3 text-center text-xs text-gray-400">${Utils.formatNumber(c.total_qty || 0)} Pcs</td>
                    <td class="px-4 py-3 text-right text-sm text-gray-300 font-mono-numbers">${Utils.formatRupiah(c.total_valuasi_beli || 0)}</td>
                    <td class="px-4 py-3 text-right text-sm text-gray-300 font-mono-numbers">${Utils.formatRupiah(c.total_valuasi_jual || 0)}</td>
                    <td class="px-4 py-3 text-right text-sm font-semibold text-green-400 font-mono-numbers">${Utils.formatRupiah(margin)}</td>
                </tr>
            `;
        }).join('');
    }
};

window.Reports = Reports;
window.ReportsPurchases = ReportsPurchases;
window.ReportsStock = ReportsStock;