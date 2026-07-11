<?php

use App\Http\Controllers\BannerController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DashboardWidgetController;
use App\Http\Controllers\FlpWebController;
use App\Http\Controllers\IndentWebController;
use App\Http\Controllers\LoginController;
use App\Http\Controllers\MenuController;
use App\Http\Controllers\NotificationWebController;
use App\Http\Controllers\PerformanceWebController;
use App\Http\Controllers\StockWebController;
use App\Http\Controllers\TargetController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('dashboard');
    }
    return redirect()->route('login');
})->name('home');

Route::middleware('guest')->group(function () {
    Route::get('/login', [LoginController::class, 'create'])->name('login');
    Route::post('/login', [LoginController::class, 'store'])->name('login.store');
});

Route::post('/logout', [LoginController::class, 'destroy'])
    ->middleware('auth')
    ->name('logout');

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::get('dashboard/data/summary', [DashboardController::class, 'summary']);
    Route::get('dashboard/data/flp-performance', [DashboardController::class, 'flpPerformance']);
    Route::get('dashboard/data/target-vs-actual', [DashboardController::class, 'targetVsActual']);
    Route::get('dashboard/data/prospek', [DashboardController::class, 'prospek']);
    Route::get('dashboard/data/stock', [DashboardController::class, 'stock']);
    Route::get('dashboard/data/indent', [DashboardController::class, 'indent']);
    Route::get('dashboard/data/dealers', [DashboardController::class, 'dealers']);
    Route::get('dashboard/data/data-sources', [DashboardController::class, 'dataSources']);
    Route::get('dashboard/data/widget-types', [DashboardController::class, 'widgetTypes']);

    Route::middleware(['check.menu.access'])->group(function () {
        Route::get('target-dealer', [TargetController::class, 'index'])->name('target-dealer.index');
        Route::get('target-dealer/data', [TargetController::class, 'getData'])->name('target-dealer.data');
        Route::post('target-dealer/upload', [TargetController::class, 'uploadExcel'])->name('target-dealer.upload');
        Route::get('target-dealer/template', [TargetController::class, 'downloadTemplate'])->name('target-dealer.template');
        Route::get('target-dealer/{kode_dealer}', [TargetController::class, 'show'])->name('target-dealer.show');
        Route::get('target-dealer/{kode_dealer}/data', [TargetController::class, 'getShowData'])->name('target-dealer.show-data');
        Route::get('target-dealer/{kode_dealer}/series', [TargetController::class, 'getSeriesList'])->name('target-dealer.series');
        Route::post('target-dealer/flp/save', [TargetController::class, 'saveTargetFlp'])->name('target-dealer.flp.save');
        Route::post('target-dealer/flp/{id}/delete', [TargetController::class, 'deleteTargetFlp'])->name('target-dealer.flp.delete');

        Route::get('settings/menus', [MenuController::class, 'index'])->name('settings.menus.index');
        Route::post('settings/menus', [MenuController::class, 'store'])->name('settings.menus.store');
        Route::put('settings/menus/{id}', [MenuController::class, 'update'])->name('settings.menus.update');
        Route::delete('settings/menus/{id}', [MenuController::class, 'destroy'])->name('settings.menus.destroy');

        Route::get('banner', [BannerController::class, 'index'])->name('banner.index');
        Route::post('banner', [BannerController::class, 'store'])->name('banner.store');
        Route::put('banner/{id}', [BannerController::class, 'update'])->name('banner.update');
        Route::delete('banner/{id}', [BannerController::class, 'destroy'])->name('banner.destroy');

        Route::get('notifikasi', [NotificationWebController::class, 'index'])->name('notifikasi.index');
        Route::get('notifikasi/sales', [NotificationWebController::class, 'getSales'])->name('notifikasi.sales');
        Route::post('notifikasi/send', [NotificationWebController::class, 'send'])->name('notifikasi.send');

        Route::get('stock', [StockWebController::class, 'index'])->name('stock.index');
        Route::get('stock/data', [StockWebController::class, 'getData'])->name('stock.data');

        Route::get('indent', [IndentWebController::class, 'index'])->name('indent.index');
        Route::get('indent/data', [IndentWebController::class, 'getData'])->name('indent.data');

        Route::get('flp', [FlpWebController::class, 'index'])->name('flp.index');
        Route::get('flp/data', [FlpWebController::class, 'getData'])->name('flp.data');

        Route::get('performance', [PerformanceWebController::class, 'index'])->name('performance.index');
        Route::get('performance/data', [PerformanceWebController::class, 'getData'])->name('performance.data');

        Route::get('settings/dashboard', [DashboardWidgetController::class, 'index'])->name('settings.dashboard.index');
        Route::post('settings/dashboard', [DashboardWidgetController::class, 'store']);
        Route::put('settings/dashboard/{id}', [DashboardWidgetController::class, 'update']);
        Route::put('settings/dashboard/layout', [DashboardWidgetController::class, 'updateLayout']);
        Route::delete('settings/dashboard/{id}', [DashboardWidgetController::class, 'destroy']);
        Route::post('settings/dashboard/reset', [DashboardWidgetController::class, 'reset']);
    });
});
