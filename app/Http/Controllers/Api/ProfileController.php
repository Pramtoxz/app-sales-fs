<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Http\Resources\FlpResource;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;

class ProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        $flp = $user->flp;

        if (!$flp) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak terdaftar sebagai FLP',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'user' => new UserResource($user),
                'flp' => new FlpResource($flp),
            ],
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $user = $request->user();
        $flp = $user->flp;

        if (!$flp) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak terdaftar sebagai FLP',
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'no_hp' => 'sometimes|string|max:20',
            'password' => 'sometimes|string|min:6|confirmed',
        ]);

        if (isset($validated['name'])) {
            $user->name = $validated['name'];
        }

        if (isset($validated['email'])) {
            $user->email = $validated['email'];
        }

        if (isset($validated['no_hp'])) {
            $user->no_hp = $validated['no_hp'];
        }

        if (isset($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Profil berhasil diupdate',
            'data' => [
                'user' => new UserResource($user),
            ],
        ]);
    }

    public function uploadPhoto(Request $request): JsonResponse
    {
        $user = $request->user();
        $flp = $user->flp;

        if (!$flp) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak terdaftar sebagai FLP',
            ], 403);
        }

        $request->validate([
            'photo' => 'required|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        if ($request->hasFile('photo')) {
            $publicPath = public_path('photos/flp');
            
            if (!file_exists($publicPath)) {
                mkdir($publicPath, 0755, true);
            }

            if ($flp->foto && file_exists(public_path($flp->foto))) {
                unlink(public_path($flp->foto));
            }

            $file = $request->file('photo');
            $filename = 'flp_' . $flp->id_flp . '_' . time() . '.' . $file->getClientOriginalExtension();
            $file->move($publicPath, $filename);
            
            $path = 'photos/flp/' . $filename;

            $flp->foto = $path;
            $flp->save();

            return response()->json([
                'success' => true,
                'message' => 'Foto profil berhasil diupload',
                'data' => [
                    'photo_url' => url($path),
                ],
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Tidak ada file yang diupload',
        ], 400);
    }
}
