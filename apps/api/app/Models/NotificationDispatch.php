<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NotificationDispatch extends Model
{
    protected $fillable = [
        'dedupe_key',
        'channel',
        'recipient',
        'message',
        'status',
        'attempts',
        'last_error',
        'sent_at',
    ];

    protected function casts(): array
    {
        return ['sent_at' => 'datetime'];
    }
}
