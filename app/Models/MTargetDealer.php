<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class MTargetDealer extends Model
{
    protected $connection = 'pgsql_sales';
    protected $table = 'H1_DOS.tbl_target_dealer';
    protected $primaryKey = 'id';
    public $incrementing = true;
    public $timestamps = true;

    public $fillable = [
        'kode_dealer',
        'series',
        'bulan_tahun',
        'target'
    ];
}