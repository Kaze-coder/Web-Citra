<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Lokasi extends Model
{
    protected $table = 'lokasi';

    public const CREATED_AT = 'tanggal_dibuat';

    public const UPDATED_AT = null;

    protected $fillable = [
        'pelanggan_id',
        'latitude',
        'longitude',
        'keterangan_lokasi',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'decimal:8',
            'longitude' => 'decimal:8',
            'tanggal_dibuat' => 'datetime',
        ];
    }

    public function pelanggan(): BelongsTo
    {
        return $this->belongsTo(Pelanggan::class, 'pelanggan_id');
    }
}
