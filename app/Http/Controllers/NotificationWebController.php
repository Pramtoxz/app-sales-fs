<?php

namespace App\Http\Controllers;

use App\Models\Flp;
use App\Models\FlpDevice;
use App\Models\M_Dealer;
use App\Models\Notification;
use App\Services\FirebaseService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class NotificationWebController extends Controller
{
    public function index(): Response
    {
        $user = Auth::user();

        return Inertia::render('notifikasi/Index', [
            'isKacab' => $user->isKacab(),
            'isMd' => $user->isMd(),
            'isIt' => $user->isIt(),
            'fkDealer' => $user->fk_dealer,
        ]);
    }

    public function getSales(Request $request)
    {
        $user = Auth::user();
        $search = $request->input('search', '');

        $query = Flp::select('id_flp', 'nama', 'kode_dealer', 'is_active')
            ->where('is_active', true);

        if ($user->isKacab()) {
            $query->where('kode_dealer', $user->fk_dealer);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('id_flp', 'ilike', "%{$search}%")
                    ->orWhere('nama', 'ilike', "%{$search}%");
            });
        }

        $sales = $query->orderBy('nama')->limit(100)->get();

        return response()->json(['data' => $sales]);
    }

    public function send(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'message' => 'required|string|max:1000',
            'target' => 'required|in:all,specific',
            'id_flp' => 'required_if:target,specific|nullable|string',
        ]);

        $user = Auth::user();
        $title = $request->title;
        $message = $request->message;
        $target = $request->target;

        try {
            if ($target === 'all') {
                $query = Flp::where('is_active', true);

                if ($user->isKacab()) {
                    $query->where('kode_dealer', $user->fk_dealer);
                }

                $flpList = $query->get();
            } else {
                $flp = Flp::where('id_flp', $request->id_flp)->first();

                if (!$flp) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Sales tidak ditemukan',
                    ], 404);
                }

                if ($user->isKacab() && $flp->kode_dealer !== $user->fk_dealer) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Anda tidak memiliki akses ke sales ini',
                    ], 403);
                }

                $flpList = collect([$flp]);
            }

            if ($flpList->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak ada sales yang ditemukan',
                ], 404);
            }

            $firebase = new FirebaseService();
            $successCount = 0;
            $failCount = 0;
            $noDeviceCount = 0;

            foreach ($flpList as $flp) {
                $devices = FlpDevice::where('id_flp', $flp->id_flp)
                    ->whereNotNull('fcm_token')
                    ->where('fcm_token', '!=', '')
                    ->get();

                if ($devices->isEmpty()) {
                    $noDeviceCount++;
                    continue;
                }

                $userId = $devices->first()->user_id;

                Notification::create([
                    'user_id' => $userId,
                    'title' => $title,
                    'message' => $message,
                    'type' => 'broadcast',
                    'is_read' => false,
                ]);

                $tokens = $devices->pluck('fcm_token')->toArray();
                $result = $firebase->sendToMultipleDevices($tokens, $title, $message, ['type' => 'broadcast']);

                if ($result['success']) {
                    $successCount += $result['successful'];
                    $failCount += $result['failed'];
                } else {
                    $failCount += count($tokens);
                }
            }

            return response()->json([
                'success' => true,
                'message' => "Notifikasi terkirim ke {$successCount} device" .
                    ($failCount > 0 ? ", {$failCount} gagal" : '') .
                    ($noDeviceCount > 0 ? ", {$noDeviceCount} sales tanpa device" : ''),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengirim notifikasi: ' . $e->getMessage(),
            ], 500);
        }
    }
}
