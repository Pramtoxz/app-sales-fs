<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DashboardWidget extends Model
{
    protected $connection = 'pgsql';
    protected $table = 'dashboard_widgets';

    protected $fillable = [
        'user_id',
        'widget_type_id',
        'data_source_id',
        'title',
        'config',
        'pos_x',
        'pos_y',
        'width',
        'height',
        'visible',
    ];

    protected function casts(): array
    {
        return [
            'config' => 'array',
            'visible' => 'boolean',
            'pos_x' => 'integer',
            'pos_y' => 'integer',
            'width' => 'integer',
            'height' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
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
