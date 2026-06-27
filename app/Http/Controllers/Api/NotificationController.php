<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\FlpDevice;
use App\Services\FirebaseService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class NotificationController extends Controller
{
    protected $firebaseService;

    public function __construct(FirebaseService $firebaseService)
    {
        $this->firebaseService = $firebaseService;
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $notifications = Notification::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return response()->json([
            'success' => true,
            'data' => $notifications->items(),
            'meta' => [
                'current_page' => $notifications->currentPage(),
                'last_page' => $notifications->lastPage(),
                'per_page' => $notifications->perPage(),
                'total' => $notifications->total(),
            ],
        ]);
    }

    public function unreadCount(Request $request): JsonResponse
    {
        $user = $request->user();

        $count = Notification::where('user_id', $user->id)
            ->where('is_read', false)
            ->count();

        return response()->json([
            'success' => true,
            'data' => ['count' => $count],
        ]);
    }

    public function markAsRead(Request $request): JsonResponse
    {
        $request->validate(['id' => 'required|integer']);

        $user = $request->user();

        $notification = Notification::where('id', $request->id)
            ->where('user_id', $user->id)
            ->first();

        if (!$notification) {
            return response()->json([
                'success' => false,
                'message' => 'Notifikasi tidak ditemukan',
            ], 404);
        }

        $notification->is_read = true;
        $notification->save();

        return response()->json([
            'success' => true,
            'message' => 'Notifikasi ditandai sudah dibaca',
        ]);
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        $user = $request->user();

        Notification::where('user_id', $user->id)
            ->where('is_read', false)
            ->update(['is_read' => true, 'updated_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'Semua notifikasi ditandai sudah dibaca',
        ]);
    }

    public function registerToken(Request $request): JsonResponse
    {
        $request->validate([
            'device_id' => 'nullable|string|max:255',
            'fcm_token' => 'required|string|max:500',
        ]);

        $user = $request->user();
        $flp = $user->flp;

        if (!$flp) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak terdaftar sebagai FLP',
            ], 403);
        }

        $query = FlpDevice::where('id_flp', $flp->id_flp);

        if ($request->device_id) {
            $query->where('device_id', $request->device_id);
        } else {
            $query->orderByDesc('last_active')->limit(1);
        }

        $device = $query->first();

        if (!$device) {
            return response()->json([
                'success' => false,
                'message' => 'Device tidak ditemukan',
            ], 404);
        }

        $device->update([
            'fcm_token' => $request->fcm_token,
            'last_active' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'FCM token berhasil didaftarkan',
        ]);
    }

    public static function sendToAllUsers(string $title, string $message, string $type = 'general', array $extraData = []): void
    {
        $firebase = new FirebaseService();

        $devices = FlpDevice::whereNotNull('fcm_token')
            ->where('fcm_token', '!=', '')
            ->get()
            ->groupBy('user_id');

        foreach ($devices as $userId => $userDevices) {
            Notification::create([
                'user_id' => $userId,
                'title' => $title,
                'message' => $message,
                'type' => $type,
                'is_read' => false,
            ]);

            $tokens = $userDevices->pluck('fcm_token')->toArray();
            $data = array_merge(['type' => $type], $extraData);

            $firebase->sendToMultipleDevices($tokens, $title, $message, $data);
        }
    }
}
