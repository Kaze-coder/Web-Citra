<?php

namespace App\Http\Requests;

use App\Models\Lokasi;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class LokasiRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $required = $this->isMethod('post') ? 'required' : 'sometimes';
        $lokasi = $this->route('lokasi');
        $lokasiId = $lokasi instanceof Lokasi ? $lokasi->id : $lokasi;

        return [
            'pelanggan_id' => [
                $required,
                'integer',
                'exists:pelanggan,id',
                Rule::unique('lokasi', 'pelanggan_id')->ignore($lokasiId),
            ],
            'latitude' => [$required, 'numeric', 'between:-90,90'],
            'longitude' => [$required, 'numeric', 'between:-180,180'],
            'keterangan_lokasi' => ['sometimes', 'nullable', 'string', 'max:255'],
        ];
    }
}
