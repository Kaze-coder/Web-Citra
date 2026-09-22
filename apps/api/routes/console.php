<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('billing:run')->dailyAt('00:00')->withoutOverlapping()->onOneServer();
Schedule::command('billing:remind')->dailyAt('08:00')->withoutOverlapping()->onOneServer();
