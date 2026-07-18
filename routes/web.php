<?php

use App\Http\Controllers\BannerController;
use App\Http\Controllers\DashboardController;
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
    Route::get('dashboard/data', [DashboardController::class, 'getData']);

    Route::middleware(['check.menu.access'])->group(function () {
        Route::get('target-dealer', [TargetController::class, 'index'])->name('target-dealer.index');
        Route::get('target-dealer/data', [TargetController::class, 'getData'])->name('target-dealer.data');
        Route::post('target-dealer/upload', [TargetController::class, 'uploadExcel'])->name('target-dealer.upload');
        Route::get('target-dealer/template', [TargetController::class, 'downloadTemplate'])->name('target-dealer.template');
        Route::get('target-dealer/export', [TargetController::class, 'exportExcel'])->name('target-dealer.export');
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
        Route::get('banner/create', [BannerController::class, 'create'])->name('banner.create');
        Route::post('banner', [BannerController::class, 'store'])->name('banner.store');
        Route::get('banner/{id}', [BannerController::class, 'show'])->name('banner.show');
        Route::get('banner/{id}/edit', [BannerController::class, 'edit'])->name('banner.edit');
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
    });
});
