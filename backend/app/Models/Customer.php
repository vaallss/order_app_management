<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    protected $table = 'pelanggan';
    protected $primaryKey = 'id_pelanggan';
    protected $fillable = ['nama_pelanggan', 'no_tlp'];

    public function orders(): HasMany
    {
        return $this->hasMany(RestaurantOrder::class, 'id_pelanggan', 'id_pelanggan');
    }
}
