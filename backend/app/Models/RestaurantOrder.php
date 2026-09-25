<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class RestaurantOrder extends Model
{
    protected $table = 'transaksi';
    protected $primaryKey = 'id_transaksi';
    protected $fillable = [
        'kode_transaksi', 'id_pelanggan', 'id_kasir', 'jenis_pesanan', 'no_meja',
        'tgl_transaksi', 'subtotal', 'pb1', 'total_bayar', 'status_pesanan', 'catatan',
    ];

    protected function casts(): array
    {
        return ['tgl_transaksi' => 'datetime'];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'id_pelanggan', 'id_pelanggan');
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class, 'id_transaksi', 'id_transaksi');
    }

    public function payment(): HasOne
    {
        return $this->hasOne(Payment::class, 'id_transaksi', 'id_transaksi');
    }
}
