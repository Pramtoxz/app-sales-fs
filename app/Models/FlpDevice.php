<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FlpDevice extends Model
{
    use HasFactory;

    protected $connection = 'pgsql_sales';
    protected $table = 'public.flp_devices';

    protected $fillable = [
        'id_flp',
        'user_id',
        'device_id',
        'device_name',
        'device_type',
        'fcm_token',
        'biometric_token',
        'last_active',
    ];

    protected $casts = [
        'last_active' => 'datetime',
    ];

    public function flp()
    {
        return $this->belongsTo(Flp::class, 'id_flp', 'id_flp');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }
}
