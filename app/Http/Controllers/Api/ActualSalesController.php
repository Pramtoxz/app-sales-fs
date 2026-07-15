<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class ActualSalesController extends Controller
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

        $perPage = $request->query('per_page', 15);
        $bulan = $request->query('bulan', date('n'));
        $tahun = $request->query('tahun', date('Y'));

        $query = DB::connection('pgsql_sales')
            ->table('H1_DOS.fakturpenjualan as fp')
            ->select(
                'fp.IDFakturPenjualan',
                'fp.TglPenjualan',
                'fp.Tdpp',
                'fp.Tppn',
                'fp.Tbbn',
                'fp.Tamount',
                'fp.status',
                'so.IDSPK',
                'spk.IDCustomer',
                'mastercustomer.NamaCustomer',
                'mastercustomer.NoHp',
                'SpkDetail.fk_tipe',
                'SpkDetail.fk_warna',
                'SpkDetail.DescMotorMKT',
                'SpkDetail.DescWarnaMotor',
                'SpkDetail.harga_unit',
                'spk.IDJenisPembayaran',
                'setupjenispembayaran.JenisPembayaran'
            )
            ->join('H1_DOS.salesorder as so', 'so.IDSO', '=', 'fp.IDSO')
            ->join('H1_DOS.spk', 'spk.IDSpk', '=', 'so.IDSPK')
            ->leftJoin('H1_DOS.mastercustomer', 'mastercustomer.IDCustomer', '=', 'spk.IDCustomer')
            ->leftJoin('H1_DOS.SpkDetail', 'SpkDetail.IdSPK', '=', 'spk.IDSpk')
            ->leftJoin('H1_DOS.setupjenispembayaran', 'setupjenispembayaran.IDJenisPembayaran', '=', 'spk.IDJenisPembayaran')
            ->where('spk.id_flp', $flp->id_flp)
            ->whereRaw('EXTRACT(MONTH FROM fp."TglPenjualan") = ?', [$bulan])
            ->whereRaw('EXTRACT(YEAR FROM fp."TglPenjualan") = ?', [$tahun])
            ->orderBy('fp.TglPenjualan', 'desc');

        $sales = $query->paginate($perPage);

        $targetData = DB::connection('pgsql_sales')
            ->table('H1_DOS.tbl_target_flp')
            ->where('id_flp', $flp->id_flp)
            ->whereRaw("CASE WHEN position('/' in bulan_tahun) > 0 THEN TO_CHAR(TO_DATE(bulan_tahun, 'MM/DD/YYYY'), 'YYYY-MM') ELSE TO_CHAR(bulan_tahun::date, 'YYYY-MM') END = ?", [sprintf('%04d-%02d', $tahun, $bulan)])
            ->selectRaw('SUM(target) as total_target')
            ->first();

        $actualData = DB::connection('pgsql_sales')
            ->table('H1_DOS.fakturpenjualan as fp')
            ->join('H1_DOS.salesorder as so', 'so.IDSO', '=', 'fp.IDSO')
            ->join('H1_DOS.spk', 'spk.IDSpk', '=', 'so.IDSPK')
            ->where('spk.id_flp', $flp->id_flp)
            ->whereRaw('EXTRACT(MONTH FROM fp."TglPenjualan") = ?', [$bulan])
            ->whereRaw('EXTRACT(YEAR FROM fp."TglPenjualan") = ?', [$tahun])
            ->selectRaw('COUNT(*) as total_actual')
            ->first();

        $target = (int) ($targetData->total_target ?? 0);
        $actual = (int) $actualData->total_actual;
        $persentase = $target > 0 ? round(($actual / $target) * 100, 2) : 0;

        $summary = [
            'bulan' => (int) $bulan,
            'tahun' => (int) $tahun,
            'actual' => $actual,
        ];

        if ($target > 0) {
            $summary['target'] = $target;
            $summary['persentase'] = $persentase;
        }

        return response()->json([
            'success' => true,
            'data' => $sales->items(),
            'summary' => $summary,
            'meta' => [
                'current_page' => $sales->currentPage(),
                'last_page' => $sales->lastPage(),
                'per_page' => $sales->perPage(),
                'total' => $sales->total(),
            ],
        ]);
    }

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

        $id = $request->query('id');

        if (!$id) {
            return response()->json([
                'success' => false,
                'message' => 'Parameter id diperlukan',
            ], 422);
        }

        $sale = DB::connection('pgsql_sales')
            ->table('H1_DOS.fakturpenjualan as fp')
            ->select(
                'fp.IDFakturPenjualan',
                'fp.TglPenjualan',
                'fp.Tdpp',
                'fp.Tppn',
                'fp.Tbbn',
                'fp.Tamount',
                'fp.status',
                'so.IDSPK',
                'spk.IDCustomer',
                'mastercustomer.NamaCustomer',
                'mastercustomer.NoHp',
                'mastercustomer.Alamat',
                DB::raw("\"SpkDetail\".\"fk_tipe\" || '-' || \"SpkDetail\".\"fk_warna\" as tipe"),
                'mastergroupsegmenmotor.DeskripsiType as nama_tipe',
                'tblwarna.warna as nama_warna',
                'SpkDetail.harga_unit',
                'spk.IDJenisPembayaran',
                'setupjenispembayaran.JenisPembayaran',
                'spk.NamaLeasing',
                'spk.DP',
                'spk.Cicilan',
                'spk.Tenor'
            )
            ->join('H1_DOS.salesorder as so', 'so.IDSO', '=', 'fp.IDSO')
            ->join('H1_DOS.spk', 'spk.IDSpk', '=', 'so.IDSPK')
            ->leftJoin('H1_DOS.mastercustomer', 'mastercustomer.IDCustomer', '=', 'spk.IDCustomer')
            ->leftJoin('H1_DOS.SpkDetail', 'SpkDetail.IdSPK', '=', 'spk.IDSpk')
            ->leftJoin('H1_DOS.setupjenispembayaran', 'setupjenispembayaran.IDJenisPembayaran', '=', 'spk.IDJenisPembayaran')
            ->leftJoin('H1_DOS.mastergroupsegmenmotor', 'mastergroupsegmenmotor.KodeType', '=', 'SpkDetail.fk_tipe')
            ->leftJoin('public.tblwarna', 'tblwarna.kd_warna', '=', 'SpkDetail.fk_warna')
            ->where('fp.IDFakturPenjualan', $id)
            ->where('spk.id_flp', $flp->id_flp)
            ->first();

        if (!$sale) {
            return response()->json([
                'success' => false,
                'message' => 'Data penjualan tidak ditemukan',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $sale,
        ]);
    }
}
