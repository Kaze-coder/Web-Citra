<?php

namespace App\Services;

use App\Models\Pelanggan;
use App\Models\Tagihan;

class WhatsAppMessageService
{
    public function billingReminder(Pelanggan $pelanggan, Tagihan $tagihan): string
    {
        $period = $tagihan->bulan_tagihan->locale('id')->translatedFormat('F Y');

        return "*Notifikasi Tagihan WiFi*\n\n"
            ."Halo {$pelanggan->nama_pelanggan},\n\n"
            ."Paket: {$pelanggan->paket_layanan}\n"
            .'Jumlah tagihan: Rp'.$this->currency($tagihan->jumlah_tagihan)."\n"
            ."Periode: {$period}\n"
            ."Status: Belum Dibayar\n\n"
            .'Mohon segera lakukan pembayaran untuk menjaga kelancaran layanan. Terima kasih.';
    }

    public function paymentConfirmation(Pelanggan $pelanggan, Tagihan $tagihan): string
    {
        $paidAt = ($tagihan->tanggal_pembayaran ?? now())->locale('id')->translatedFormat('d F Y');

        return "Terima kasih {$pelanggan->nama_pelanggan}.\n\n"
            ."Pembayaran Anda telah diterima.\n"
            .'Jumlah: Rp'.$this->currency($tagihan->jumlah_tagihan)."\n"
            ."Tanggal: {$paidAt}\n\n"
            .'Layanan Anda tetap aktif.';
    }

    private function currency(string|int|float $value): string
    {
        return number_format((float) $value, 0, ',', '.');
    }
}
