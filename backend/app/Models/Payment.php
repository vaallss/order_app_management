<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    protected $table = 'pembayaran';
    protected $primaryKey = 'id_pembayaran';
    protected $fillable = [
        'id_transaksi', 'metode_bayar', 'status_pembayaran', 'jumlah_bayar',
        'uang_diterima', 'kembalian', 'no_referensi', 'dibayar_pada',
    ];

    protected function casts(): array
    {
        return ['dibayar_pada' => 'datetime'];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(RestaurantOrder::class, 'id_transaksi', 'id_transaksi');
    }
}
