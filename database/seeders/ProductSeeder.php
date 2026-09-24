<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $products = [
            // 1. Oli & Pelumas (category_id = 1)
            [
                'category_id' => 1, 'sku' => 'OLI-AHM-10W30-01', 'nama' => 'AHM Oil MPX 2 0.8L (Matic)',
                'deskripsi' => 'Oli mesin AHM MPX 2 SAE 10W-30 kemasan 0.8L original untuk seluruh jenis motor matic Honda.',
                'harga_beli' => 38000, 'harga_jual' => 48000, 'stok' => 25, 'stok_minimum' => 5, 'satuan' => 'botol',
                'motor' => 'All Honda Matic (BeAT, Vario, Scoopy, Genio, PCX)', 'is_active' => true
            ],
            [
                'category_id' => 1, 'sku' => 'OLI-AHM-10W30-02', 'nama' => 'AHM Oil SPX 2 0.8L Full Synthetic',
                'deskripsi' => 'Oli full synthetic AHM SPX 2 SAE 10W-30 0.8L performa tinggi untuk matic premium Honda.',
                'harga_beli' => 52000, 'harga_jual' => 68000, 'stok' => 18, 'stok_minimum' => 5, 'satuan' => 'botol',
                'motor' => 'All Honda Matic (BeAT, Vario 125/160, PCX 160, ADV 160)', 'is_active' => true
            ],
            [
                'category_id' => 1, 'sku' => 'OLI-AHM-10W30-03', 'nama' => 'AHM Oil MPX 1 0.8L (Bebek / Sport)',
                'deskripsi' => 'Oli mesin AHM MPX 1 SAE 10W-30 0.8L original untuk motor bebek dan sport Honda.',
                'harga_beli' => 38000, 'harga_jual' => 48000, 'stok' => 15, 'stok_minimum' => 5, 'satuan' => 'botol',
                'motor' => 'Supra X 125, Revo FI, Blade, CB150R, CBR 150R', 'is_active' => true
            ],
            [
                'category_id' => 1, 'sku' => 'OLI-AHM-GRD-01', 'nama' => 'AHM Oil Gardan Scooter Gear Oil 120ml',
                'deskripsi' => 'Oli transmisi gardan matic Honda Genuine Oil kemasan 120ml.',
                'harga_beli' => 14000, 'harga_jual' => 20000, 'stok' => 30, 'stok_minimum' => 8, 'satuan' => 'botol',
                'motor' => 'All Honda Matic (BeAT, Vario, Scoopy, PCX)', 'is_active' => true
            ],

            // 2. Kampas Rem (category_id = 2)
            [
                'category_id' => 2, 'sku' => 'KPR-HON-BEAT-01', 'nama' => 'Kampas Rem Depan Honda BeAT',
                'deskripsi' => 'Brake pad cakram depan original Honda Genuine Parts (06455-KVB-T01).',
                'harga_beli' => 32000, 'harga_jual' => 45000, 'stok' => 20, 'stok_minimum' => 5, 'satuan' => 'set',
                'motor' => 'Honda BeAT FI / eSP / Street / Deluxe, Scoopy, Genio', 'is_active' => true
            ],
            [
                'category_id' => 2, 'sku' => 'KPR-HON-BEAT-02', 'nama' => 'Kampas Rem Belakang Honda BeAT',
                'deskripsi' => 'Brake shoe tromol belakang original Honda Genuine Parts (43130-KZL-930).',
                'harga_beli' => 30000, 'harga_jual' => 42000, 'stok' => 15, 'stok_minimum' => 5, 'satuan' => 'set',
                'motor' => 'Honda BeAT All Series, Scoopy, Spacy, Vario 110', 'is_active' => true
            ],
            [
                'category_id' => 2, 'sku' => 'KPR-HON-VAR-01', 'nama' => 'Kampas Rem Depan Honda Vario',
                'deskripsi' => 'Brake pad rem cakram depan Honda Genuine Parts (06455-K59-A71).',
                'harga_beli' => 38000, 'harga_jual' => 52000, 'stok' => 22, 'stok_minimum' => 5, 'satuan' => 'set',
                'motor' => 'Honda Vario 125, Vario 150, Vario 160 CBS, PCX 150', 'is_active' => true
            ],
            [
                'category_id' => 2, 'sku' => 'KPR-HON-VAR-02', 'nama' => 'Kampas Rem Belakang Honda Vario',
                'deskripsi' => 'Brake shoe tromol belakang original Honda (43130-K59-A11).',
                'harga_beli' => 35000, 'harga_jual' => 48000, 'stok' => 12, 'stok_minimum' => 5, 'satuan' => 'set',
                'motor' => 'Honda Vario 125 All Series, Vario 150, PCX 150 Non-ABS', 'is_active' => true
            ],
            [
                'category_id' => 2, 'sku' => 'KPR-HON-CBR-01', 'nama' => 'Kampas Rem Depan Honda CB150R / CBR 150R',
                'deskripsi' => 'Brake pad cakram depan high durability (06455-KPP-901).',
                'harga_beli' => 48000, 'harga_jual' => 65000, 'stok' => 8, 'stok_minimum' => 3, 'satuan' => 'set',
                'motor' => 'Honda CB150R Streetfire, CBR 150R, Sonic 150R, Supra GTR', 'is_active' => true
            ],
            [
                'category_id' => 2, 'sku' => 'KPR-HON-SUP-01', 'nama' => 'Kampas Rem Belakang Honda Supra X 125',
                'deskripsi' => 'Kampas rem tromol belakang genuine Honda (43125-KPH-901).',
                'harga_beli' => 28000, 'harga_jual' => 40000, 'stok' => 14, 'stok_minimum' => 5, 'satuan' => 'set',
                'motor' => 'Honda Supra X 125, Revo 110, Blade 110/125', 'is_active' => true
            ],

            // 3. Filter (category_id = 3)
            [
                'category_id' => 3, 'sku' => 'FLT-HON-BEAT-01', 'nama' => 'Filter Udara Honda BeAT FI',
                'deskripsi' => 'Element comp air cleaner saringan udara original Honda (17210-K16-900).',
                'harga_beli' => 32000, 'harga_jual' => 45000, 'stok' => 25, 'stok_minimum' => 5, 'satuan' => 'pcs',
                'motor' => 'Honda BeAT FI, BeAT eSP, Scoopy eSP, Vario 110 eSP', 'is_active' => true
            ],
            [
                'category_id' => 3, 'sku' => 'FLT-HON-VAR-01', 'nama' => 'Filter Udara Honda Vario 125',
                'deskripsi' => 'Saringan udara original Honda Genuine Parts (17210-KZR-600).',
                'harga_beli' => 34000, 'harga_jual' => 48000, 'stok' => 20, 'stok_minimum' => 5, 'satuan' => 'pcs',
                'motor' => 'Honda Vario 125 Old, Vario 125 eSP LED', 'is_active' => true
            ],
            [
                'category_id' => 3, 'sku' => 'FLT-HON-VAR-02', 'nama' => 'Filter Udara Honda Vario 150',
                'deskripsi' => 'Saringan udara original Honda Genuine Parts (17210-K59-A10).',
                'harga_beli' => 36000, 'harga_jual' => 50000, 'stok' => 18, 'stok_minimum' => 5, 'satuan' => 'pcs',
                'motor' => 'Honda Vario 150 eSP (LED / New)', 'is_active' => true
            ],
            [
                'category_id' => 3, 'sku' => 'FLT-HON-PCX-01', 'nama' => 'Filter Udara Honda PCX 150',
                'deskripsi' => 'Element filter udara comp original Honda (17210-K97-N00).',
                'harga_beli' => 42000, 'harga_jual' => 58000, 'stok' => 10, 'stok_minimum' => 3, 'satuan' => 'pcs',
                'motor' => 'Honda PCX 150 Lokal, ADV 150', 'is_active' => true
            ],
            [
                'category_id' => 3, 'sku' => 'FLT-HON-OLI-01', 'nama' => 'Saringan Kasa Filter Oli Matic Honda',
                'deskripsi' => 'Oil screen strainer saringan oli bawah mesin Honda original.',
                'harga_beli' => 12000, 'harga_jual' => 20000, 'stok' => 30, 'stok_minimum' => 5, 'satuan' => 'pcs',
                'motor' => 'All Honda Matic (BeAT, Vario, Scoopy, PCX)', 'is_active' => true
            ],

            // 4. V-Belt & Roller (category_id = 4)
            [
                'category_id' => 4, 'sku' => 'VBL-BEAT-01', 'nama' => 'V-Belt Honda BeAT FI',
                'deskripsi' => 'Van belt kit sabuk penggerak CVT original AHM (23100-KZL-BA0).',
                'harga_beli' => 92000, 'harga_jual' => 125000, 'stok' => 12, 'stok_minimum' => 4, 'satuan' => 'set',
                'motor' => 'Honda BeAT FI, BeAT Pop, BeAT Street, Scoopy FI', 'is_active' => true
            ],
            [
                'category_id' => 4, 'sku' => 'VBL-VAR-01', 'nama' => 'V-Belt Honda Vario 125',
                'deskripsi' => 'Drive belt CVT Honda Genuine Parts (23100-KZR-601).',
                'harga_beli' => 110000, 'harga_jual' => 145000, 'stok' => 10, 'stok_minimum' => 3, 'satuan' => 'pcs',
                'motor' => 'Honda Vario 125 Old / New eSP, Vario 125 LED', 'is_active' => true
            ],
            [
                'category_id' => 4, 'sku' => 'VBL-PCX-01', 'nama' => 'V-Belt Honda PCX 150',
                'deskripsi' => 'Drive belt CVT Kevlar reinforced original AHM (23100-K97-T01).',
                'harga_beli' => 125000, 'harga_jual' => 165000, 'stok' => 8, 'stok_minimum' => 3, 'satuan' => 'pcs',
                'motor' => 'Honda PCX 150 Lokal, Vario 150 eSP, ADV 150', 'is_active' => true
            ],
            [
                'category_id' => 4, 'sku' => 'ROL-BEAT-01', 'nama' => 'Roller Honda BeAT FI (6 pcs)',
                'deskripsi' => 'Weight set roller CVT original Honda 13 gram isi 6 pcs (2212A-K44-V00).',
                'harga_beli' => 38000, 'harga_jual' => 55000, 'stok' => 15, 'stok_minimum' => 5, 'satuan' => 'set',
                'motor' => 'Honda BeAT FI, BeAT eSP, Scoopy eSP, Genio', 'is_active' => true
            ],
            [
                'category_id' => 4, 'sku' => 'ROL-VAR-01', 'nama' => 'Roller Honda Vario 125',
                'deskripsi' => 'Weight set roller CVT Vario 125 original Honda isi 6 pcs (2212A-KZR-600).',
                'harga_beli' => 42000, 'harga_jual' => 60000, 'stok' => 12, 'stok_minimum' => 4, 'satuan' => 'set',
                'motor' => 'Honda Vario 125 All Series (KZR / K35)', 'is_active' => true
            ],

            // 5. Busi (category_id = 5)
            [
                'category_id' => 5, 'sku' => 'BSI-NGK-CPR7EA-01', 'nama' => 'Busi NGK CPR7EA-9',
                'deskripsi' => 'Busi standar original NGK Spark Plug CPR7EA-9 untuk matic Honda.',
                'harga_beli' => 18000, 'harga_jual' => 28000, 'stok' => 30, 'stok_minimum' => 8, 'satuan' => 'pcs',
                'motor' => 'Honda BeAT All Series, Scoopy, Genio, Vario 110', 'is_active' => true
            ],
            [
                'category_id' => 5, 'sku' => 'BSI-NGK-CPR9EA-01', 'nama' => 'Busi NGK CPR9EA-9',
                'deskripsi' => 'Busi standar long reach NGK CPR9EA-9 untuk mesin eSP dan DOHC 150cc.',
                'harga_beli' => 22000, 'harga_jual' => 35000, 'stok' => 25, 'stok_minimum' => 5, 'satuan' => 'pcs',
                'motor' => 'Honda Vario 125, Vario 150, PCX 150, CB150R, CBR 150R', 'is_active' => true
            ],
            [
                'category_id' => 5, 'sku' => 'BSI-NGK-IRIDIUM-01', 'nama' => 'Busi NGK Iridium CPR9EAIX-9',
                'deskripsi' => 'Busi racing/high performance iridium ujung elektroda tipis 0.6mm.',
                'harga_beli' => 65000, 'harga_jual' => 95000, 'stok' => 10, 'stok_minimum' => 3, 'satuan' => 'pcs',
                'motor' => 'Honda Vario 125/150/160, PCX, CB150R, CBR 150R, Sonic', 'is_active' => true
            ],

            // 6. Bearing & Seal (category_id = 6)
            [
                'category_id' => 6, 'sku' => 'BRG-HON-BEAT-01', 'nama' => 'Bearing Roda Depan Honda BeAT',
                'deskripsi' => 'Bearing laher roda depan kode 6201 RS original AHM Astra Honda.',
                'harga_beli' => 25000, 'harga_jual' => 38000, 'stok' => 18, 'stok_minimum' => 5, 'satuan' => 'pcs',
                'motor' => 'Honda BeAT All Series, Scoopy, Spacy, Vario 110/125', 'is_active' => true
            ],
            [
                'category_id' => 6, 'sku' => 'BRG-HON-VAR-01', 'nama' => 'Bearing Roda Depan Honda Vario 150',
                'deskripsi' => 'Bearing roda depan radial deep groove 6301 RS original Honda.',
                'harga_beli' => 28000, 'harga_jual' => 42000, 'stok' => 15, 'stok_minimum' => 4, 'satuan' => 'pcs',
                'motor' => 'Honda Vario 150, PCX 150, CB150R, CBR 150R', 'is_active' => true
            ],
            [
                'category_id' => 6, 'sku' => 'SEL-FORK-BEAT-01', 'nama' => 'Oil Seal Shock Depan Honda BeAT',
                'deskripsi' => 'Seal oli shockbreaker depan set + dust seal original AHM (51490-KGH-901).',
                'harga_beli' => 22000, 'harga_jual' => 35000, 'stok' => 20, 'stok_minimum' => 5, 'satuan' => 'set',
                'motor' => 'Honda BeAT, Scoopy, Vario 110/125/150', 'is_active' => true
            ],

            // 7. Gear Set & Rantai (category_id = 7)
            [
                'category_id' => 7, 'sku' => 'GRS-HON-SUP-01', 'nama' => 'Rantai Honda Supra X 125',
                'deskripsi' => 'Drive chain kit rantai 428-104L + gear depan belakang original (06401-KTM-850).',
                'harga_beli' => 145000, 'harga_jual' => 195000, 'stok' => 8, 'stok_minimum' => 2, 'satuan' => 'set',
                'motor' => 'Honda Supra X 125, Supra X 125 FI, Karisma 125', 'is_active' => true
            ],
            [
                'category_id' => 7, 'sku' => 'GRS-HON-CB150-01', 'nama' => 'Gear Set Honda CB150R',
                'deskripsi' => 'Sprocket & chain set 428-124L Heavy Duty original Honda (06401-K15-900).',
                'harga_beli' => 220000, 'harga_jual' => 295000, 'stok' => 5, 'stok_minimum' => 2, 'satuan' => 'set',
                'motor' => 'Honda CB150R Streetfire, CBR 150R K45', 'is_active' => true
            ],

            // 8. Kelistrikan (category_id = 8)
            [
                'category_id' => 8, 'sku' => 'KRS-HON-BEAT-01', 'nama' => 'Coil Ignition Honda BeAT',
                'deskripsi' => 'Koil pengapian ignition coil assy original Honda (30510-K25-901).',
                'harga_beli' => 68000, 'harga_jual' => 95000, 'stok' => 6, 'stok_minimum' => 2, 'satuan' => 'pcs',
                'motor' => 'Honda BeAT FI / eSP, Scoopy FI, Vario 110 eSP', 'is_active' => true
            ],
            [
                'category_id' => 8, 'sku' => 'KRS-HON-KIP-01', 'nama' => 'Kiprok Rectifier Honda BeAT FI',
                'deskripsi' => 'Rectifier comp pengatur arus pengisian aki original AHM (31600-KZL-E01).',
                'harga_beli' => 125000, 'harga_jual' => 175000, 'stok' => 5, 'stok_minimum' => 2, 'satuan' => 'pcs',
                'motor' => 'Honda BeAT FI, Scoopy FI, Spacy FI', 'is_active' => true
            ],
            [
                'category_id' => 8, 'sku' => 'KRS-HON-LMP-01', 'nama' => 'Bohlam Lampu Depan Stanley HS1',
                'deskripsi' => 'Bohlam lampu utama depan original Stanley Halogen HS1 12V 35/35W.',
                'harga_beli' => 28000, 'harga_jual' => 42000, 'stok' => 25, 'stok_minimum' => 5, 'satuan' => 'pcs',
                'motor' => 'Honda BeAT Street, Vario 125 Old, Supra X 125, CB150R', 'is_active' => true
            ],

            // 9. Body & Exterior (category_id = 9)
            [
                'category_id' => 9, 'sku' => 'BDY-HON-SPN-01', 'nama' => 'Spion Standar Honda Kanan Kiri',
                'deskripsi' => 'Kaca spion standar original Honda ulir drat 14 arah jarum jam sepasang (88110-KWW-640).',
                'harga_beli' => 45000, 'harga_jual' => 65000, 'stok' => 14, 'stok_minimum' => 4, 'satuan' => 'set',
                'motor' => 'All Honda Matic / Bebek (BeAT, Vario, Supra, Scoopy)', 'is_active' => true
            ],

            // 10. Suspensi (category_id = 10)
            [
                'category_id' => 10, 'sku' => 'SUS-HON-BEAT-01', 'nama' => 'Shockbreaker Belakang Honda Beat',
                'deskripsi' => 'Cushion assy rear peredam kejut belakang original Honda (52400-K81-N01).',
                'harga_beli' => 185000, 'harga_jual' => 245000, 'stok' => 7, 'stok_minimum' => 2, 'satuan' => 'pcs',
                'motor' => 'Honda BeAT All Series, Scoopy, Genio, Vario 110', 'is_active' => true
            ],
            [
                'category_id' => 10, 'sku' => 'SUS-HON-VAR-01', 'nama' => 'Shock Absorber Belakang Honda Vario',
                'deskripsi' => 'Sokbreker belakang tunggal 330mm original AHM Showa (52400-K59-A11).',
                'harga_beli' => 210000, 'harga_jual' => 280000, 'stok' => 5, 'stok_minimum' => 2, 'satuan' => 'pcs',
                'motor' => 'Honda Vario 125, Vario 150 All Series', 'is_active' => true
            ],

            // 11. Kopling (category_id = 11)
            [
                'category_id' => 11, 'sku' => 'KPL-HON-SUP-01', 'nama' => 'Kampas Kopling Honda Supra X 125',
                'deskripsi' => 'Disk clutch lining kampas kopling gesek manual isi 4 pcs (22201-KPH-900).',
                'harga_beli' => 78000, 'harga_jual' => 110000, 'stok' => 10, 'stok_minimum' => 3, 'satuan' => 'set',
                'motor' => 'Honda Supra X 125, Karisma 125, Kirana', 'is_active' => true
            ],
            [
                'category_id' => 11, 'sku' => 'KPL-HON-BEAT-01', 'nama' => 'Kampas Ganda Matic Honda BeAT FI',
                'deskripsi' => 'Weight clutch assy sepatu kampas kopling ganda centrifugal (22535-KZL-A00).',
                'harga_beli' => 115000, 'harga_jual' => 155000, 'stok' => 8, 'stok_minimum' => 2, 'satuan' => 'set',
                'motor' => 'Honda BeAT FI / eSP / Street, Scoopy eSP, Genio', 'is_active' => true
            ],
            [
                'category_id' => 11, 'sku' => 'KPL-HON-VAR-01', 'nama' => 'Kampas Ganda CVT Honda Vario 125',
                'deskripsi' => 'Kampas kopling otomatis matic Vario 125/150 original Honda (22535-KZR-600).',
                'harga_beli' => 135000, 'harga_jual' => 185000, 'stok' => 6, 'stok_minimum' => 2, 'satuan' => 'set',
                'motor' => 'Honda Vario 125, Vario 150, PCX 150, ADV 150', 'is_active' => true
            ],

            // 12. Mesin (category_id = 12)
            [
                'category_id' => 12, 'sku' => 'MSN-HON-PST-01', 'nama' => 'Piston Kit Honda BeAT FI',
                'deskripsi' => 'Piston kit komplit + ring seher + pen piston + klip std original Honda (131A1-KZL-305).',
                'harga_beli' => 115000, 'harga_jual' => 160000, 'stok' => 6, 'stok_minimum' => 2, 'satuan' => 'set',
                'motor' => 'Honda BeAT FI, BeAT eSP, Scoopy FI', 'is_active' => true
            ],
            [
                'category_id' => 12, 'sku' => 'MSN-HON-GSK-01', 'nama' => 'Gasket Top Set Honda BeAT FI',
                'deskripsi' => 'Paking silinder blok dan head tembaga original AHM (06111-KZL-000).',
                'harga_beli' => 45000, 'harga_jual' => 65000, 'stok' => 12, 'stok_minimum' => 3, 'satuan' => 'set',
                'motor' => 'Honda BeAT FI, Scoopy FI, Spacy FI', 'is_active' => true
            ],
            [
                'category_id' => 12, 'sku' => 'MSN-HON-INJ-01', 'nama' => 'Injector Fuel Honda BeAT FI',
                'deskripsi' => 'Injektor bahan bakar injeksi 6 lubang semburan presisi Keihin Honda (16450-K25-901).',
                'harga_beli' => 165000, 'harga_jual' => 225000, 'stok' => 4, 'stok_minimum' => 2, 'satuan' => 'pcs',
                'motor' => 'Honda BeAT FI, BeAT eSP, Scoopy eSP, Vario 110 eSP', 'is_active' => true
            ],
            [
                'category_id' => 12, 'sku' => 'MSN-HON-PMP-01', 'nama' => 'Fuel Pump Rotak Honda Vario 125',
                'deskripsi' => 'Motor dinamo rotak fuel pump tekanan 294 kPa original Mitsuba Honda (16700-KZR-601).',
                'harga_beli' => 185000, 'harga_jual' => 260000, 'stok' => 0, 'stok_minimum' => 2, 'satuan' => 'pcs',
                'motor' => 'Honda Vario 125 Old/LED, Vario 150, BeAT FI K25', 'is_active' => true
            ],
        ];

        foreach ($products as $prod) {
            Product::create($prod);
        }
    }
}