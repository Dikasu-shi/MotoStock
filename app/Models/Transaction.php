<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'no_invoice',
        'user_id',
        'customer_id',
        'subtotal',
        'diskon',
        'total',
        'bayar',
        'kembalian',
        'metode_bayar',
        'catatan'
    ];

    protected $casts = [
        'subtotal' => 'float',
        'diskon' => 'float',
        'total' => 'float',
        'bayar' => 'float',
        'kembalian' => 'float'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function items()
    {
        return $this->hasMany(TransactionItem::class);
    }
}