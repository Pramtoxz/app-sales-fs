<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\M_Dealer;
use App\Models\ProspekDailySummary;
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

        $isCurrentMonth = $bulan == (int) date('n') && $tahun == (int) date('Y');

        $dealerRaw = M_Dealer::where('kd_dealer_md', $dealer)->first();
        $dealerNama = $dealerRaw?->nm_alias_dealer_2 && strlen($dealerRaw->nm_alias_dealer_2) > 4
            ? substr($dealerRaw->nm_alias_dealer_2, 4)
            : ($dealerRaw?->nm_alias_dealer_2 ?? $dealerRaw?->nm_alias_dealer ?? $dealer);

        if ($isCurrentMonth) {
            return $this->fromSummary($bulan, $tahun, $dealer, $idFlp, $dealerNama);
        }

        return $this->fromLiveQuery($bulan, $tahun, $dealer, $idFlp, $dealerNama);
    }

    private function fromSummary(int $bulan, int $tahun, string $dealer, string $idFlp, string $dealerNama): JsonResponse
    {
        $startDate = sprintf('%04d-%02d-01', $tahun, $bulan);
        $endDate = date('Y-m-t', strtotime($startDate));

        $summaryDealer = ProspekDailySummary::where('kd_dealer', $dealer)
            ->whereNull('id_flp')
            ->whereNull('tanggal')
            ->where('updated_at', '>=', $startDate)
            ->first();

        $summaryFlp = ProspekDailySummary::where('id_flp', $idFlp)
            ->whereNull('tanggal')
            ->where('updated_at', '>=', $startDate)
            ->first();

        $rincianDealer = ProspekDailySummary::where('kd_dealer', $dealer)
            ->whereNull('id_flp')
            ->whereNotNull('tanggal')
            ->whereBetween('tanggal', [$startDate, $endDate])
            ->orderBy('tanggal')
            ->pluck('jml_prospek', 'tanggal');

        $rincianDeal = ProspekDailySummary::where('kd_dealer', $dealer)
            ->whereNull('id_flp')
            ->whereNotNull('tanggal')
            ->whereBetween('tanggal', [$startDate, $endDate])
            ->orderBy('tanggal')
            ->pluck('jml_deal', 'tanggal');

        $rincianFlpProspek = ProspekDailySummary::where('id_flp', $idFlp)
            ->whereNotNull('tanggal')
            ->whereBetween('tanggal', [$startDate, $endDate])
            ->orderBy('tanggal')
            ->pluck('jml_prospek', 'tanggal');

        $rincianFlpDeal = ProspekDailySummary::where('id_flp', $idFlp)
            ->whereNotNull('tanggal')
            ->whereBetween('tanggal', [$startDate, $endDate])
            ->orderBy('tanggal')
            ->pluck('jml_deal', 'tanggal');

        $allDates = collect(array_unique(array_merge(
            $rincianDealer->keys()->toArray(),
            $rincianDeal->keys()->toArray(),
            $rincianFlpProspek->keys()->toArray(),
            $rincianFlpDeal->keys()->toArray()
        )))->sort()->values();

        $rincian = $allDates->map(fn($tgl) => [
            'tanggal'      => $tgl,
            'prospek'      => (int) $rincianDealer->get($tgl, 0),
            'deal'         => (int) $rincianDeal->get($tgl, 0),
            'prospek_flp'  => (int) $rincianFlpProspek->get($tgl, 0),
            'deal_flp'     => (int) $rincianFlpDeal->get($tgl, 0),
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'bulan'           => $bulan,
                'tahun'           => $tahun,
                'dealer'          => $dealer,
                'dealer_nama'     => $dealerNama,
                'jumlah_prospek'  => $summaryDealer ? (int) $summaryDealer->jml_prospek : 0,
                'my_prospek'      => $summaryFlp ? (int) $summaryFlp->jml_prospek : 0,
                'deal'            => $summaryDealer ? (int) $summaryDealer->jml_deal : 0,
                'deal_flp'        => $summaryFlp ? (int) $summaryFlp->jml_deal : 0,
                'rincian'         => $rincian,
            ],
        ]);
    }

    private function fromLiveQuery(int $bulan, int $tahun, string $dealer, string $idFlp, string $dealerNama): JsonResponse
    {
        // Count total prospek dealer from CRM leads (synced with web report logic)
        $jumlahProspek = DB::connection('pgsql_sales')
            ->table('HC3.master_kons_ve')
            ->join('HC3.crm_ve', 'crm_ve.id_kons', '=', 'master_kons_ve.id_kons_ve')
            ->join('HC3.crm_ve_log', 'crm_ve_log.id_kons', '=', 'crm_ve.id_kons')
            ->join('H1_DOS.guestbook', 'guestbook.IDGuestBook', '=', 'master_kons_ve.id_guestbook')
            ->where('crm_ve.assign_dealer_status', 't')
            ->where('guestbook.fk_dealer', $dealer)
            ->whereRaw('EXTRACT(MONTH FROM "guestbook"."Tanggal") = ?', [$bulan])
            ->whereRaw('EXTRACT(YEAR FROM "guestbook"."Tanggal") = ?', [$tahun])
            ->distinct()
            ->count('master_kons_ve.id_leads');

        // Count my prospek from CRM leads
        $myProspek = DB::connection('pgsql_sales')
            ->table('HC3.master_kons_ve')
            ->join('HC3.crm_ve', 'crm_ve.id_kons', '=', 'master_kons_ve.id_kons_ve')
            ->join('HC3.crm_ve_log', 'crm_ve_log.id_kons', '=', 'crm_ve.id_kons')
            ->join('H1_DOS.guestbook', 'guestbook.IDGuestBook', '=', 'master_kons_ve.id_guestbook')
            ->where('crm_ve.assign_dealer_status', 't')
            ->where('guestbook.id_flp', $idFlp)
            ->whereRaw('EXTRACT(MONTH FROM "guestbook"."Tanggal") = ?', [$bulan])
            ->whereRaw('EXTRACT(YEAR FROM "guestbook"."Tanggal") = ?', [$tahun])
            ->distinct()
            ->count('master_kons_ve.id_leads');

        // Count deal dealer from CRM leads with SPK
        $dealDealer = DB::connection('pgsql_sales')
            ->table('HC3.master_kons_ve')
            ->join('HC3.crm_ve', 'crm_ve.id_kons', '=', 'master_kons_ve.id_kons_ve')
            ->join('HC3.crm_ve_log', 'crm_ve_log.id_kons', '=', 'crm_ve.id_kons')
            ->join('H1_DOS.guestbook', 'guestbook.IDGuestBook', '=', 'master_kons_ve.id_guestbook')
            ->join('H1_DOS.spk as s', 's.IDGuestBook', '=', 'guestbook.IDGuestBook')
            ->join('H1_DOS.salesorder as so', 'so.IDSPK', '=', 's.IDSpk')
            ->where('crm_ve.assign_dealer_status', 't')
            ->where('guestbook.fk_dealer', $dealer)
            ->whereRaw('EXTRACT(MONTH FROM "guestbook"."Tanggal") = ?', [$bulan])
            ->whereRaw('EXTRACT(YEAR FROM "guestbook"."Tanggal") = ?', [$tahun])
            ->distinct()
            ->count('master_kons_ve.id_leads');

        // Count deal flp from CRM leads with SPK
        $dealFlp = DB::connection('pgsql_sales')
            ->table('HC3.master_kons_ve')
            ->join('HC3.crm_ve', 'crm_ve.id_kons', '=', 'master_kons_ve.id_kons_ve')
            ->join('HC3.crm_ve_log', 'crm_ve_log.id_kons', '=', 'crm_ve.id_kons')
            ->join('H1_DOS.guestbook', 'guestbook.IDGuestBook', '=', 'master_kons_ve.id_guestbook')
            ->join('H1_DOS.spk as s', 's.IDGuestBook', '=', 'guestbook.IDGuestBook')
            ->join('H1_DOS.salesorder as so', 'so.IDSPK', '=', 's.IDSpk')
            ->where('crm_ve.assign_dealer_status', 't')
            ->where('guestbook.fk_dealer', $dealer)
            ->where('guestbook.id_flp', $idFlp)
            ->whereRaw('EXTRACT(MONTH FROM "guestbook"."Tanggal") = ?', [$bulan])
            ->whereRaw('EXTRACT(YEAR FROM "guestbook"."Tanggal") = ?', [$tahun])
            ->distinct()
            ->count('master_kons_ve.id_leads');

        return response()->json([
            'success' => true,
            'data' => [
                'bulan'           => $bulan,
                'tahun'           => $tahun,
                'dealer'          => $dealer,
                'dealer_nama'     => $dealerNama,
                'jumlah_prospek'  => $jumlahProspek,
                'my_prospek'      => $myProspek,
                'deal'            => $dealDealer,
                'deal_flp'        => $dealFlp,
                'rincian'         => [],
            ],
        ]);
    }
}
