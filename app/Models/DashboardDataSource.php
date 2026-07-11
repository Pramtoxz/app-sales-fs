<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DashboardDataSource extends Model
{
    protected $connection = 'pgsql';
    protected $table = 'dashboard_data_sources';

    protected $fillable = ['key', 'label', 'endpoint', 'description', 'default_config'];

    protected function casts(): array
    {
        return [
            'default_config' => 'array',
        ];
    }

    public function widgets(): HasMany
    {
        return $this->hasMany(DashboardWidget::class, 'data_source_id');
    }

    public function templates(): HasMany
    {
        return $this->hasMany(DashboardTemplate::class, 'data_source_id');
    }
}
