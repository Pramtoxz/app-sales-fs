<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class JumlahProspekController extends Controller
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

        $bulan  = (int) $request->query('bulan', date('n'));
        $tahun  = (int) $request->query('tahun', date('Y'));
        $dealer = $flp->kode_dealer;
        $idFlp  = $flp->id_flp;

        $jumlahProspek = DB::connection('pgsql_sales')
            ->table('H1_DOS.guestbook')
            ->where('fk_dealer', $dealer)
            ->whereRaw('EXTRACT(MONTH FROM "Tanggal") = ?', [$bulan])
            ->whereRaw('EXTRACT(YEAR FROM "Tanggal") = ?', [$tahun])
            ->count();

        $myProspek = DB::connection('pgsql_sales')
            ->table('H1_DOS.guestbook')
            ->where('id_flp', $idFlp)
            ->whereRaw('EXTRACT(MONTH FROM "Tanggal") = ?', [$bulan])
            ->whereRaw('EXTRACT(YEAR FROM "Tanggal") = ?', [$tahun])
            ->count();

        $dealDealer = DB::connection('pgsql_sales')
            ->table('H1_DOS.guestbook as gb')
            ->join('H1_DOS.spk as s', DB::raw('s."IDGuestBook"'), '=', DB::raw('gb."IDGuestBook"'))
            ->join('H1_DOS.salesorder as so', DB::raw('so."IDSPK"'), '=', DB::raw('s."IDSpk"'))
            ->where('gb.fk_dealer', $dealer)
            ->whereRaw('EXTRACT(MONTH FROM gb."Tanggal") = ?', [$bulan])
            ->whereRaw('EXTRACT(YEAR FROM gb."Tanggal") = ?', [$tahun])
            ->count();

        $dealFlp = DB::connection('pgsql_sales')
            ->table('H1_DOS.guestbook as gb')
            ->join('H1_DOS.spk as s', DB::raw('s."IDGuestBook"'), '=', DB::raw('gb."IDGuestBook"'))
            ->join('H1_DOS.salesorder as so', DB::raw('so."IDSPK"'), '=', DB::raw('s."IDSpk"'))
            ->where('gb.fk_dealer', $dealer)
            ->where('gb.id_flp', $idFlp)
            ->whereRaw('EXTRACT(MONTH FROM gb."Tanggal") = ?', [$bulan])
            ->whereRaw('EXTRACT(YEAR FROM gb."Tanggal") = ?', [$tahun])
            ->count();

        return response()->json([
            'success' => true,
            'data' => [
                'bulan'           => $bulan,
                'tahun'           => $tahun,
                'jumlah_prospek'  => $jumlahProspek,
                'my_prospek'      => $myProspek,
                'deal'            => $dealDealer,
                'deal_flp'        => $dealFlp,
            ],
        ]);
    }
}
