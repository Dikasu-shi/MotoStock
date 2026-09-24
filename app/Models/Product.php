<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id',
        'sku',
        'part_number',
        'nama',
        'deskripsi',
        'harga_beli',
        'harga_jual',
        'stok',
        'stok_minimum',
        'satuan',
        'motor',
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'harga_beli' => 'float',
        'harga_jual' => 'float',
        'stok' => 'integer',
        'stok_minimum' => 'integer'
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function stockHistories()
    {
        return $this->hasMany(StockHistory::class);
    }
}