<?php

namespace App\Http\Controllers;

use App\Models\Menu;
use App\Models\MenuRole;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class MenuController extends Controller
{
    public function index(): Response
    {
        $menus = Menu::with(['children' => function ($q) {
                $q->orderBy('urutan');
            }, 'menuRole'])
            ->whereNull('parent_id')
            ->orderBy('urutan')
            ->get();

        $allRoles = ['IT', 'KACAB', 'MD'];

        return Inertia::render('settings/menus/Index', [
            'menus' => $menus,
            'allRoles' => $allRoles,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama_menu' => 'required|string|max:255',
            'ikon' => 'nullable|string|max:100',
            'route' => 'nullable|string|max:255',
            'url' => 'nullable|string|max:255',
            'parent_id' => 'nullable|exists:menus,id',
            'urutan' => 'nullable|integer|min:0',
            'status_aktif' => 'nullable|boolean',
            'roles' => 'nullable|array',
            'roles.*' => 'in:IT,KACAB,MD',
        ]);

        try {
            DB::beginTransaction();

            $menu = Menu::create([
                'nama_menu' => $request->nama_menu,
                'ikon' => $request->ikon,
                'route' => $request->route,
                'url' => $request->url,
                'parent_id' => $request->parent_id,
                'urutan' => $request->urutan ?? 0,
                'status_aktif' => $request->boolean('status_aktif', true),
            ]);

            if ($request->has('roles')) {
                foreach ($request->roles as $role) {
                    MenuRole::create(['menu_id' => $menu->id, 'role' => $role]);
                }
            }

            DB::commit();

            return response()->json(['success' => true, 'menu' => $menu]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, int $id)
    {
        $request->validate([
            'nama_menu' => 'required|string|max:255',
            'ikon' => 'nullable|string|max:100',
            'route' => 'nullable|string|max:255',
            'url' => 'nullable|string|max:255',
            'parent_id' => 'nullable|exists:menus,id',
            'urutan' => 'nullable|integer|min:0',
            'status_aktif' => 'nullable|boolean',
            'roles' => 'nullable|array',
            'roles.*' => 'in:IT,KACAB,MD',
        ]);

        try {
            DB::beginTransaction();

            $menu = Menu::findOrFail($id);
            $menu->update([
                'nama_menu' => $request->nama_menu,
                'ikon' => $request->ikon,
                'route' => $request->route,
                'url' => $request->url,
                'parent_id' => $request->parent_id,
                'urutan' => $request->urutan ?? $menu->urutan,
                'status_aktif' => $request->boolean('status_aktif', $menu->status_aktif),
            ]);

            if ($request->has('roles')) {
                MenuRole::where('menu_id', $id)->delete();
                foreach ($request->roles as $role) {
                    MenuRole::create(['menu_id' => $id, 'role' => $role]);
                }
            }

            DB::commit();

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function destroy(int $id)
    {
        try {
            DB::beginTransaction();

            MenuRole::where('menu_id', $id)->delete();
            Menu::where('parent_id', $id)->each(function ($child) {
                MenuRole::where('menu_id', $child->id)->delete();
                $child->delete();
            });
            Menu::where('id', $id)->delete();

            DB::commit();

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}
