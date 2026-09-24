<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = ['nama', 'telepon', 'alamat', 'email', 'poin'];

    protected $casts = [
        'poin' => 'integer'
    ];

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }
}