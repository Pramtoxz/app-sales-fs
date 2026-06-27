<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class BannerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $today = now()->toDateString();

        $banners = DB::connection('pgsql_sales')
            ->table('public.banners')
            ->select('id', 'title', 'description', 'image_path', 'start_date', 'end_date', 'sort_order', 'created_at')
            ->where('is_active', true)
            ->where(function ($q) use ($today) {
                $q->whereNull('start_date')->orWhere('start_date', '<=', $today);
            })
            ->where(function ($q) use ($today) {
                $q->whereNull('end_date')->orWhere('end_date', '>=', $today);
            })
            ->orderBy('sort_order', 'asc')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($banner) {
                $banner->image_url = url($banner->image_path);
                return $banner;
            });

        return response()->json([
            'success' => true,
            'data' => $banners,
        ]);
    }

    public function show(Request $request): JsonResponse
    {
        $id = $request->query('id');

        if (!$id) {
            return response()->json([
                'success' => false,
                'message' => 'Parameter id diperlukan',
            ], 422);
        }

        $banner = DB::connection('pgsql_sales')
            ->table('public.banners')
            ->select('id', 'title', 'description', 'image_path', 'start_date', 'end_date', 'sort_order', 'is_active', 'created_at', 'updated_at')
            ->where('id', $id)
            ->first();

        if (!$banner) {
            return response()->json([
                'success' => false,
                'message' => 'Banner tidak ditemukan',
            ], 404);
        }

        $banner->image_url = url($banner->image_path);

        return response()->json([
            'success' => true,
            'data' => $banner,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'image' => 'required|image|mimes:jpeg,png,jpg,webp|max:2048',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'sort_order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        $publicPath = public_path('photos/banners');
        if (!file_exists($publicPath)) {
            mkdir($publicPath, 0755, true);
        }

        $file = $request->file('image');
        $filename = 'banner_' . time() . '_' . mt_rand(1000, 9999) . '.' . $file->getClientOriginalExtension();
        $file->move($publicPath, $filename);
        $imagePath = 'photos/banners/' . $filename;

        $id = DB::connection('pgsql_sales')->table('public.banners')->insertGetId([
            'title' => $request->title,
            'description' => $request->description,
            'image_path' => $imagePath,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'sort_order' => $request->input('sort_order', 0),
            'is_active' => $request->input('is_active', true),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $banner = DB::connection('pgsql_sales')
            ->table('public.banners')
            ->where('id', $id)
            ->first();

        $banner->image_url = url($banner->image_path);

        NotificationController::sendToAllUsers(
            'Promo Baru!',
            $request->title,
            'banner',
            ['banner_id' => (string) $id]
        );

        return response()->json([
            'success' => true,
            'message' => 'Banner berhasil ditambahkan',
            'data' => $banner,
        ], 201);
    }

    public function update(Request $request): JsonResponse
    {
        $request->validate([
            'id' => 'required|integer',
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string|max:1000',
            'image' => 'sometimes|image|mimes:jpeg,png,jpg,webp|max:2048',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'sort_order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        $banner = DB::connection('pgsql_sales')
            ->table('public.banners')
            ->where('id', $request->id)
            ->first();

        if (!$banner) {
            return response()->json([
                'success' => false,
                'message' => 'Banner tidak ditemukan',
            ], 404);
        }

        $data = [];
        if ($request->has('title')) $data['title'] = $request->title;
        if ($request->has('description')) $data['description'] = $request->description;
        if ($request->has('start_date')) $data['start_date'] = $request->start_date;
        if ($request->has('end_date')) $data['end_date'] = $request->end_date;
        if ($request->has('sort_order')) $data['sort_order'] = $request->sort_order;
        if ($request->has('is_active')) $data['is_active'] = $request->is_active;

        if ($request->hasFile('image')) {
            $publicPath = public_path('photos/banners');
            if (!file_exists($publicPath)) {
                mkdir($publicPath, 0755, true);
            }

            if ($banner->image_path && file_exists(public_path($banner->image_path))) {
                unlink(public_path($banner->image_path));
            }

            $file = $request->file('image');
            $filename = 'banner_' . time() . '_' . mt_rand(1000, 9999) . '.' . $file->getClientOriginalExtension();
            $file->move($publicPath, $filename);
            $data['image_path'] = 'photos/banners/' . $filename;
        }

        $data['updated_at'] = now();

        DB::connection('pgsql_sales')
            ->table('public.banners')
            ->where('id', $request->id)
            ->update($data);

        $updated = DB::connection('pgsql_sales')
            ->table('public.banners')
            ->where('id', $request->id)
            ->first();

        $updated->image_url = url($updated->image_path);

        return response()->json([
            'success' => true,
            'message' => 'Banner berhasil diupdate',
            'data' => $updated,
        ]);
    }
}
