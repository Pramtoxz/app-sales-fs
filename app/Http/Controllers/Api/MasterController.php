<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class MasterController extends Controller
{
    public function sumberData(Request $request): JsonResponse
    {
        $data = DB::connection('pgsql_sales')
            ->table('Master_Schema.master_source_leads')
            ->select('id', 'deskripsi')
            ->orderBy('deskripsi')
            ->get();

        return response()->json(['success' => true, 'data' => $data]);
    }

    public function tipeKonsumen(Request $request): JsonResponse
    {
        $data = DB::connection('pgsql_sales')
            ->table('Master_Schema.SetupTipeCustomer')
            ->select('id_tipe', 'tipe_customer')
            ->distinct()
            ->orderBy('tipe_customer')
            ->get();

        return response()->json(['success' => true, 'data' => $data]);
    }

    public function rencanaPembayaran(Request $request): JsonResponse
    {
        $data = DB::connection('pgsql_sales')
            ->table('H1_DOS.setupjenispembayaran')
            ->select('IDJenisPembayaran as id', 'JenisPembayaran as deskripsi')
            ->whereIn('IDJenisPembayaran', [1, 2])
            ->orderBy('IDJenisPembayaran')
            ->get();

        return response()->json(['success' => true, 'data' => $data]);
    }

    public function tipeKendaraan(Request $request): JsonResponse
    {
        $user = $request->user();
        $flp = $user->flp;

        if (!$flp) {
            return response()->json(['success' => false, 'message' => 'User tidak terdaftar sebagai FLP'], 403);
        }

        $data = DB::connection('pgsql_sales')->select("
            SELECT DISTINCT
                mgm.\"KodeType\" as kode_type,
                mgm.\"DeskripsiType\" as nama_tipe,
                mgm.\"Categori\" as categori,
                CASE mgm.\"Categori\" WHEN 'CUB' THEN 1 WHEN 'AT' THEN 2 WHEN 'SPORT' THEN 3 WHEN 'EV' THEN 4 ELSE 5 END as sort_order
            FROM \"H1_DOS\".\"mastergroupsegmenmotor\" mgm
            JOIN \"H1_DOS\".\"stokunit\" su ON SUBSTRING(su.fk_item FROM 1 FOR 3) = mgm.\"KodeType\"
            WHERE su.fk_dealer = ?
              AND su.status_sale = 'RFS'
            ORDER BY sort_order, mgm.\"DeskripsiType\"
        ", [$flp->kode_dealer]);

        return response()->json(['success' => true, 'data' => $data]);
    }

    public function warnaKendaraan(Request $request): JsonResponse
    {
        $user = $request->user();
        $flp = $user->flp;

        if (!$flp) {
            return response()->json(['success' => false, 'message' => 'User tidak terdaftar sebagai FLP'], 403);
        }

        $kodeType = $request->query('kode_type');

        if ($kodeType) {
            $data = DB::connection('pgsql_sales')->select("
                SELECT DISTINCT w.kd_warna, w.warna
                FROM public.tblwarna w
                JOIN \"H1_DOS\".\"stokunit\" su ON RIGHT(su.fk_item, 2) = w.kd_warna
                WHERE su.fk_dealer = ?
                  AND su.status_sale = 'RFS'
                  AND SUBSTRING(su.fk_item FROM 1 FOR 3) = ?
                ORDER BY w.warna
            ", [$flp->kode_dealer, $kodeType]);
        } else {
            $data = DB::connection('pgsql_sales')->select("
                SELECT DISTINCT w.kd_warna, w.warna
                FROM public.tblwarna w
                JOIN \"H1_DOS\".\"stokunit\" su ON RIGHT(su.fk_item, 2) = w.kd_warna
                WHERE su.fk_dealer = ?
                  AND su.status_sale = 'RFS'
                ORDER BY w.warna
            ", [$flp->kode_dealer]);
        }

        return response()->json(['success' => true, 'data' => $data]);
    }

    public function janjiTemu(Request $request): JsonResponse
    {
        $user = $request->user();
        $flp = $user->flp;

        if (!$flp) {
            return response()->json(['success' => false, 'message' => 'User tidak terdaftar sebagai FLP'], 403);
        }

        $data = DB::connection('pgsql_sales')
            ->table('H1_DOS.listappointment')
            ->select(
                'IDListAppointment as id_janji_temu',
                'Tanggal as tanggal',
                'NamaCustomer as nama_customer',
                'NoHP as no_hp',
                'IDCustomer as id_customer',
                'NamaKaryawan as nama_karyawan'
            )
            ->where('fk_dealer', $flp->kode_dealer)
            ->whereNotIn('IDListAppointment', function ($query) {
                $query->select('IDListAppointment')
                    ->from('H1_DOS.guestbook')
                    ->whereNotNull('IDListAppointment')
                    ->where('IDListAppointment', '!=', '');
            })
            ->orderBy('Tanggal', 'asc')
            ->get();

        return response()->json(['success' => true, 'data' => $data]);
    }
}
