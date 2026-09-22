<?php

namespace App\Services;

use App\Jobs\GeocodeCustomer;
use App\Models\Pelanggan;
use DateTimeInterface;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use OpenSpout\Reader\CSV\Reader as CsvReader;
use OpenSpout\Reader\ODS\Reader as OdsReader;
use OpenSpout\Reader\ReaderInterface;
use OpenSpout\Reader\XLSX\Reader as XlsxReader;
use RuntimeException;
use Throwable;

class CustomerImportService
{
    private const HEADERS = [
        'nama_pelanggan' => ['namapelanggan', 'nama'],
        'no_telepon' => ['notelepon', 'telepon', 'nohp'],
        'email' => ['email'],
        'alamat' => ['alamat'],
        'paket_layanan' => ['paketlayanan', 'paket'],
        'harga_bulanan' => ['hargabulanan', 'harga'],
        'tanggal_langganan' => ['tanggallangganan'],
    ];

    public function import(UploadedFile $file): array
    {
        $reader = $this->reader($file->getClientOriginalExtension());
        $reader->open($file->getRealPath());
        $result = ['imported' => 0, 'skipped' => 0, 'errors' => []];

        try {
            foreach ($reader->getSheetIterator() as $sheet) {
                $headers = [];
                foreach ($sheet->getRowIterator() as $index => $row) {
                    $values = $row->toArray();
                    if ($index === 1) {
                        $headers = $this->mapHeaders($values);
                        $this->assertRequiredHeaders($headers);

                        continue;
                    }

                    if ($this->emptyRow($values)) {
                        continue;
                    }

                    $this->importRow($index, $values, $headers, $result);
                }

                break;
            }
        } finally {
            $reader->close();
        }

        return $result;
    }

    private function importRow(int $rowNumber, array $values, array $headers, array &$result): void
    {
        $value = fn (string $field): mixed => isset($headers[$field]) ? ($values[$headers[$field]] ?? null) : null;
        $phone = preg_replace('/\D+/', '', (string) $value('no_telepon')) ?? '';
        if ($phone !== '' && ! str_starts_with($phone, '0') && ! str_starts_with($phone, '62')) {
            $phone = '0'.$phone;
        }

        $data = [
            'nama_pelanggan' => trim((string) $value('nama_pelanggan')),
            'no_telepon' => $phone,
            'email' => $this->nullableString($value('email')),
            'alamat' => trim((string) $value('alamat')),
            'status' => 'aktif',
            'paket_layanan' => $this->nullableString($value('paket_layanan')),
            'harga_bulanan' => $this->nullableNumber($value('harga_bulanan')),
            'tanggal_langganan' => $this->date($value('tanggal_langganan')),
        ];
        $validator = Validator::make($data, [
            'nama_pelanggan' => ['required', 'string', 'max:100'],
            'no_telepon' => ['required', 'regex:/^(?:62|0)[0-9]{9,12}$/', Rule::unique('pelanggan', 'no_telepon')],
            'email' => ['nullable', 'email', 'max:100'],
            'alamat' => ['required', 'string'],
            'paket_layanan' => ['nullable', 'string', 'max:50'],
            'harga_bulanan' => ['nullable', 'numeric', 'min:0'],
            'tanggal_langganan' => ['required', 'date'],
        ]);

        if ($validator->fails()) {
            $result['skipped']++;
            $result['errors'][] = ['row' => $rowNumber, 'errors' => $validator->errors()->toArray()];

            return;
        }

        try {
            $customer = Pelanggan::query()->create($validator->validated());
            GeocodeCustomer::dispatch($customer->id);
            $result['imported']++;
        } catch (Throwable $exception) {
            report($exception);
            $result['skipped']++;
            $result['errors'][] = ['row' => $rowNumber, 'errors' => ['database' => ['Data gagal disimpan.']]];
        }
    }

    private function reader(string $extension): ReaderInterface
    {
        return match (strtolower($extension)) {
            'csv' => new CsvReader,
            'xlsx' => new XlsxReader,
            'ods' => new OdsReader,
            default => throw new RuntimeException('Format spreadsheet tidak didukung.'),
        };
    }

    private function mapHeaders(array $values): array
    {
        $normalized = [];
        foreach ($values as $index => $header) {
            $normalized[preg_replace('/[^a-z0-9]/', '', strtolower((string) $header))] = $index;
        }

        $mapped = [];
        foreach (self::HEADERS as $field => $aliases) {
            foreach ($aliases as $alias) {
                if (array_key_exists($alias, $normalized)) {
                    $mapped[$field] = $normalized[$alias];
                    break;
                }
            }
        }

        return $mapped;
    }

    private function assertRequiredHeaders(array $headers): void
    {
        $missing = array_diff(['nama_pelanggan', 'no_telepon', 'alamat'], array_keys($headers));
        if ($missing !== []) {
            throw ValidationException::withMessages([
                'file' => ['Kolom wajib tidak ditemukan: '.implode(', ', $missing).'.'],
            ]);
        }
    }

    private function emptyRow(array $values): bool
    {
        return count(array_filter($values, fn ($value): bool => $value !== null && trim((string) $value) !== '')) === 0;
    }

    private function nullableString(mixed $value): ?string
    {
        $value = trim((string) $value);

        return $value === '' ? null : $value;
    }

    private function nullableNumber(mixed $value): int|float|null
    {
        if ($value === null || $value === '') {
            return null;
        }

        $normalized = preg_replace('/[^0-9.-]/', '', (string) $value);

        return is_numeric($normalized) ? (float) $normalized : null;
    }

    private function date(mixed $value): string
    {
        if ($value instanceof DateTimeInterface) {
            return $value->format('Y-m-d');
        }

        try {
            return $value ? Carbon::parse((string) $value)->toDateString() : now()->toDateString();
        } catch (Throwable) {
            return (string) $value;
        }
    }
}
