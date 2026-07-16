<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class StockController extends Controller
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

        $search = $request->input('search');

        if ($search) {
            $query = "SELECT su.fk_item, mgm.\"DeskripsiType\", mgm.\"Categori\", w.warna, COUNT(*) AS jumlah
                FROM \"H1_DOS\".\"stokunit\" AS su
                JOIN \"H1_DOS\".\"mastergroupsegmenmotor\" AS mgm
                  ON SUBSTRING(su.fk_item FROM 1 FOR 3) = mgm.\"KodeType\"
                LEFT JOIN public.tblwarna AS w
                  ON RIGHT(su.fk_item, 2) = w.kd_warna
                WHERE su.status_sale = 'RFS'
                  AND (su.fk_item LIKE ? OR mgm.\"DeskripsiType\" ILIKE ? OR w.warna ILIKE ?)
                  AND su.fk_dealer = ?
                GROUP BY su.fk_item, mgm.\"DeskripsiType\", mgm.\"Categori\", w.warna
                ORDER BY CASE mgm.\"Categori\" WHEN 'CUB' THEN 1 WHEN 'AT' THEN 2 WHEN 'SPORT' THEN 3 WHEN 'EV' THEN 4 ELSE 5 END, mgm.\"DeskripsiType\", su.fk_item, jumlah DESC";

            $results = DB::connection('pgsql_sales')->select($query, ['%' . $search . '%', '%' . $search . '%', '%' . $search . '%', $flp->kode_dealer]);
        } else {
            $query = "SELECT su.fk_item, mgm.\"DeskripsiType\", mgm.\"Categori\", w.warna, COUNT(*) AS jumlah
                FROM \"H1_DOS\".\"stokunit\" AS su
                JOIN \"H1_DOS\".\"mastergroupsegmenmotor\" AS mgm
                  ON SUBSTRING(su.fk_item FROM 1 FOR 3) = mgm.\"KodeType\"
                LEFT JOIN public.tblwarna AS w
                  ON RIGHT(su.fk_item, 2) = w.kd_warna
                WHERE su.status_sale = 'RFS'
                  AND su.fk_dealer = ?
                GROUP BY su.fk_item, mgm.\"DeskripsiType\", mgm.\"Categori\", w.warna
                ORDER BY CASE mgm.\"Categori\" WHEN 'CUB' THEN 1 WHEN 'AT' THEN 2 WHEN 'SPORT' THEN 3 WHEN 'EV' THEN 4 ELSE 5 END, mgm.\"DeskripsiType\", su.fk_item, jumlah DESC";

            $results = DB::connection('pgsql_sales')->select($query, [$flp->kode_dealer]);
        }

        if (empty($results)) {
            return response()->json([
                'success' => false,
                'message' => $search ? 'Tidak ada data stok untuk pencarian: ' . $search : 'Tidak ada data stok',
            ], 404);
        }

        $grouped = [];
        foreach ($results as $row) {
            $kodeWarna = substr($row->fk_item, -2);
            $grouped[$row->DeskripsiType][] = [
                'kode_item' => $row->fk_item,
                'kode_warna' => $kodeWarna,
                'categori' => $row->Categori,
                'warna' => $row->warna,
                'jumlah' => $row->jumlah,
            ];
        }

        $data = [];
        foreach ($grouped as $tipe => $items) {
            $data[] = [
                'tipe' => $tipe,
                'categori' => $items[0]['categori'] ?? '',
                'items' => $items,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'search' => $search,
                'dealer' => [
                    'kode_dealer' => $flp->kode_dealer,
                ],
                'stock' => $data,
            ],
        ]);
    }
}
