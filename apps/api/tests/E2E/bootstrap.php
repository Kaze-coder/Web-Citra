<?php

declare(strict_types=1);

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Tests\Concerns\BuildsLegacySchema;

$basePath = dirname(__DIR__, 2);
$testingDirectory = $basePath.'/storage/framework/testing';
$database = getenv('E2E_DB_PATH') ?: $testingDirectory.'/e2e.sqlite';

if (pathinfo($database, PATHINFO_EXTENSION) !== 'sqlite'
    || str_replace('\\', '/', dirname($database)) !== str_replace('\\', '/', $testingDirectory)) {
    fwrite(STDERR, "Refusing to reset an E2E database outside storage/framework/testing.\n");
    exit(1);
}

if (! is_dir(dirname($database))) {
    mkdir(dirname($database), 0777, true);
}

if (is_file($database)) {
    unlink($database);
}

touch($database);

$environment = [
    'APP_ENV' => 'testing',
    'APP_DEBUG' => 'false',
    'BCRYPT_ROUNDS' => '4',
    'CACHE_STORE' => 'array',
    'DB_CONNECTION' => 'sqlite',
    'DB_DATABASE' => $database,
    'DB_QUEUE_CONNECTION' => 'sqlite',
    'QUEUE_CONNECTION' => 'database',
    'SESSION_DRIVER' => 'file',
];

foreach ($environment as $key => $value) {
    putenv("{$key}={$value}");
    $_ENV[$key] = $value;
    $_SERVER[$key] = $value;
}

require $basePath.'/vendor/autoload.php';
$app = require $basePath.'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$schema = new class
{
    use BuildsLegacySchema {
        createLegacySchema as public build;
    }
};
$schema->build();

Schema::create('jobs', function (Blueprint $table): void {
    $table->id();
    $table->string('queue')->index();
    $table->longText('payload');
    $table->unsignedTinyInteger('attempts');
    $table->unsignedInteger('reserved_at')->nullable();
    $table->unsignedInteger('available_at');
    $table->unsignedInteger('created_at');
});

$now = now();
foreach ([
    ['superadmin', 'superadmin@example.test', 'Super Admin E2E', 'super_admin'],
    ['admin', 'admin@example.test', 'Admin E2E', 'admin'],
    ['operator', 'operator@example.test', 'Operator E2E', 'operator'],
] as [$username, $email, $name, $role]) {
    DB::table('admin')->insert([
        'username' => $username,
        'email' => $email,
        'password' => Hash::make('password123'),
        'nama_lengkap' => $name,
        'status' => 'aktif',
        'role' => $role,
        'tanggal_dibuat' => $now,
        'tanggal_diperbarui' => $now,
    ]);
}

$customerId = DB::table('pelanggan')->insertGetId([
    'nama_pelanggan' => 'Pelanggan Seed',
    'no_telepon' => '628123450001',
    'email' => 'pelanggan@example.test',
    'alamat' => 'Jl. Pengujian No. 1, Bogor',
    'status' => 'aktif',
    'paket_layanan' => 'Fiber 50 Mbps',
    'harga_bulanan' => 350000,
    'tanggal_langganan' => '2026-01-10',
    'tanggal_dibuat' => $now,
    'tanggal_diperbarui' => $now,
]);

DB::table('lokasi')->insert([
    'pelanggan_id' => $customerId,
    'latitude' => -6.5971,
    'longitude' => 106.8060,
    'keterangan_lokasi' => 'Lokasi E2E',
    'tanggal_dibuat' => $now,
]);

DB::table('tagihan')->insert([
    'pelanggan_id' => $customerId,
    'bulan_tagihan' => '2026-09-01',
    'jumlah_tagihan' => 350000,
    'status_pembayaran' => 'belum_lunas',
    'catatan' => 'Tagihan seed E2E',
    'tanggal_dibuat' => $now,
    'tanggal_diperbarui' => $now,
]);

fwrite(STDOUT, "E2E database ready: {$database}\n");
