<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['nama' => 'Oli & Pelumas', 'deskripsi' => 'Oli mesin, oli gardan, dan pelumas Honda Genuine', 'icon' => '🛢️'],
            ['nama' => 'Kampas Rem', 'deskripsi' => 'Brake pad depan dan belakang original Honda', 'icon' => '🛑'],
            ['nama' => 'Filter', 'deskripsi' => 'Filter udara dan filter oli genuine', 'icon' => '🌀'],
            ['nama' => 'V-Belt & Roller', 'deskripsi' => 'V-belt, roller, dan slider set CVT', 'icon' => '⚙️'],
            ['nama' => 'Busi', 'deskripsi' => 'Busi standar dan iridium untuk motor Honda', 'icon' => '🔥'],
            ['nama' => 'Bearing & Seal', 'deskripsi' => 'Bearing roda, oil seal fork', 'icon' => '🔩'],
            ['nama' => 'Gear Set & Rantai', 'deskripsi' => 'Gear set, rantai, dan drive chain kit', 'icon' => '⛓️'],
            ['nama' => 'Kelistrikan', 'deskripsi' => 'CDI, rectifier, stator, lampu', 'icon' => '⚡'],
            ['nama' => 'Body & Exterior', 'deskripsi' => 'Spion, handle grip, visor, cover', 'icon' => '🏍️'],
            ['nama' => 'Suspensi', 'deskripsi' => 'Shock absorber, fork, bush arm', 'icon' => '🔧'],
            ['nama' => 'Kopling', 'deskripsi' => 'Kampas kopling, clutch weight, per kopling', 'icon' => '🔄'],
            ['nama' => 'Mesin', 'deskripsi' => 'Piston, gasket, injector, fuel pump, throttle body', 'icon' => '🏎️']
        ];

        foreach ($categories as $cat) {
            Category::create($cat);
        }
    }
}