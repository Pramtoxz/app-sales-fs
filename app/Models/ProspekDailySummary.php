<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProspekDailySummary extends Model
{
    protected $connection = 'pgsql';
    protected $table = 'prospek_daily_summary';

    protected $fillable = [
        'tanggal',
        'kd_dealer',
        'id_flp',
        'jml_prospek',
        'jml_deal',
    ];
}
