<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MenuRole extends Model
{
    protected $connection = 'pgsql';
    protected $table = 'menu_role';

    protected $fillable = ['menu_id', 'role'];

    public function menu(): BelongsTo
    {
        return $this->belongsTo(Menu::class, 'menu_id');
    }
}
