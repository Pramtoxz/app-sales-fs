<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DashboardWidgetType extends Model
{
    protected $connection = 'pgsql';
    protected $table = 'dashboard_widget_types';

    protected $fillable = ['key', 'label', 'component', 'icon'];

    public function widgets(): HasMany
    {
        return $this->hasMany(DashboardWidget::class, 'widget_type_id');
    }

    public function templates(): HasMany
    {
        return $this->hasMany(DashboardTemplate::class, 'widget_type_id');
    }
}
