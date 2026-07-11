<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DashboardTemplate extends Model
{
    protected $connection = 'pgsql';
    protected $table = 'dashboard_templates';

    protected $fillable = [
        'role',
        'widget_type_id',
        'data_source_id',
        'title',
        'config',
        'pos_x',
        'pos_y',
        'width',
        'height',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'config' => 'array',
            'pos_x' => 'integer',
            'pos_y' => 'integer',
            'width' => 'integer',
            'height' => 'integer',
            'sort_order' => 'integer',
        ];
    }

    public function widgetType(): BelongsTo
    {
        return $this->belongsTo(DashboardWidgetType::class, 'widget_type_id');
    }

    public function dataSource(): BelongsTo
    {
        return $this->belongsTo(DashboardDataSource::class, 'data_source_id');
    }
}
