<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class FlpResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'id_flp' => $this->id_flp,
            'nama' => $this->nama,
            'kd_dlr' => $this->kode_dealer,
            'jabatan' => $this->jabatan,
            'foto' => $this->foto ? Storage::disk('public')->url($this->foto) : null,
        ];
    }
}
