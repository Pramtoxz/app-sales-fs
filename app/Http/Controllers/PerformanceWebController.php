<?php

namespace App\Http\Controllers;

use App\Models\M_Dealer;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class PerformanceWebController extends Controller
{
    public function index(): Response
    {
        $user = Auth::user();

        $dealerQuery = M_Dealer::select('kd_dealer_md', 'nm_alias_dealer')
            ->where('jenis_dealer', 'like', '%H1%');
        if ($user->isKacab()) {
            $dealerQuery->where('kd_dealer_md', $user->fk_dealer);
        }
        $dealers = $dealerQuery->orderBy('nm_alias_dealer')->get();

        return Inertia::render('performance/Index', [
            'dealers' => $dealers,
            'isKacab' => $user->isKacab(),
        ]);
    }

    public function getData(Request $request)
    {
        $request->validate([
            'kode_dealer' => 'required|string',
        ]);

        $user = Auth::user();

        if ($user->isKacab() && $user->fk_dealer !== $request->kode_dealer) {
            return response()->json(['success' => false, 'message' => 'Akses ditolak'], 403);
        }

        $kodeDealer = $request->kode_dealer;
        $bulanTahun = $request->input('bulan_tahun', Carbon::now()->format('Y-m'));

        $bulan = substr($bulanTahun, 5, 2);
        $tahun = substr($bulanTahun, 0, 4);
        $startDate = sprintf('%s-%s-01', $tahun, $bulan);
        $endDate = Carbon::parse($startDate)->endOfMonth()->format('Y-m-d');

        $rankings = DB::connection('pgsql_sales')->select("
            WITH target_summary AS (
                SELECT
                    ttf.id_flp,
                    COALESCE(flp.nama, 'FLP ' || ttf.id_flp) as nama,
                    flp.foto,
                    SUM(ttf.target) as total_target
                FROM \"H1_DOS\".\"tbl_target_flp\" ttf
                LEFT JOIN \"public\".\"flp\" ON flp.id_flp = ttf.id_flp
                WHERE ttf.bulan_tahun = ?
                  AND ttf.fk_dealer = ?
                GROUP BY ttf.id_flp, flp.nama, flp.foto
            ),
            actual_summary AS (
                SELECT
                    spk.\"id_flp\",
                    COUNT(*) as total_terjual
                FROM \"H1_DOS\".\"fakturpenjualan\" fp
                JOIN \"H1_DOS\".\"salesorder\" so ON so.\"IDSO\" = fp.\"IDSO\"
                JOIN \"H1_DOS\".\"spk\" ON spk.\"IDSpk\" = so.\"IDSPK\"
                WHERE fp.\"TglPenjualan\" BETWEEN ? AND ?
                  AND fp.\"fk_dealer\" = ?
                  AND spk.\"id_flp\" IS NOT NULL
                GROUP BY spk.\"id_flp\"
            )
            SELECT
                ROW_NUMBER() OVER (ORDER BY
                    CASE
                        WHEN ts.total_target > 0 THEN (COALESCE(acs.total_terjual, 0)::float / ts.total_target * 100)
                        ELSE 0
                    END DESC
                ) as rank,
                ts.id_flp,
                ts.nama,
                ts.foto,
                ts.total_target,
                COALESCE(acs.total_terjual, 0) as total_terjual,
                CASE
                    WHEN ts.total_target > 0 THEN ROUND((COALESCE(acs.total_terjual, 0)::float / ts.total_target * 100)::numeric, 2)
                    ELSE 0
                END as persentase
            FROM target_summary ts
            LEFT JOIN actual_summary acs ON acs.id_flp = ts.id_flp
            WHERE ts.total_target > 0
            ORDER BY persentase DESC
        ", [$bulanTahun, $kodeDealer, $startDate, $endDate, $kodeDealer]);

        $leaderboard = [];
        foreach ($rankings as $rank) {
            $leaderboard[] = [
                'rank' => (int) $rank->rank,
                'id_flp' => $rank->id_flp,
                'nama' => $rank->nama,
                'foto' => $rank->foto ? Storage::disk('public')->url($rank->foto) : null,
                'total_target' => (int) $rank->total_target,
                'total_terjual' => (int) $rank->total_terjual,
                'persentase' => (float) $rank->persentase,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => $leaderboard,
            'periode' => [
                'bulan_tahun' => $bulanTahun,
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
        ]);
    }
}
