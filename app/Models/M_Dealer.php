<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class M_Dealer extends Model
{
    protected $connection = 'pgsql_sales';
    protected $table = 'public.tbldealer';
    public $timestamps = false;

    protected $fillable = [
        'kd_dealer_md',
        'kd_dealer_ahm',
        'jenis_dealer',
        'nm_alias_dealer',
        'nm_alias_dealer_2',
        'alamat',
        'dealer_active'
    ];

    protected $casts = [
        'dealer_active' => 'boolean',
    ];

    public function getNamaBersihAttribute(): ?string
    {
        $nama = $this->nm_alias_dealer_2;
        if (!$nama) return null;
        return strlen($nama) > 4 ? substr($nama, 4) : $nama;
    }
}