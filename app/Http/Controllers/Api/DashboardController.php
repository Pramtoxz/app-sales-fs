<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DashboardService;
use App\Http\Resources\UserResource;
use App\Http\Resources\FlpResource;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    protected $dashboardService;

    public function __construct(DashboardService $dashboardService)
    {
        $this->dashboardService = $dashboardService;
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $flp = $user->flp;

        if (!$flp) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak terdaftar sebagai FLP',
            ], 403);
        }

        $dealerInfo = $this->dashboardService->getDealerInfo($flp->id_flp);

        if (!$dealerInfo) {
            return response()->json([
                'success' => false,
                'message' => 'Data dealer tidak ditemukan',
            ], 404);
        }

        $pencapaian = $this->dashboardService->getPencapaianBulanIni(
            $flp->id_flp,
            $dealerInfo['dealer_code'],
            $dealerInfo['kd_kota']
        );

        $summary = $this->dashboardService->getSummaryMetrics(
            $flp->id_flp,
            $dealerInfo['dealer_code']
        );

        return response()->json([
            'success' => true,
            'data' => [
                'user' => new UserResource($user),
                'flp' => new FlpResource($flp),
                'dealer' => $dealerInfo,
                'pencapaian' => $pencapaian,
                'summary' => $summary,
            ],
        ]);
    }
}
