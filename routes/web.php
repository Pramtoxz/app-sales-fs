<?php

use App\Http\Controllers\LoginController;
use App\Http\Controllers\MenuController;
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
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

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
    });
});
