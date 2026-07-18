<?php

namespace App\Http\Controllers;

use App\Models\Flp;
use App\Models\M_Dealer;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $user = Auth::user();

        return Inertia::render('dashboard', [
            'isKacab' => $user->isKacab(),
            'isMd'    => $user->isMd(),
            'isIt'    => $user->isIt(),
            'fkDealer'=> $user->fk_dealer,
        ]);
    }

    public function getData(Request $request): JsonResponse
    {
        $user = Auth::user();
        $bulan = $request->input('bulan_tahun', Carbon::now()->format('Y-m'));
        $bulanYM = substr($bulan, 0, 7);
        $startOfMonth = Carbon::parse($bulan . '-01')->startOfMonth()->format('Y-m-d');
        $endOfMonth = Carbon::parse($bulan . '-01')->endOfMonth()->format('Y-m-d');

        if ($user->isKacab()) {
            return $this->kacabData($user, $bulanYM, $startOfMonth, $endOfMonth);
        }

        return $this->adminData($bulanYM, $startOfMonth, $endOfMonth);
    }

    private function adminData(string $bulanYM, string $startOfMonth, string $endDate): JsonResponse
    {
        $totalDealers = M_Dealer::where('jenis_dealer', 'like', '%H1%')->where('dealer_active', true)->count();

        $totalFlp = Flp::where('is_active', true)->count();

        $totalTarget = (int) DB::connection('pgsql_sales')
            ->table('H1_DOS.tbl_target_flp')
            ->where('bulan_tahun', $bulanYM)
            ->sum('target');

        $totalTerjual = DB::connection('pgsql_sales')
            ->table('H1_DOS.fakturpenjualan as fp')
            ->join('H1_DOS.salesorder as so', 'so.IDSO', '=', 'fp.IDSO')
            ->join('H1_DOS.spk', 'spk.IDSpk', '=', 'so.IDSPK')
            ->whereBetween('fp.TglPenjualan', [$startOfMonth, $endDate])
            ->count();

        $totalProspek = DB::connection('pgsql_sales')
            ->table('H1_DOS.guestbook')
            ->whereBetween('Tanggal', [$startOfMonth, $endDate])
            ->count();

        $dealProspek = DB::connection('pgsql_sales')
            ->table('H1_DOS.guestbook')
            ->whereBetween('Tanggal', [$startOfMonth, $endDate])
            ->where('Status_guestbook', 't')
            ->count();

        $dealerPerformance = M_Dealer::select('kd_dealer_md', 'nm_alias_dealer', 'nm_alias_dealer_2')
            ->where('jenis_dealer', 'like', '%H1%')
            ->where('dealer_active', true)
            ->get()
            ->map(function ($d) use ($bulanYM, $startOfMonth, $endDate) {
                $target = (int) DB::connection('pgsql_sales')
                    ->table('H1_DOS.tbl_target_flp')
                    ->where('bulan_tahun', $bulanYM)
                    ->where('fk_dealer', $d->kd_dealer_md)
                    ->sum('target');

                $terjual = DB::connection('pgsql_sales')
                    ->table('H1_DOS.fakturpenjualan as fp')
                    ->join('H1_DOS.salesorder as so', 'so.IDSO', '=', 'fp.IDSO')
                    ->join('H1_DOS.spk', 'spk.IDSpk', '=', 'so.IDSPK')
                    ->whereBetween('fp.TglPenjualan', [$startOfMonth, $endDate])
                    ->where('fp.fk_dealer', $d->kd_dealer_md)
                    ->count();

                $namaBersih = $d->nm_alias_dealer_2 && strlen($d->nm_alias_dealer_2) > 4
                    ? substr($d->nm_alias_dealer_2, 4)
                    : ($d->nm_alias_dealer_2 ?? $d->kd_dealer_md);

                return [
                    'dealer' => $namaBersih,
                    'kode_dealer' => $d->kd_dealer_md,
                    'alias' => $d->nm_alias_dealer,
                    'target' => $target,
                    'terjual' => $terjual,
                    'persentase' => $target > 0 ? round(($terjual / $target) * 100, 1) : 0,
                ];
            })
            ->sortByDesc('persentase')
            ->values();

        $topDealers = $dealerPerformance->take(5);

        return response()->json([
            'success' => true,
            'data' => [
                'stats' => [
                    'total_dealers'  => $totalDealers,
                    'total_flp'      => $totalFlp,
                    'total_target'   => $totalTarget,
                    'total_terjual'  => $totalTerjual,
                    'persentase'     => $totalTarget > 0 ? round(($totalTerjual / $totalTarget) * 100, 1) : 0,
                    'total_prospek'  => $totalProspek,
                    'deal_prospek'   => $dealProspek,
                ],
                'dealer_performance' => $dealerPerformance,
                'top_dealers'        => $topDealers,
            ],
        ]);
    }

    private function kacabData($user, string $bulanYM, string $startOfMonth, string $endDate): JsonResponse
    {
        $kodeDealer = $user->fk_dealer;
        $nmDealerRaw = M_Dealer::where('kd_dealer_md', $kodeDealer)->value('nm_alias_dealer_2') ?? $kodeDealer;
        $nmDealer = $nmDealerRaw && strlen($nmDealerRaw) > 4 ? substr($nmDealerRaw, 4) : $nmDealerRaw;

        $totalFlp = Flp::where('kode_dealer', $kodeDealer)->where('is_active', true)->count();

        $totalTarget = (int) DB::connection('pgsql_sales')
            ->table('H1_DOS.tbl_target_flp')
            ->where('bulan_tahun', $bulanYM)
            ->where('fk_dealer', $kodeDealer)
            ->sum('target');

        $totalTerjual = DB::connection('pgsql_sales')
            ->table('H1_DOS.fakturpenjualan as fp')
            ->join('H1_DOS.salesorder as so', 'so.IDSO', '=', 'fp.IDSO')
            ->join('H1_DOS.spk', 'spk.IDSpk', '=', 'so.IDSPK')
            ->whereBetween('fp.TglPenjualan', [$startOfMonth, $endDate])
            ->where('fp.fk_dealer', $kodeDealer)
            ->count();

        $totalProspek = DB::connection('pgsql_sales')
            ->table('H1_DOS.guestbook')
            ->whereBetween('Tanggal', [$startOfMonth, $endDate])
            ->where('fk_dealer', $kodeDealer)
            ->count();

        $dealProspek = DB::connection('pgsql_sales')
            ->table('H1_DOS.guestbook')
            ->whereBetween('Tanggal', [$startOfMonth, $endDate])
            ->where('fk_dealer', $kodeDealer)
            ->where('Status_guestbook', 't')
            ->count();

        $flpPerformance = DB::connection('pgsql_sales')
            ->select("
                WITH target_summary AS (
                    SELECT ttf.id_flp, COALESCE(flp.nama, 'FLP ' || ttf.id_flp) as nama, SUM(ttf.target) as total_target
                    FROM \"H1_DOS\".\"tbl_target_flp\" ttf
                    LEFT JOIN \"public\".\"flp\" ON flp.id_flp = ttf.id_flp
                    WHERE ttf.bulan_tahun = ? AND ttf.fk_dealer = ?
                    GROUP BY ttf.id_flp, flp.nama
                ),
                actual_summary AS (
                    SELECT spk.\"id_flp\", COUNT(*) as total_terjual
                    FROM \"H1_DOS\".\"fakturpenjualan\" fp
                    JOIN \"H1_DOS\".\"salesorder\" so ON so.\"IDSO\" = fp.\"IDSO\"
                    JOIN \"H1_DOS\".\"spk\" ON spk.\"IDSpk\" = so.\"IDSPK\"
                    WHERE fp.\"TglPenjualan\" BETWEEN ? AND ?
                    AND fp.\"fk_dealer\" = ?
                    AND spk.\"id_flp\" IS NOT NULL
                    GROUP BY spk.\"id_flp\"
                )
                SELECT ts.id_flp, ts.nama, ts.total_target,
                       COALESCE(acs.total_terjual, 0) as total_terjual,
                       CASE WHEN ts.total_target > 0 THEN ROUND((COALESCE(acs.total_terjual, 0)::float / ts.total_target * 100)::numeric, 1) ELSE 0 END as persentase
                FROM target_summary ts
                LEFT JOIN actual_summary acs ON acs.id_flp = ts.id_flp
                ORDER BY persentase DESC
            ", [$bulanYM, $kodeDealer, $startOfMonth, $endDate, $kodeDealer]);

        $stockData = DB::connection('pgsql_sales')
            ->select('
                SELECT mgm."KodeType" as kode_type, mgm."DeskripsiType" as tipe, mgm."Categori" as categori, COUNT(*) AS jumlah
                FROM "H1_DOS"."stokunit" AS su
                JOIN "H1_DOS"."mastergroupsegmenmotor" AS mgm ON SUBSTRING(su.fk_item FROM 1 FOR 3) = mgm."KodeType"
                WHERE su.status_sale = \'RFS\' AND su.fk_dealer = ?
                GROUP BY mgm."KodeType", mgm."DeskripsiType", mgm."Categori"
                ORDER BY CASE mgm."Categori" WHEN \'CUB\' THEN 1 WHEN \'AT\' THEN 2 WHEN \'SPORT\' THEN 3 WHEN \'EV\' THEN 4 ELSE 5 END, mgm."DeskripsiType"
            ', [$kodeDealer]);

        return response()->json([
            'success' => true,
            'data' => [
                'dealer_name'  => $nmDealer,
                'kode_dealer'  => $kodeDealer,
                'stats' => [
                    'total_flp'     => $totalFlp,
                    'total_target'  => $totalTarget,
                    'total_terjual' => $totalTerjual,
                    'persentase'    => $totalTarget > 0 ? round(($totalTerjual / $totalTarget) * 100, 1) : 0,
                    'total_prospek' => $totalProspek,
                    'deal_prospek'  => $dealProspek,
                ],
                'flp_performance' => $flpPerformance,
                'stock_data'      => $stockData,
            ],
        ]);
    }
}
