<?php

namespace App\Http\Requests;

use App\Models\Tagihan;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class TagihanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $required = $this->isMethod('post') ? 'required' : 'sometimes';
        $tagihan = $this->route('tagihan');
        $tagihanId = $tagihan instanceof Tagihan ? $tagihan->id : $tagihan;
        $pelangganId = $this->input('pelanggan_id', $tagihan instanceof Tagihan ? $tagihan->pelanggan_id : null);

        return [
            'pelanggan_id' => [$required, 'integer', 'exists:pelanggan,id'],
            'bulan_tagihan' => [$required, 'date'],
            'jumlah_tagihan' => [$required, 'numeric', 'gt:0'],
            'status_pembayaran' => ['sometimes', Rule::in(['lunas', 'belum_lunas', 'cicilan'])],
            'tanggal_pembayaran' => ['sometimes', 'nullable', 'date'],
            'metode_pembayaran' => ['sometimes', 'nullable', 'string', 'max:50'],
            'catatan' => ['sometimes', 'nullable', 'string'],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $tagihan = $this->route('tagihan');
                $tagihanId = $tagihan instanceof Tagihan ? $tagihan->id : $tagihan;
                $pelangganId = $this->input('pelanggan_id', $tagihan instanceof Tagihan ? $tagihan->pelanggan_id : null);
                $bulan = $this->input('bulan_tagihan');

                if (! $pelangganId || ! $bulan || $validator->errors()->hasAny(['pelanggan_id', 'bulan_tagihan'])) {
                    return;
                }

                $exists = Tagihan::query()
                    ->where('pelanggan_id', $pelangganId)
                    ->whereDate('bulan_tagihan', $bulan)
                    ->when($tagihanId, fn ($query) => $query->whereKeyNot($tagihanId))
                    ->exists();

                if ($exists) {
                    $validator->errors()->add('bulan_tagihan', 'Tagihan pelanggan untuk bulan ini sudah ada.');
                }
            },
        ];
    }
}
