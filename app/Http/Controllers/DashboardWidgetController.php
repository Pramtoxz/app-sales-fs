<?php

namespace App\Http\Controllers;

use App\Models\DashboardWidget;
use App\Models\DashboardWidgetType;
use App\Models\DashboardDataSource;
use App\Models\DashboardTemplate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class DashboardWidgetController extends Controller
{
    public function index(): Response
    {
        $user = Auth::user();

        $widgetTypes = DashboardWidgetType::all();
        $dataSources = DashboardDataSource::all();
        $widgets = DashboardWidget::where('user_id', $user->id)
            ->with(['widgetType', 'dataSource'])
            ->orderBy('pos_y')
            ->orderBy('pos_x')
            ->get();

        if ($widgets->isEmpty()) {
            $roles = $user->getRoles();
            $role = $roles[0] ?? 'IT';
            $templates = DashboardTemplate::where('role', $role)
                ->with(['widgetType', 'dataSource'])
                ->orderBy('sort_order')
                ->get();

            foreach ($templates as $tpl) {
                DashboardWidget::create([
                    'user_id' => $user->id,
                    'widget_type_id' => $tpl->widget_type_id,
                    'data_source_id' => $tpl->data_source_id,
                    'title' => $tpl->title,
                    'config' => $tpl->config,
                    'pos_x' => $tpl->pos_x,
                    'pos_y' => $tpl->pos_y,
                    'width' => $tpl->width,
                    'height' => $tpl->height,
                    'visible' => true,
                ]);
            }

            $widgets = DashboardWidget::where('user_id', $user->id)
                ->with(['widgetType', 'dataSource'])
                ->orderBy('pos_y')
                ->orderBy('pos_x')
                ->get();
        }

        return Inertia::render('settings/dashboard/Index', [
            'widgetTypes' => $widgetTypes,
            'dataSources' => $dataSources,
            'widgets' => $widgets->map(fn ($w) => [
                'id' => $w->id,
                'widget_type_id' => $w->widget_type_id,
                'widget_type_key' => $w->widgetType->key,
                'widget_type_label' => $w->widgetType->label,
                'widget_type_component' => $w->widgetType->component,
                'data_source_id' => $w->data_source_id,
                'data_source_key' => $w->dataSource->key,
                'data_source_label' => $w->dataSource->label,
                'data_source_endpoint' => $w->dataSource->endpoint,
                'title' => $w->title,
                'config' => $w->config ?? [],
                'pos_x' => $w->pos_x,
                'pos_y' => $w->pos_y,
                'width' => $w->width,
                'height' => $w->height,
                'visible' => $w->visible,
            ]),
            'isKacab' => $user->isKacab(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'widget_type_id' => 'required|exists:dashboard_widget_types,id',
            'data_source_id' => 'required|exists:dashboard_data_sources,id',
            'title' => 'required|string|max:255',
            'config' => 'nullable|array',
            'pos_x' => 'nullable|integer|min:0',
            'pos_y' => 'nullable|integer|min:0',
            'width' => 'nullable|integer|min:1|max:12',
            'height' => 'nullable|integer|min:1|max:20',
        ]);

        $user = Auth::user();

        $widget = DashboardWidget::create([
            'user_id' => $user->id,
            'widget_type_id' => $request->widget_type_id,
            'data_source_id' => $request->data_source_id,
            'title' => $request->title,
            'config' => $request->config ?? [],
            'pos_x' => $request->input('pos_x', 0),
            'pos_y' => $request->input('pos_y', 0),
            'width' => $request->input('width', 6),
            'height' => $request->input('height', 4),
            'visible' => true,
        ]);

        $widget->load(['widgetType', 'dataSource']);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $widget->id,
                'widget_type_id' => $widget->widget_type_id,
                'widget_type_key' => $widget->widgetType->key,
                'widget_type_label' => $widget->widgetType->label,
                'widget_type_component' => $widget->widgetType->component,
                'data_source_id' => $widget->data_source_id,
                'data_source_key' => $widget->dataSource->key,
                'data_source_label' => $widget->dataSource->label,
                'data_source_endpoint' => $widget->dataSource->endpoint,
                'title' => $widget->title,
                'config' => $widget->config ?? [],
                'pos_x' => $widget->pos_x,
                'pos_y' => $widget->pos_y,
                'width' => $widget->width,
                'height' => $widget->height,
                'visible' => $widget->visible,
            ],
        ]);
    }

    public function update(Request $request, int $id)
    {
        $user = Auth::user();
        $widget = DashboardWidget::where('user_id', $user->id)->findOrFail($id);

        $request->validate([
            'title' => 'sometimes|string|max:255',
            'config' => 'nullable|array',
            'pos_x' => 'nullable|integer|min:0',
            'pos_y' => 'nullable|integer|min:0',
            'width' => 'nullable|integer|min:1|max:12',
            'height' => 'nullable|integer|min:1|max:20',
            'visible' => 'nullable|boolean',
        ]);

        $data = array_filter($request->only(['title', 'config', 'pos_x', 'pos_y', 'width', 'height', 'visible']), fn ($v) => !is_null($v));

        $widget->update($data);

        return response()->json(['success' => true]);
    }

    public function updateLayout(Request $request)
    {
        $user = Auth::user();

        $request->validate([
            'layouts' => 'required|array',
            'layouts.*.id' => 'required|integer',
            'layouts.*.pos_x' => 'required|integer|min:0',
            'layouts.*.pos_y' => 'required|integer|min:0',
            'layouts.*.width' => 'required|integer|min:1|max:12',
            'layouts.*.height' => 'required|integer|min:1|max:20',
        ]);

        foreach ($request->layouts as $layout) {
            DashboardWidget::where('id', $layout['id'])
                ->where('user_id', $user->id)
                ->update([
                    'pos_x' => $layout['pos_x'],
                    'pos_y' => $layout['pos_y'],
                    'width' => $layout['width'],
                    'height' => $layout['height'],
                ]);
        }

        return response()->json(['success' => true]);
    }

    public function destroy(int $id)
    {
        $user = Auth::user();
        DashboardWidget::where('user_id', $user->id)->where('id', $id)->delete();

        return response()->json(['success' => true]);
    }

    public function reset()
    {
        $user = Auth::user();

        DashboardWidget::where('user_id', $user->id)->delete();

        $roles = $user->getRoles();
        $role = $roles[0] ?? 'IT';

        $templates = DashboardTemplate::where('role', $role)
            ->with(['widgetType', 'dataSource'])
            ->orderBy('sort_order')
            ->get();

        $widgets = [];
        foreach ($templates as $tpl) {
            $w = DashboardWidget::create([
                'user_id' => $user->id,
                'widget_type_id' => $tpl->widget_type_id,
                'data_source_id' => $tpl->data_source_id,
                'title' => $tpl->title,
                'config' => $tpl->config,
                'pos_x' => $tpl->pos_x,
                'pos_y' => $tpl->pos_y,
                'width' => $tpl->width,
                'height' => $tpl->height,
                'visible' => true,
            ]);
            $w->load(['widgetType', 'dataSource']);
            $widgets[] = [
                'id' => $w->id,
                'widget_type_id' => $w->widget_type_id,
                'widget_type_key' => $w->widgetType->key,
                'widget_type_label' => $w->widgetType->label,
                'widget_type_component' => $w->widgetType->component,
                'data_source_id' => $w->data_source_id,
                'data_source_key' => $w->dataSource->key,
                'data_source_label' => $w->dataSource->label,
                'data_source_endpoint' => $w->dataSource->endpoint,
                'title' => $w->title,
                'config' => $w->config ?? [],
                'pos_x' => $w->pos_x,
                'pos_y' => $w->pos_y,
                'width' => $w->width,
                'height' => $w->height,
                'visible' => $w->visible,
            ];
        }

        return response()->json(['success' => true, 'data' => $widgets]);
    }
}
