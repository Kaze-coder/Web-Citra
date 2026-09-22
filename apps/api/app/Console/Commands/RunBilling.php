<?php

namespace App\Console\Commands;

use App\Services\BillingService;
use Illuminate\Console\Command;

class RunBilling extends Command
{
    protected $signature = 'billing:run';

    protected $description = 'Create due customer invoices and queue notifications';

    public function handle(BillingService $billing): int
    {
        $result = $billing->run();
        $this->info("Checked {$result['checked']}; created {$result['created']}; queued {$result['queued']}; skipped {$result['skipped']}.");

        return self::SUCCESS;
    }
}
