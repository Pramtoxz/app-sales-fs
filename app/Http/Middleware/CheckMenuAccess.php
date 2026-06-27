<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class CheckMenuAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            abort(403, 'Unauthorized access.');
        }

        $roles = $user->getRoles();

        if (empty($roles)) {
            return redirect()->route('dashboard')
                ->with('error', 'Anda tidak memiliki akses.');
        }

        $routeName = $request->route()->getName();

        if (!$routeName) {
            return $next($request);
        }

        $baseRoute = explode('.', $routeName)[0] ?? null;

        if (!$baseRoute) {
            return $next($request);
        }

        $hasAccess = DB::connection('pgsql')
            ->table('menus')
            ->join('menu_role', 'menus.id', '=', 'menu_role.menu_id')
            ->whereIn('menu_role.role', $roles)
            ->where('menus.status_aktif', true)
            ->where(function ($query) use ($baseRoute) {
                $query->where('menus.route', 'like', $baseRoute . '%')
                    ->orWhere('menus.url', 'like', '/' . $baseRoute . '%');
            })
            ->exists();

        if (!$hasAccess) {
            return redirect()->route('dashboard')
                ->with('error', 'Anda tidak memiliki akses ke halaman ini.');
        }

        return $next($request);
    }
}
