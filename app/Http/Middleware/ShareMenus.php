<?php

namespace App\Http\Middleware;

use App\Models\Menu;
use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class ShareMenus
{
    public function handle(Request $request, Closure $next): Response
    {
        if (auth()->check()) {
            $user = auth()->user();
            $roles = $user->getRoles();

            if (empty($roles)) {
                Inertia::share('menus', collect());
            } else {
                $menus = Menu::where('status_aktif', true)
                    ->whereNull('parent_id')
                    ->whereHas('menuRole', fn ($q) => $q->whereIn('role', $roles))
                    ->with(['children' => function ($query) use ($roles) {
                        $query->where('status_aktif', true)
                            ->whereHas('menuRole', fn ($q) => $q->whereIn('role', $roles))
                            ->orderBy('urutan');
                    }])
                    ->orderBy('urutan')
                    ->get();

                Inertia::share('menus', $menus);
            }
        }

        return $next($request);
    }
}
