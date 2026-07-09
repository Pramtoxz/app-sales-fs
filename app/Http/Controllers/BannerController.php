<?php

namespace App\Http\Controllers;

use App\Models\Banner;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class BannerController extends Controller
{
    public function index(): Response
    {
        $user = Auth::user();
        if (!$user->isIt() && !$user->isMd()) {
            abort(403);
        }

        $banners = Banner::orderBy('sort_order', 'asc')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($banner) {
                $banner->image_url = $banner->image_path ? Storage::disk('public')->url($banner->image_path) : null;
                return $banner;
            });

        return Inertia::render('banner/Index', [
            'banners' => $banners,
        ]);
    }

    public function store(Request $request)
    {
        $user = Auth::user();
        if (!$user->isIt() && !$user->isMd()) {
            abort(403);
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'image' => 'required|image|mimes:jpeg,png,jpg,webp|max:2048',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'sort_order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        try {
            $imagePath = null;
            if ($request->hasFile('image')) {
                $file = $request->file('image');
                $filename = 'banner_' . time() . '_' . mt_rand(1000, 9999) . '.' . $file->getClientOriginalExtension();
                $imagePath = $file->storeAs('photos/banners', $filename, 'public');
            }

            $banner = Banner::create([
                'title' => $request->title,
                'description' => $request->description,
                'image_path' => $imagePath,
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
                'sort_order' => $request->input('sort_order', 0),
                'is_active' => $request->boolean('is_active', true),
            ]);

            $banner->image_url = $banner->image_path ? Storage::disk('public')->url($banner->image_path) : null;

            return response()->json(['success' => true, 'banner' => $banner]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyimpan: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request, int $id)
    {
        $user = Auth::user();
        if (!$user->isIt() && !$user->isMd()) {
            abort(403);
        }

        $banner = Banner::find($id);
        if (!$banner) {
            return response()->json(['success' => false, 'message' => 'Banner tidak ditemukan'], 404);
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'sort_order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        try {
            $data = [
                'title' => $request->title,
                'description' => $request->description,
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
                'sort_order' => $request->input('sort_order', 0),
                'is_active' => $request->boolean('is_active', true),
            ];

            if ($request->hasFile('image')) {
                // Delete old image
                if ($banner->image_path && Storage::disk('public')->exists($banner->image_path)) {
                    Storage::disk('public')->delete($banner->image_path);
                }

                $file = $request->file('image');
                $filename = 'banner_' . time() . '_' . mt_rand(1000, 9999) . '.' . $file->getClientOriginalExtension();
                $data['image_path'] = $file->storeAs('photos/banners', $filename, 'public');
            }

            $banner->update($data);
            $banner->image_url = $banner->image_path ? Storage::disk('public')->url($banner->image_path) : null;

            return response()->json(['success' => true, 'banner' => $banner]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengupdate: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function destroy(int $id)
    {
        $user = Auth::user();
        if (!$user->isIt() && !$user->isMd()) {
            abort(403);
        }

        $banner = Banner::find($id);
        if (!$banner) {
            return response()->json(['success' => false, 'message' => 'Banner tidak ditemukan'], 404);
        }

        try {
            // Delete image file
            if ($banner->image_path && Storage::disk('public')->exists($banner->image_path)) {
                Storage::disk('public')->delete($banner->image_path);
            }

            $banner->delete();

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus: ' . $e->getMessage(),
            ], 500);
        }
    }
}
