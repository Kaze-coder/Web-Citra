<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Perangkat extends Model
{
    protected $table = 'perangkat';

    public const CREATED_AT = 'tanggal_dibuat';

    public const UPDATED_AT = 'tanggal_diperbarui';

    protected $fillable = [
        'pelanggan_id',
        'nama_perangkat',
        'tipe_perangkat',
        'ip_address',
        'mac_address',
        'serial_number',
        'status_perangkat',
        'tanggal_instalasi',
    ];

    protected function casts(): array
    {
        return [
            'tanggal_instalasi' => 'date',
            'tanggal_dibuat' => 'datetime',
            'tanggal_diperbarui' => 'datetime',
        ];
    }

    public function pelanggan(): BelongsTo
    {
        return $this->belongsTo(Pelanggan::class, 'pelanggan_id');
    }
}
