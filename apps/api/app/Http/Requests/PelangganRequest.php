<?php

namespace App\Http\Requests;

use App\Models\Pelanggan;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PelangganRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('no_telepon')) {
            $this->merge([
                'no_telepon' => preg_replace('/[-\s]/', '', (string) $this->input('no_telepon')),
            ]);
        }
    }

    public function rules(): array
    {
        $required = $this->isMethod('post') ? 'required' : 'sometimes';
        $pelanggan = $this->route('pelanggan');
        $pelangganId = $pelanggan instanceof Pelanggan ? $pelanggan->id : $pelanggan;

        return [
            'nama_pelanggan' => [$required, 'string', 'max:100'],
            'no_telepon' => [
                $required,
                'regex:/^(?:\+62|0)[0-9]{9,12}$/',
                Rule::unique('pelanggan', 'no_telepon')->ignore($pelangganId),
            ],
            'email' => ['sometimes', 'nullable', 'email', 'max:100'],
            'alamat' => [$required, 'string'],
            'status' => ['sometimes', Rule::in(['aktif', 'nonaktif', 'suspend'])],
            'paket_layanan' => ['sometimes', 'nullable', 'string', 'max:50'],
            'harga_bulanan' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'tanggal_langganan' => ['sometimes', 'date'],
            'latitude' => ['sometimes', 'nullable', 'numeric', 'between:-90,90', 'required_with:longitude'],
            'longitude' => ['sometimes', 'nullable', 'numeric', 'between:-180,180', 'required_with:latitude'],
        ];
    }
}
