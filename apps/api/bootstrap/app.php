<?php

use App\Exceptions\ExternalServiceException;
use App\Http\Middleware\EnsureAdminIsActive;
use App\Http\Middleware\RequestId;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        apiPrefix: 'api/v1',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->statefulApi();
        $middleware->alias([
            'active.admin' => EnsureAdminIsActive::class,
        ]);

        $middleware->append(RequestId::class);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $error = static fn (Request $request, string $message, int $status, array $meta = []): JsonResponse => response()->json([
            'data' => null,
            'message' => $message,
            'meta' => [
                ...$meta,
                'request_id' => $request->header('X-Request-ID'),
            ],
        ], $status);

        $exceptions->render(function (ValidationException $exception, Request $request) use ($error): ?JsonResponse {
            return $request->is('api/*')
                ? $error($request, 'Data tidak valid.', 422, ['errors' => $exception->errors()])
                : null;
        });

        $exceptions->render(function (AuthenticationException $exception, Request $request) use ($error): ?JsonResponse {
            return $request->is('api/*')
                ? $error($request, 'Sesi tidak valid atau telah berakhir.', 401)
                : null;
        });

        $exceptions->render(function (AuthorizationException $exception, Request $request) use ($error): ?JsonResponse {
            return $request->is('api/*')
                ? $error($request, 'Anda tidak memiliki izin untuk tindakan ini.', 403)
                : null;
        });

        $exceptions->render(function (AccessDeniedHttpException $exception, Request $request) use ($error): ?JsonResponse {
            return $request->is('api/*')
                ? $error($request, 'Anda tidak memiliki izin untuk tindakan ini.', 403)
                : null;
        });

        $exceptions->render(function (ModelNotFoundException $exception, Request $request) use ($error): ?JsonResponse {
            return $request->is('api/*')
                ? $error($request, 'Data tidak ditemukan.', 404)
                : null;
        });

        $exceptions->render(function (NotFoundHttpException $exception, Request $request) use ($error): ?JsonResponse {
            return $request->is('api/*')
                ? $error($request, 'Data tidak ditemukan.', 404)
                : null;
        });

        $exceptions->render(function (QueryException $exception, Request $request) use ($error): ?JsonResponse {
            return $request->is('api/*') && str_starts_with((string) $exception->getCode(), '23')
                ? $error($request, 'Data bertentangan dengan data yang sudah ada.', 409)
                : null;
        });

        $exceptions->render(function (ConnectionException|RequestException $exception, Request $request) use ($error): ?JsonResponse {
            return $request->is('api/*')
                ? $error($request, 'Layanan eksternal sedang tidak tersedia.', 502)
                : null;
        });

        $exceptions->render(function (ExternalServiceException $exception, Request $request) use ($error): ?JsonResponse {
            return $request->is('api/*')
                ? $error($request, 'Layanan eksternal sedang tidak tersedia.', 502)
                : null;
        });
    })->create();
