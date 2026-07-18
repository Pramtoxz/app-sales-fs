<?php

namespace App\Http\Controllers;

use App\Models\M_Dealer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class IndentWebController extends Controller
{
    public function index(): Response
    {
        $user = Auth::user();

        $dealerQuery = M_Dealer::select('kd_dealer_md', 'nm_dealer');
        if ($user->isKacab()) {
            $dealerQuery->where('kd_dealer_md', $user->fk_dealer);
        }
        $dealers = $dealerQuery->orderBy('nm_dealer')->get();

        return Inertia::render('indent/Index', [
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

        $query = '
            SELECT
                indent."Desc_Tipe",
                COALESCE(mgm."DeskripsiType", indent."Desc_Tipe")           AS "DeskripsiType",
                COALESCE(NULLIF(mgm."idx_category", \'\')::integer, 5)      AS "idx_category",
                COALESCE(NULLIF(TRIM(mgm."Categori"), \'\'), \'CBU\')        AS "Categori",
                indent."IDCustomer",
                mastercustomer."NamaCustomer",
                CASE
                    WHEN spk."NamaLeasing" IS NULL OR spk."NamaLeasing" = \'\' THEN \'CASH\'
                    ELSE spk."NamaLeasing"
                END AS "NamaLeasing",
                CONCAT(indent."Desc_Tipe", \'-\', indent."kode_warna_final") AS "kode_item",
                w.warna,
                indent."Tgl_Antrian",
                DATE_PART(\'day\', NOW() - indent."Tgl_Indent")::integer AS umur_indent,
                CASE WHEN DATE(indent."created_at") <> DATE(indent."Tgl_Antrian") THEN true ELSE false END AS is_revisi,
                CASE
                    WHEN indent."tgl_fulfill" IS NOT NULL
                     AND indent."no_rangka"   IS NOT NULL AND indent."no_rangka" <> \'\'
                     AND indent."no_mesin"    IS NOT NULL AND indent."no_mesin"  <> \'\'
                    THEN \'terpenuhi\'
                    ELSE \'antrian\'
                END AS status
            FROM "H1_DOS"."indent"
            LEFT JOIN "H1_DOS".spk              ON spk."IDSpk"       = indent."IDSpk"
            LEFT JOIN "H1_DOS".mastercustomer    ON mastercustomer."IDCustomer" = indent."IDCustomer"
            LEFT JOIN "H1_DOS".mastergroupsegmenmotor mgm ON mgm."KodeType" = indent."Desc_Tipe"
            LEFT JOIN public.tblwarna w          ON w.kd_warna = indent."kode_warna_final"
            WHERE indent."status_indent" = 2
              AND indent."fk_dealer"      = ?
              AND indent."Tgl_Antrian"     IS NOT NULL
            ORDER BY
                CASE mgm."Categori" WHEN \'CUB\' THEN 1 WHEN \'AT\' THEN 2 WHEN \'SPORT\' THEN 3 WHEN \'EV\' THEN 4 ELSE 5 END ASC,
                COALESCE(mgm."DeskripsiType", indent."Desc_Tipe") ASC,
                indent."Tgl_Antrian" ASC
        ';

        $results = DB::connection('pgsql_sales')->select($query, [$kodeDealer]);

        $grouped = [];
        foreach ($results as $row) {
            $key = $row->Desc_Tipe;

            if (!isset($grouped[$key])) {
                $grouped[$key] = [
                    'tipe' => $row->DeskripsiType . ' (' . $row->Desc_Tipe . ')',
                    'categori' => $row->Categori,
                    'idx_category' => $row->idx_category,
                    'items' => [],
                ];
            }

            $grouped[$key]['items'][] = [
                'antrian' => count($grouped[$key]['items']) + 1,
                'customer_id' => $row->IDCustomer,
                'customer_name' => $row->NamaCustomer,
                'leasing' => $row->NamaLeasing,
                'kode_item' => $row->kode_item,
                'warna' => $row->warna,
                'tgl_antrian' => $row->Tgl_Antrian ? \Carbon\Carbon::parse($row->Tgl_Antrian)->format('d-m-Y') : '-',
                'umur_indent' => (int) $row->umur_indent,
                'is_revisi' => $row->is_revisi,
                'status' => $row->status,
            ];
        }

        return response()->json(['success' => true, 'data' => array_values($grouped)]);
    }
}
