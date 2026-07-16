<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class IndentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $flp  = $user->flp;

        if (!$flp) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak terdaftar sebagai FLP',
            ], 403);
        }

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
                CASE WHEN spk.id_flp = ? THEN true ELSE false END AS is_mine,
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
                CASE mgm."Categori" WHEN 'CUB' THEN 1 WHEN 'AT' THEN 2 WHEN 'SPORT' THEN 3 WHEN 'EV' THEN 4 ELSE 5 END ASC,
                COALESCE(mgm."DeskripsiType", indent."Desc_Tipe") ASC,
                indent."Tgl_Antrian" ASC
        ';

        $results = DB::connection('pgsql_sales')->select($query, [$flp->id_flp, $flp->kode_dealer]);

        if (empty($results)) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak ada data indent aktif',
            ], 404);
        }

        $grouped = [];
        foreach ($results as $row) {
            $key   = $row->Desc_Tipe;
            $label = $row->DeskripsiType . ' (' . $row->Desc_Tipe . ')';

            if (!isset($grouped[$key])) {
                $grouped[$key] = [
                    'tipe'         => $label,
                    'categori'     => $row->Categori,
                    'idx_category' => $row->idx_category,
                    'items'        => [],
                ];
            }

            $grouped[$key]['items'][] = [
                'antrian'       => count($grouped[$key]['items']) + 1,
                'customer_id'   => $row->IDCustomer,
                'customer_name' => $row->NamaCustomer,
                'leasing'       => $row->NamaLeasing,
                'kode_item'     => $row->kode_item,
                'warna'         => $row->warna,
                'tgl_antrian'   => $row->Tgl_Antrian,
                'umur_indent'   => $row->umur_indent,
                'is_mine'       => $row->is_mine,
                'is_revisi'     => $row->is_revisi,
                'status'        => $row->status,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'dealer' => ['kode_dealer' => $flp->kode_dealer],
                'indent' => array_values($grouped),
            ],
        ]);
    }
}
