<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AdminRequest extends FormRequest
{
    public function rules(): array
    {
        $adminId = $this->route('admin')?->id;
        $required = $this->isMethod('post') ? ['required'] : ['sometimes'];

        return [
            'username' => [...$required, 'string', 'min:3', 'max:50', Rule::unique('admin')->ignore($adminId)],
            'email' => [...$required, 'email', 'max:100', Rule::unique('admin')->ignore($adminId)],
            'password' => [...$required, 'string', 'min:8', 'max:255', 'confirmed'],
            'nama_lengkap' => ['sometimes', 'nullable', 'string', 'max:100'],
            'status' => ['sometimes', Rule::in(['aktif', 'nonaktif'])],
            'role' => [...$required, Rule::in(['super_admin', 'admin', 'operator'])],
        ];
    }
}
