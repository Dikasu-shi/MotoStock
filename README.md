# MotoStock

MotoStock adalah aplikasi inventory dan penjualan spare part motor Honda.

Project ini saya buat untuk belajar dan mengembangkan pemahaman saya dalam membuat aplikasi web menggunakan Laravel.

## Fitur

- Login dengan role Admin, Kasir, dan Customer
- Katalog spare part
- Pencarian dan filter produk
- Keranjang dan pemesanan
- Kasir / POS
- Manajemen spare part dan stok
- Manajemen kategori
- Data pelanggan dan supplier
- Riwayat transaksi
- Laporan penjualan dan stok

## Dibuat Menggunakan

- Laravel
- PHP
- MySQL
- Vite
- Tailwind CSS

## Catatan

Project ini masih dalam tahap pengembangan dan masih terdapat beberapa bagian yang akan saya perbaiki dan kembangkan.

## Menjalankan Project

Clone repository:

    git clone https://github.com/Dikasu-shi/MotoStock.git
    cd MotoStock

Install dependency:

    composer install
    npm install

Salin file environment:

    cp .env.example .env

Generate application key:

    php artisan key:generate

Atur konfigurasi database pada file `.env`, kemudian jalankan migration:

    php artisan migrate

Build frontend:

    npm run build

Jalankan aplikasi:

    php artisan serve

Untuk development frontend:

    npm run dev