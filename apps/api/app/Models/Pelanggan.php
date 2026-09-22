<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Pelanggan extends Model
{
    protected $table = 'pelanggan';

    public const CREATED_AT = 'tanggal_dibuat';

    public const UPDATED_AT = 'tanggal_diperbarui';

    protected $fillable = [
        'nama_pelanggan',
        'no_telepon',
        'email',
        'alamat',
        'status',
        'paket_layanan',
        'harga_bulanan',
        'tanggal_langganan',
    ];

    protected function casts(): array
    {
        return [
            'harga_bulanan' => 'decimal:2',
            'tanggal_langganan' => 'date',
            'tanggal_dibuat' => 'datetime',
            'tanggal_diperbarui' => 'datetime',
        ];
    }

    public function lokasi(): HasOne
    {
        return $this->hasOne(Lokasi::class, 'pelanggan_id');
    }

    public function perangkat(): HasMany
    {
        return $this->hasMany(Perangkat::class, 'pelanggan_id');
    }

    public function tagihan(): HasMany
    {
        return $this->hasMany(Tagihan::class, 'pelanggan_id');
    }
}
