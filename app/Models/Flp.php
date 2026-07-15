<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Flp extends Model
{
    use HasFactory;

    protected $connection = 'pgsql_sales';
    protected $table = 'public.flp';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id_flp',
        'nama',
        'kode_dealer',
        'jabatan',
        'user_id',
        'team',
        'last_login',
        'is_active',
        'foto',
        'created_at',
        'updated_at'
    ];

    protected $casts = [
        'target' => 'integer',
        'id_level' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'id_flp', 'kd_kariawan');
    }

    public function devices()
    {
        return $this->hasMany(FlpDevice::class, 'id_flp', 'id_flp');
    }
}
