<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class RequestId
{
    public function handle(Request $request, Closure $next): Response
    {
        $providedId = $request->header('X-Request-ID');
        $requestId = is_string($providedId) && Str::isUuid($providedId)
            ? $providedId
            : (string) Str::uuid();

        $request->headers->set('X-Request-ID', $requestId);

        /** @var Response $response */
        $response = $next($request);

        $response->headers->set('X-Request-ID', $requestId);

        return $response;
    }
}
