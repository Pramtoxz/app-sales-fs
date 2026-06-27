<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GuestBook extends Model
{
    protected $connection = 'pgsql_sales';
    protected $table = 'H1_DOS.guest_book';
    protected $primaryKey = 'IDGuestBook';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'IDGuestBook',
        'NamaCustomer',
        'KodeWarna',
        'KodeType',
        'Tanggal',
        'DeskripsiWarnaMotor',
        'RencanaPembayaran',
        'TipeCustomer',
        'Status_guestbook',
        'Keterangan',
        'fk_dealer',
        'id_flp',
        'NamaKariawan',
        'Source',
        'NoHp',
        'AlamatProspect',
        'AlamatKantorProspect',
        'created_by',
    ];

    protected $casts = [
        'Tanggal' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
