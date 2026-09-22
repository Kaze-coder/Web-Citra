<?php

namespace App\Console\Commands;

use App\Services\BillingService;
use Illuminate\Console\Command;

class QueueBillingReminders extends Command
{
    protected $signature = 'billing:remind';

    protected $description = 'Queue H-3 reminders for unpaid invoices';

    public function handle(BillingService $billing): int
    {
        $queued = $billing->queueH3Reminders();
        $this->info("Queued {$queued} billing reminders.");

        return self::SUCCESS;
    }
}
