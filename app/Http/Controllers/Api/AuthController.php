<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Resources\UserResource;
use App\Http\Resources\FlpResource;
use App\Models\User;
use App\Models\FlpDevice;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Email atau password salah',
                'errors' => [
                    'email' => ['Email atau password salah'],
                ],
            ], 401);
        }

        $flp = $user->flp;

        if (!$flp) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak terdaftar sebagai FLP',
            ], 403);
        }

        $token = $user->createToken($request->device_id)->plainTextToken;

        FlpDevice::updateOrCreate(
            [
                'id_flp' => $flp->id_flp,
                'device_id' => $request->device_id,
            ],
            [
                'user_id' => $user->id,
                'device_name' => $request->device_name,
                'device_type' => $request->device_type,
                'fcm_token' => $request->fcm_token,
                'last_active' => now(),
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil',
            'data' => [
                'token' => $token,
                'user' => new UserResource($user),
                'flp' => new FlpResource($flp),
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logout berhasil',
        ]);
    }

    public function logoutAll(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->tokens()->delete();

        if ($user->flp) {
            FlpDevice::where('id_flp', $user->flp->id_flp)->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Logout dari semua device berhasil',
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        $flp = $user->flp;

        return response()->json([
            'success' => true,
            'data' => [
                'user' => new UserResource($user),
                'flp' => $flp ? new FlpResource($flp) : null,
            ],
        ]);
    }

    public function devices(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->flp) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak terdaftar sebagai FLP',
            ], 403);
        }

        $devices = FlpDevice::where('id_flp', $user->flp->id_flp)
            ->orderBy('last_active', 'desc')
            ->get()
            ->map(function ($device) {
                return [
                    'device_id' => $device->device_id,
                    'device_name' => $device->device_name,
                    'device_type' => $device->device_type,
                    'last_active' => $device->last_active?->format('Y-m-d H:i:s'),
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'devices' => $devices,
            ],
        ]);
    }

    public function biometricRegister(Request $request): JsonResponse
    {
        $request->validate([
            'device_id' => 'required|string',
        ]);

        $user = $request->user();
        $flp = $user->flp;

        if (!$flp) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak terdaftar sebagai FLP',
            ], 403);
        }

        $device = FlpDevice::where('id_flp', $flp->id_flp)
            ->where('device_id', $request->device_id)
            ->first();

        if (!$device) {
            return response()->json([
                'success' => false,
                'message' => 'Device tidak terdaftar. Login email terlebih dahulu.',
            ], 403);
        }

        $rawToken = bin2hex(random_bytes(32));

        $device->update([
            'biometric_token' => hash('sha256', $rawToken),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Sidik jari berhasil didaftarkan',
            'data' => [
                'biometric_token' => $rawToken,
            ],
        ]);
    }

    public function biometricLogin(Request $request): JsonResponse
    {
        $request->validate([
            'device_id'       => 'required|string',
            'biometric_token' => 'required|string',
        ]);

        $device = FlpDevice::where('device_id', $request->device_id)
            ->whereNotNull('biometric_token')
            ->first();

        if (!$device) {
            return response()->json([
                'success' => false,
                'message' => 'Device tidak terdaftar untuk login sidik jari',
            ], 401);
        }

        if (!hash_equals($device->biometric_token, hash('sha256', $request->biometric_token))) {
            return response()->json([
                'success' => false,
                'message' => 'Token sidik jari tidak valid',
            ], 401);
        }

        $user = User::find($device->user_id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak ditemukan',
            ], 401);
        }

        $flp = $user->flp;

        if (!$flp) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak terdaftar sebagai FLP',
            ], 403);
        }

        $token = $user->createToken($request->device_id)->plainTextToken;

        $device->update(['last_active' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'Login sidik jari berhasil',
            'data' => [
                'token' => $token,
                'user'  => new UserResource($user),
                'flp'   => new FlpResource($flp),
            ],
        ]);
    }

    public function biometricRevoke(Request $request): JsonResponse
    {
        $request->validate([
            'device_id' => 'required|string',
        ]);

        $user = $request->user();
        $flp = $user->flp;

        if (!$flp) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak terdaftar sebagai FLP',
            ], 403);
        }

        $device = FlpDevice::where('id_flp', $flp->id_flp)
            ->where('device_id', $request->device_id)
            ->first();

        if (!$device) {
            return response()->json([
                'success' => false,
                'message' => 'Device tidak ditemukan',
            ], 404);
        }

        $device->update(['biometric_token' => null]);

        return response()->json([
            'success' => true,
            'message' => 'Akses sidik jari berhasil dinonaktifkan',
        ]);
    }
}
