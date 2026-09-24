// Dashboard Module for MyKasir

const Dashboard = {
    salesChart: null,

    // Initializer called by app.js router
    init: async function() {
        this.loadDashboardData();
    },

    // Fetch and populate data
    loadDashboardData: async function() {
        const container = document.getElementById('page-dashboard');
        // Show local loading state if needed

        const response = await Utils.apiCall('dashboard');
        if (!response.success) {
            Utils.showToast('Gagal memuat data dashboard', 'error');
            return;
        }

        const data = response.data;

        // 1. Populate stats cards
        document.getElementById('stat-penjualan-hari-ini').textContent = Utils.formatRupiah(data.penjualan_hari_ini || 0);
        document.getElementById('stat-transaksi-hari-ini').textContent = Utils.formatNumber(data.transaksi_hari_ini || 0) + ' Transaksi';
        document.getElementById('stat-total-produk').textContent = Utils.formatNumber(data.total_produk || 0) + ' Item';

        const lowStockBadge = document.getElementById('stat-stok-menipis');
        const lowStockCount = parseInt(data.stok_menipis || 0);
        lowStockBadge.textContent = Utils.formatNumber(lowStockCount) + ' Produk';

        if (lowStockCount > 0) {
            lowStockBadge.parentElement.classList.add('low-stock-pulse');
        } else {
            lowStockBadge.parentElement.classList.remove('low-stock-pulse');
        }

        // 2. Render sales chart
        this.renderChart(data.grafik_penjualan || []);

        // 3. Render Top 5 Products
        this.renderTopProducts(data.produk_terlaris || []);

        // 4. Render Recent Transactions
        this.renderRecentTransactions(data.transaksi_terakhir || []);

        // 5. Render Low Stock Alerts Details
        this.renderLowStockAlerts(data.stok_menipis_list || []);
    },

    // Sales charts with Chart.js
    renderChart: function(chartData) {
        const ctx = document.getElementById('chart-penjualan').getContext('2d');

        // Destruct labels and totals
        const labels = chartData.map(item => Utils.formatDate(item.tanggal));
        const totals = chartData.map(item => parseFloat(item.total));

        // Destroy previous instance to prevent overlays on reload
        if (this.salesChart) {
            this.salesChart.destroy();
        }

        this.salesChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Omset Harian (Rupiah)',
                    data: totals,
                    borderColor: '#cc0000', // Brand Red
                    backgroundColor: 'rgba(204, 0, 0, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.3,
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: '#cc0000',
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return ' ' + Utils.formatRupiah(context.raw);
                            }
                        }
                    }
                },
                scales: {
                    y: {
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
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#94a3b8'
                        }
                    }
                }
            }
        });
    },

    // Populate Top 5 products table
    renderTopProducts: function(products) {
        const tbody = document.getElementById('tabel-produk-terlaris-body');
        if (!tbody) return;

        if (products.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" class="text-center py-4 text-gray-500 text-xs">Belum ada data penjualan.</td></tr>`;
            return;
        }

        tbody.innerHTML = products.map((item, index) => `
            <tr class="border-b border-gray-700 hover:bg-slate-800/40 transition-colors">
                <td class="px-4 py-3 text-sm text-gray-400 font-mono-numbers">${index + 1}</td>
                <td class="px-4 py-3 text-sm">
                    <div class="font-medium text-gray-200">${Utils.escapeHtml(item.nama_produk)}</div>
                    <div class="text-xs text-gray-500 font-mono-numbers">${Utils.escapeHtml(item.sku)}</div>
                </td>
                <td class="px-4 py-3 text-sm text-right font-semibold text-amber-500 font-mono-numbers">${Utils.formatNumber(item.total_qty)} ${Utils.escapeHtml(item.satuan || 'pcs')}</td>
            </tr>
        `).join('');
    },

    // Populate Recent Transactions table
    renderRecentTransactions: function(transactions) {
        const tbody = document.getElementById('tabel-transaksi-terakhir-body');
        if (!tbody) return;

        if (transactions.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-gray-500 text-xs">Belum ada transaksi hari ini.</td></tr>`;
            return;
        }

        tbody.innerHTML = transactions.map(item => {
            let methodBadge = '';
            if (item.metode_bayar === 'tunai') {
                methodBadge = '<span class="bg-green-500/10 text-green-400 text-[10px] font-medium px-2 py-0.5 rounded-full border border-green-500/20">TUNAI</span>';
            } else if (item.metode_bayar === 'qris') {
                methodBadge = '<span class="bg-blue-500/10 text-blue-400 text-[10px] font-medium px-2 py-0.5 rounded-full border border-blue-500/20">QRIS</span>';
            } else {
                methodBadge = '<span class="bg-purple-500/10 text-purple-400 text-[10px] font-medium px-2 py-0.5 rounded-full border border-purple-500/20">TRANSFER</span>';
            }

            return `
                <tr class="border-b border-gray-700 hover:bg-slate-800/40 transition-colors cursor-pointer" onclick="window.location.hash = '#transactions'; setTimeout(() => Transactions.showDetail(${item.id}), 100)">
                    <td class="px-4 py-3 text-sm font-semibold text-gray-300 font-mono-numbers hover:text-red-500">${Utils.escapeHtml(item.no_invoice)}</td>
                    <td class="px-4 py-3 text-xs text-gray-400">${Utils.formatDateTime(item.created_at)}</td>
                    <td class="px-4 py-3 text-sm text-right font-mono-numbers text-gray-200">${Utils.formatRupiah(item.total)}</td>
                    <td class="px-4 py-3 text-sm text-right">${methodBadge}</td>
                </tr>
            `;
        }).join('');
    },

    // Populate low stock details table
    renderLowStockAlerts: function(lowStockList) {
        const tbody = document.getElementById('tabel-stok-menipis-body');
        if (!tbody) return;

        if (lowStockList.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-green-400 text-xs font-medium">Stok semua aman. 👍</td></tr>`;
            return;
        }

        tbody.innerHTML = lowStockList.map(item => `
            <tr class="border-b border-gray-700 hover:bg-slate-800/40 transition-colors">
                <td class="px-4 py-3 text-sm">
                    <div class="font-medium text-gray-200">${Utils.escapeHtml(item.nama)}</div>
                    <div class="text-xs text-gray-500 font-mono-numbers">${Utils.escapeHtml(item.sku)} | Cocok: ${Utils.escapeHtml(item.motor || '-')}</div>
                </td>
                <td class="px-4 py-3 text-sm text-gray-400">${Utils.escapeHtml(item.kategori || '-')}</td>
                <td class="px-4 py-3 text-sm text-center text-red-400 font-bold font-mono-numbers">${Utils.formatNumber(item.stok)}</td>
                <td class="px-4 py-3 text-sm text-center text-gray-400 font-mono-numbers">${Utils.formatNumber(item.stok_minimum)}</td>
            </tr>
        `).join('');
    }
};

window.Dashboard = Dashboard;