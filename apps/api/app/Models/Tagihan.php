<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Tagihan extends Model
{
    protected $table = 'tagihan';

    public const CREATED_AT = 'tanggal_dibuat';

    public const UPDATED_AT = 'tanggal_diperbarui';

    protected $fillable = [
        'pelanggan_id',
        'bulan_tagihan',
        'jumlah_tagihan',
        'status_pembayaran',
        'tanggal_pembayaran',
        'metode_pembayaran',
        'catatan',
    ];

    protected function casts(): array
    {
        return [
            'bulan_tagihan' => 'date',
            'jumlah_tagihan' => 'decimal:2',
            'tanggal_pembayaran' => 'date',
            'tanggal_dibuat' => 'datetime',
            'tanggal_diperbarui' => 'datetime',
        ];
    }

    public function pelanggan(): BelongsTo
    {
        return $this->belongsTo(Pelanggan::class, 'pelanggan_id');
    }
}
