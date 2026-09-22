<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Admin extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'admin';

    public const CREATED_AT = 'tanggal_dibuat';

    public const UPDATED_AT = 'tanggal_diperbarui';

    protected $fillable = [
        'username',
        'email',
        'password',
        'nama_lengkap',
        'status',
        'role',
    ];

    protected $hidden = [
        'password',
    ];

    protected function casts(): array
    {
        return [
            'tanggal_dibuat' => 'datetime',
            'tanggal_diperbarui' => 'datetime',
            'tanggal_login_terakhir' => 'datetime',
        ];
    }
}
