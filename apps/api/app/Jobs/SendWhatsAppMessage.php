<?php

namespace App\Jobs;

use App\Models\NotificationDispatch;
use App\Services\FonnteService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Throwable;

class SendWhatsAppMessage implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $uniqueFor = 300;

    public function __construct(public readonly int $dispatchId) {}

    public function handle(FonnteService $fonnte): void
    {
        $dispatch = NotificationDispatch::query()->findOrFail($this->dispatchId);
        if ($dispatch->status === 'sent') {
            return;
        }

        try {
            $fonnte->send($dispatch->recipient, $dispatch->message);
            $dispatch->update([
                'status' => 'sent',
                'attempts' => $dispatch->attempts + 1,
                'last_error' => null,
                'sent_at' => now(),
            ]);
        } catch (Throwable $exception) {
            $dispatch->update([
                'status' => 'failed',
                'attempts' => $dispatch->attempts + 1,
                'last_error' => mb_substr($exception->getMessage(), 0, 2000),
            ]);

            throw $exception;
        }
    }

    public function backoff(): array
    {
        return [30, 120, 300];
    }

    public function uniqueId(): string
    {
        return (string) $this->dispatchId;
    }
}
