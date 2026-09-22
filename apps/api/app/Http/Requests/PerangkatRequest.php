<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PerangkatRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $required = $this->isMethod('post') ? 'required' : 'sometimes';

        return [
            'pelanggan_id' => [$required, 'integer', 'exists:pelanggan,id'],
            'nama_perangkat' => [$required, 'string', 'max:100'],
            'tipe_perangkat' => ['sometimes', Rule::in(['router', 'modem', 'mikrotik', 'other'])],
            'ip_address' => ['sometimes', 'nullable', 'ip'],
            'mac_address' => ['sometimes', 'nullable', 'string', 'max:50'],
            'serial_number' => ['sometimes', 'nullable', 'string', 'max:100'],
            'status_perangkat' => ['sometimes', Rule::in(['aktif', 'mati', 'error'])],
            'tanggal_instalasi' => ['sometimes', 'nullable', 'date'],
        ];
    }
}
