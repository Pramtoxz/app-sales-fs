<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Menu;
use App\Models\MenuRole;

class MenuSeeder extends Seeder
{
    public function run(): void
    {
        MenuRole::query()->delete();
        Menu::query()->delete();

        $ALL = ['IT', 'KACAB', 'MD'];

        $menus = [
            [
                'nama_menu' => 'Dashboard',
                'ikon' => 'LayoutDashboard',
                'route' => 'dashboard',
                'url' => '/dashboard',
                'parent_id' => null,
                'urutan' => 1,
                'status_aktif' => true,
                'roles' => $ALL,
            ],
            [
                'nama_menu' => 'Prospek',
                'ikon' => 'Target',
                'route' => null,
                'url' => null,
                'parent_id' => null,
                'urutan' => 2,
                'status_aktif' => true,
                'roles' => $ALL,
                'children' => [
                    [
                        'nama_menu' => 'Data Prospek',
                        'ikon' => 'List',
                        'route' => 'prospek.index',
                        'url' => '/prospek',
                        'urutan' => 1,
                        'status_aktif' => true,
                        'roles' => $ALL,
                    ],
                    [
                        'nama_menu' => 'Jumlah Prospek',
                        'ikon' => 'BarChart3',
                        'route' => 'prospek.jumlah',
                        'url' => '/prospek/jumlah',
                        'urutan' => 2,
                        'status_aktif' => true,
                        'roles' => $ALL,
                    ],
                ],
            ],
            [
                'nama_menu' => 'Penjualan',
                'ikon' => 'ShoppingCart',
                'route' => null,
                'url' => null,
                'parent_id' => null,
                'urutan' => 3,
                'status_aktif' => true,
                'roles' => $ALL,
                'children' => [
                    [
                        'nama_menu' => 'Target Sales',
                        'ikon' => 'TrendingUp',
                        'route' => 'target-sales.index',
                        'url' => '/target-sales',
                        'urutan' => 1,
                        'status_aktif' => true,
                        'roles' => $ALL,
                    ],
                    [
                        'nama_menu' => 'Actual SPK',
                        'ikon' => 'FileCheck',
                        'route' => 'actual-spk.index',
                        'url' => '/actual-spk',
                        'urutan' => 2,
                        'status_aktif' => true,
                        'roles' => $ALL,
                    ],
                    [
                        'nama_menu' => 'Actual Sales',
                        'ikon' => 'DollarSign',
                        'route' => 'actual-sales.index',
                        'url' => '/actual-sales',
                        'urutan' => 3,
                        'status_aktif' => true,
                        'roles' => $ALL,
                    ],
                ],
            ],
            [
                'nama_menu' => 'Unit',
                'ikon' => 'Truck',
                'route' => null,
                'url' => null,
                'parent_id' => null,
                'urutan' => 4,
                'status_aktif' => true,
                'roles' => $ALL,
                'children' => [
                    [
                        'nama_menu' => 'Stock',
                        'ikon' => 'Package',
                        'route' => 'stock.index',
                        'url' => '/stock',
                        'urutan' => 1,
                        'status_aktif' => true,
                        'roles' => $ALL,
                    ],
                    [
                        'nama_menu' => 'Indent',
                        'ikon' => 'ClipboardList',
                        'route' => 'indent.index',
                        'url' => '/indent',
                        'urutan' => 2,
                        'status_aktif' => true,
                        'roles' => $ALL,
                    ],
                ],
            ],
            [
                'nama_menu' => 'Performance',
                'ikon' => 'Activity',
                'route' => 'performance.index',
                'url' => '/performance',
                'parent_id' => null,
                'urutan' => 5,
                'status_aktif' => true,
                'roles' => $ALL,
            ],
            [
                'nama_menu' => 'Target',
                'ikon' => 'Target',
                'route' => null,
                'url' => null,
                'parent_id' => null,
                'urutan' => 6,
                'status_aktif' => true,
                'roles' => $ALL,
                'children' => [
                    [
                        'nama_menu' => 'Target Dealer',
                        'ikon' => 'Store',
                        'route' => 'target-dealer.index',
                        'url' => '/target-dealer',
                        'urutan' => 1,
                        'status_aktif' => true,
                        'roles' => $ALL,
                    ],
                ],
            ],
            [
                'nama_menu' => 'Pengaturan',
                'ikon' => 'Settings',
                'route' => null,
                'url' => null,
                'parent_id' => null,
                'urutan' => 7,
                'status_aktif' => true,
                'roles' => ['IT'],
                'children' => [
                    [
                        'nama_menu' => 'Menu Management',
                        'ikon' => 'ListTree',
                        'route' => 'settings.menus.index',
                        'url' => '/settings/menus',
                        'urutan' => 1,
                        'status_aktif' => true,
                        'roles' => ['IT'],
                    ],
                ],
            ],
        ];

        foreach ($menus as $menuData) {
            $children = $menuData['children'] ?? [];
            $roles = $menuData['roles'];
            unset($menuData['children'], $menuData['roles']);

            $parent = Menu::create($menuData);

            foreach ($roles as $role) {
                MenuRole::create(['menu_id' => $parent->id, 'role' => $role]);
            }

            foreach ($children as $childData) {
                $childRoles = $childData['roles'];
                unset($childData['roles']);
                $childData['parent_id'] = $parent->id;

                $child = Menu::create($childData);

                foreach ($childRoles as $role) {
                    MenuRole::create(['menu_id' => $child->id, 'role' => $role]);
                }
            }
        }
    }
}
