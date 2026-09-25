<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    protected $table = 'produk';
    protected $primaryKey = 'id_produk';
    protected $fillable = ['nama_produk', 'kategori', 'deskripsi', 'foto_url', 'harga', 'stok', 'aktif'];

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class, 'id_produk', 'id_produk');
    }
}
