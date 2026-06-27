<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TargetFlp;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class TargetSalesController extends Controller
{
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

        $startDate = $request->input('start_date', date('Y-m-01'));
        $endDate = $request->input('end_date', date('Y-m-d'));

        \Log::info('Target Sales Request', [
            'user_id' => $user->id,
            'flp_id' => $flp->id_flp,
            'dealer' => $flp->kode_dealer,
            'start_date' => $startDate,
            'end_date' => $endDate,
        ]);

        $targetData = TargetFlp::getTargetSalesComparison(
            $flp->kode_dealer,
            $flp->id_flp,
            $startDate,
            $endDate
        );

        \Log::info('Target Sales Result', [
            'count' => $targetData->count(),
            'data' => $targetData->toArray(),
        ]);

        $hasData = $targetData->filter(function($item) {
            return $item->total_target > 0 || $item->total_terjual > 0;
        })->isNotEmpty();

        if (!$hasData) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak ada data target maupun penjualan untuk periode ini',
            ], 404);
        }

        $sorted = $targetData->sortByDesc(function($item) {
            return $item->total_target;
        })->values();

        $totalTarget = 0;
        $totalTerjual = 0;

        $data = $sorted->filter(function($item) {
            return $item->total_target > 0 || $item->total_terjual > 0;
        })->map(function($item) use (&$totalTarget, &$totalTerjual) {
            $totalTarget += $item->total_target;
            $totalTerjual += $item->total_terjual;

            return [
                'series' => $item->series,
                'target' => $item->total_target,
                'terjual' => $item->total_terjual,
                'selisih' => $item->selisih,
                'tercapai' => $item->total_terjual >= $item->total_target,
            ];
        })->values();

        return response()->json([
            'success' => true,
            'data' => [
                'periode' => [
                    'start' => $startDate,
                    'end' => $endDate,
                ],
                'flp' => [
                    'id_flp' => $flp->id_flp,
                    'nama' => $flp->nama,
                ],
                'items' => $data,
                'summary' => [
                    'total_target' => $totalTarget,
                    'total_terjual' => $totalTerjual,
                    'total_selisih' => $totalTarget - $totalTerjual,
                    'persentase' => $totalTarget > 0 ? round(($totalTerjual / $totalTarget) * 100, 2) : 0,
                ],
            ],
        ]);
    }
}
