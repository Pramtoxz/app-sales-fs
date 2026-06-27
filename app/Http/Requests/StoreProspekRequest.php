<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class StoreProspekRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'tanggal' => 'required|date',
            'nama_customer' => 'required|string|max:255',
            'no_hp' => 'required|string|max:20',
            'kode_type' => 'required|string|max:10',
            'kode_warna' => 'required|string|max:10',
            'rencana_pembayaran' => 'required|in:1,2',
            'tipe_customer' => 'required|string|max:10',
            'alamat_prospect' => 'required|string',
            'alamat_kantor_prospect' => 'nullable|string',
            'source' => 'required|string',
            'keterangan' => 'nullable|string',
        ];
    }

    public function messages(): array
    {
        return [
            'tanggal.required' => 'Tanggal harus diisi',
            'nama_customer.required' => 'Nama customer harus diisi',
            'no_hp.required' => 'Nomor HP harus diisi',
            'kode_type.required' => 'Tipe kendaraan harus dipilih',
            'kode_warna.required' => 'Warna kendaraan harus dipilih',
            'rencana_pembayaran.required' => 'Rencana pembayaran harus dipilih',
            'rencana_pembayaran.in' => 'Rencana pembayaran harus Cash (1) atau Credit (2)',
            'tipe_customer.required' => 'Tipe customer harus dipilih',
            'alamat_prospect.required' => 'Alamat prospect harus diisi',
            'source.required' => 'Source harus diisi',
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
