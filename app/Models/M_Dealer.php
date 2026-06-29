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
        'nm_dealer',
        'alamat',
    ];
}