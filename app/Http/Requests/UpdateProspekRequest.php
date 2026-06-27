<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class UpdateProspekRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'tanggal' => 'sometimes|date',
            'nama_customer' => 'sometimes|string|max:255',
            'no_hp' => 'sometimes|string|max:20',
            'kode_type' => 'sometimes|string|max:10',
            'kode_warna' => 'sometimes|string|max:10',
            'rencana_pembayaran' => 'sometimes|in:1,2',
            'tipe_customer' => 'sometimes|string|max:10',
            'alamat_prospect' => 'sometimes|string',
            'alamat_kantor_prospect' => 'nullable|string',
            'source' => 'sometimes|string',
            'keterangan' => 'nullable|string',
        ];
    }

    public function messages(): array
    {
        return [
            'rencana_pembayaran.in' => 'Rencana pembayaran harus Cash (1) atau Credit (2)',
        ];
    }

    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(
            response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422)
        );
    }
}
