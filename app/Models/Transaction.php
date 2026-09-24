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
        'bank',
        'status_pembayaran',
        'status_pesanan',
        'bukti_bayar',
        'bukti_bayar_original_name',
        'bukti_bayar_at',
        'catatan_penolakan',
        'konfirmasi_at',
        'verified_by',
        'catatan'
    ];

    protected $casts = [
        'subtotal' => 'float',
        'diskon' => 'float',
        'total' => 'float',
        'bayar' => 'float',
        'kembalian' => 'float',
        'bukti_bayar_at' => 'datetime',
        'konfirmasi_at' => 'datetime'
    ];

    protected $appends = [
        'bukti_bayar_url',
        'payment_proof_url',
        'payment_status',
        'order_status',
        'payment_proof',
        'payment_proof_uploaded_at',
        'payment_verified_at',
        'payment_verified_by',
        'payment_rejection_reason'
    ];

    public function getBuktiBayarUrlAttribute()
    {
        if (!$this->bukti_bayar) return null;
        return url('api/transactions/' . $this->id . '/proof');
    }

    public function getPaymentProofUrlAttribute()
    {
        return $this->getBuktiBayarUrlAttribute();
    }

    public function getPaymentProofAttribute()
    {
        return $this->bukti_bayar;
    }

    public function getPaymentProofUploadedAtAttribute()
    {
        return $this->bukti_bayar_at;
    }

    public function getPaymentVerifiedAtAttribute()
    {
        return $this->konfirmasi_at;
    }

    public function getPaymentVerifiedByAttribute()
    {
        return $this->verified_by;
    }

    public function getPaymentRejectionReasonAttribute()
    {
        return $this->catatan_penolakan;
    }

    public function getPaymentStatusAttribute()
    {
        return $this->status_pembayaran;
    }

    public function getOrderStatusAttribute()
    {
        return $this->status_pesanan;
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function verifier()
    {
        return $this->belongsTo(User::class, 'verified_by');
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