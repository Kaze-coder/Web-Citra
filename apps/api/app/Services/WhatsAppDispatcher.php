<?php

namespace App\Services;

use App\Jobs\SendWhatsAppMessage;
use App\Models\NotificationDispatch;

class WhatsAppDispatcher
{
    public function dispatch(string $phone, string $message, string $dedupeSource): NotificationDispatch
    {
        $dispatch = NotificationDispatch::query()->firstOrCreate(
            ['dedupe_key' => hash('sha256', $dedupeSource)],
            [
                'channel' => 'whatsapp',
                'recipient' => $phone,
                'message' => $message,
                'status' => 'queued',
            ],
        );

        if ($dispatch->wasRecentlyCreated || $dispatch->status === 'failed') {
            $dispatch->update(['status' => 'queued']);
            SendWhatsAppMessage::dispatch($dispatch->id);
        }

        return $dispatch;
    }
}
