<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Pelanggan;
use App\Services\CustomerImportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerImportController extends Controller
{
    public function __invoke(Request $request, CustomerImportService $importer): JsonResponse
    {
        $this->authorize('create', Pelanggan::class);
        $validated = $request->validate([
            'file' => ['required', 'file', 'mimes:csv,xlsx,ods', 'max:10240'],
        ]);
        $result = $importer->import($validated['file']);

        return $this->success($result, "Import selesai: {$result['imported']} berhasil, {$result['skipped']} dilewati.");
    }
}
