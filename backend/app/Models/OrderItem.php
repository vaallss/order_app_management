<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends Model
{
    protected $table = 'detail_transaksi';
    protected $primaryKey = 'id_detail';
    protected $fillable = ['id_transaksi', 'id_produk', 'nama_produk', 'harga_satuan', 'jumlah', 'catatan', 'subtotal_item'];

    public function order(): BelongsTo
    {
        return $this->belongsTo(RestaurantOrder::class, 'id_transaksi', 'id_transaksi');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'id_produk', 'id_produk');
    }
}
