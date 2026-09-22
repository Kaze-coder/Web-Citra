<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HealthController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        return response()->json([
            'data' => [
                'status' => 'healthy',
                'timestamp' => now()->toIso8601String(),
            ],
            'message' => 'Service is running.',
            'meta' => [
                'version' => '1.0.0',
                'request_id' => $request->header('X-Request-ID'),
            ],
        ]);
    }
}
