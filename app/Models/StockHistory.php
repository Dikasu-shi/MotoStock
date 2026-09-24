<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockHistory extends Model
{
    use HasFactory;

    protected $table = 'stock_history';

    protected $fillable = [
        'product_id',
        'user_id',
        'type',
        'qty',
        'stok_sebelum',
        'stok_sesudah',
        'keterangan',
        'reference_id'
    ];

    protected $casts = [
        'qty' => 'integer',
        'stok_sebelum' => 'integer',
        'stok_sesudah' => 'integer'
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}