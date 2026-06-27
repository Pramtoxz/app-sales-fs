<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardService
{
    public function getDealerInfo($idFlp)
    {
        $flp = DB::connection('pgsql_sales')
            ->table('public.flp')
            ->where('id_flp', $idFlp)
            ->first();

        if (!$flp) {
            return null;
        }

        $dealer = DB::connection('pgsql_sales')
            ->table('H1_DOS.masterdealer')
            ->where('KodeDealer', $flp->kode_dealer)
            ->first();

        $tblDealer = DB::connection('pgsql_sales')
            ->table('public.tbldealer')
            ->where('kd_dealer_ahm', $flp->kode_dealer)
            ->selectRaw('LEFT(fk_kelurahan, 4) AS kd_kota')
            ->first();

        return [
            'dealer_code' => $flp->kode_dealer,
            'dealer_name' => $dealer->NamaDealer ?? 'Unknown',
            'kd_kota'     => $tblDealer->kd_kota ?? null,
        ];
    }

    public function getPencapaianBulanIni($idFlp, $dealerCode, $kdKota = null)
    {
        $today        = Carbon::today()->format('Y-m-d');
        $startOfMonth = Carbon::today()->startOfMonth()->format('Y-m-d');

        $target = DB::connection('pgsql_sales')
            ->table('H1_DOS.tbl_target_flp')
            ->where('id_flp', $idFlp)
            ->where('fk_dealer', $dealerCode)
            ->whereRaw("TO_DATE(bulan_tahun, 'MM/DD/YYYY') = TO_DATE(?, 'MM/DD/YYYY')", [
                sprintf('%02d/01/%d', Carbon::today()->month, Carbon::today()->year)
            ])
            ->sum('target');

        $baseQuery = DB::connection('pgsql_sales')
            ->table('H1_DOS.stokunit as s')
            ->join('H1_DOS.fakturpenjualan as f', 's.no_so_dlr', '=', 'f.IDSO')
            ->where('s.id_sales_people', $idFlp)
            ->where('f.fk_dealer', $dealerCode)
            ->whereBetween('f.TglPenjualan', [$startOfMonth, $today]);

        $terjual = (clone $baseQuery)->count();

        $area = (clone $baseQuery)
            ->selectRaw('
                COUNT(*) FILTER (WHERE s.kota = ?) AS in_area,
                COUNT(*) FILTER (WHERE s.kota <> ? OR s.kota IS NULL) AS out_area
            ', [$kdKota, $kdKota])
            ->first();

        $persentase = $target > 0 ? round(($terjual / $target) * 100, 2) : 0;

        return [
            'bulan'     => (int) Carbon::today()->month,
            'tahun'     => (int) Carbon::today()->year,
            'target'    => (int) $target,
            'terjual'   => $terjual,
            'in_area'   => $kdKota ? (int) $area->in_area  : null,
            'out_area'  => $kdKota ? (int) $area->out_area : null,
            'persentase'=> $persentase,
            'tercapai'  => $terjual >= $target && $target > 0,
        ];
    }

    public function getSummaryMetrics($idFlp, $dealerCode)
    {
        $totalSpk = DB::connection('pgsql_sales')
            ->table('H1_DOS.spk')
            ->where('id_flp', $idFlp)
            ->whereMonth('TglSPK', Carbon::today()->month)
            ->whereYear('TglSPK', Carbon::today()->year)
            ->count();

        $totalIndent = DB::connection('pgsql_sales')
            ->table('H1_DOS.indent')
            ->where('fk_dealer', $dealerCode)
            ->where('status_indent', 2)
            ->where('status_approval', 't')
            ->count();

        return [
            'total_spk' => $totalSpk,
            'total_indent' => $totalIndent,
        ];
    }
}
