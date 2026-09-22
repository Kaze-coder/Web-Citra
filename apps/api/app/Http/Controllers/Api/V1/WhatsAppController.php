<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Tagihan;
use App\Services\BillingService;
use App\Services\WhatsAppDispatcher;
use App\Services\WhatsAppMessageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WhatsAppController extends Controller
{
    public function send(Request $request, WhatsAppDispatcher $dispatcher): JsonResponse
    {
        $this->authorize('send-whatsapp');
        $validated = $request->validate([
            'phone' => ['required', 'string', 'regex:/^[0-9+()\s-]{8,24}$/'],
            'message' => ['required', 'string', 'max:4096'],
        ]);

        $dispatch = $dispatcher->dispatch(
            $validated['phone'],
            $validated['message'],
            'manual:'.$request->user()->getAuthIdentifier().':'.now()->toDateString().':'.$validated['phone'].':'.$validated['message'],
        );

        return $this->success(['dispatch_id' => $dispatch->id], 'Pesan WhatsApp masuk antrean.', status: 202);
    }

    public function reminder(Request $request, WhatsAppMessageService $messages, WhatsAppDispatcher $dispatcher): JsonResponse
    {
        $this->authorize('send-whatsapp');
        $validated = $request->validate(['tagihan_id' => ['required', 'integer', 'exists:tagihan,id']]);
        $tagihan = Tagihan::query()->with('pelanggan')->findOrFail($validated['tagihan_id']);

        $dispatch = $dispatcher->dispatch(
            $tagihan->pelanggan->no_telepon,
            $messages->billingReminder($tagihan->pelanggan, $tagihan),
            "billing-reminder:{$tagihan->id}",
        );

        return $this->success(['dispatch_id' => $dispatch->id], 'Reminder tagihan masuk antrean.', status: 202);
    }

    public function confirmation(Request $request, WhatsAppMessageService $messages, WhatsAppDispatcher $dispatcher): JsonResponse
    {
        $this->authorize('send-whatsapp');
        $validated = $request->validate(['tagihan_id' => ['required', 'integer', 'exists:tagihan,id']]);
        $tagihan = Tagihan::query()->with('pelanggan')->findOrFail($validated['tagihan_id']);

        $dispatch = $dispatcher->dispatch(
            $tagihan->pelanggan->no_telepon,
            $messages->paymentConfirmation($tagihan->pelanggan, $tagihan),
            "payment-confirmation:{$tagihan->id}",
        );

        return $this->success(['dispatch_id' => $dispatch->id], 'Konfirmasi pembayaran masuk antrean.', status: 202);
    }

    public function remindersH3(BillingService $billing): JsonResponse
    {
        $this->authorize('send-whatsapp');
        $queued = $billing->queueH3Reminders();

        return $this->success(['queued' => $queued], "{$queued} reminder H-3 diproses.", status: 202);
    }
}
