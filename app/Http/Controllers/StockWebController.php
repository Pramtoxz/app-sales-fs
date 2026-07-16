<?php

namespace App\Http\Controllers;

use App\Models\M_Dealer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class StockWebController extends Controller
{
    public function index(): Response
    {
        $user = Auth::user();

        $dealerQuery = M_Dealer::select('kd_dealer_md', 'nm_dealer');
        if ($user->isKacab()) {
            $dealerQuery->where('kd_dealer_md', $user->fk_dealer);
        }
        $dealers = $dealerQuery->orderBy('nm_dealer')->get();

        return Inertia::render('stock/Index', [
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

        $search = $request->input('search', '');
        $kodeDealer = $request->kode_dealer;

        $query = 'SELECT su.fk_item, mgm."DeskripsiType", mgm."Categori", w.warna, COUNT(*) AS jumlah
            FROM "H1_DOS"."stokunit" AS su
            JOIN "H1_DOS"."mastergroupsegmenmotor" AS mgm
              ON SUBSTRING(su.fk_item FROM 1 FOR 3) = mgm."KodeType"
            LEFT JOIN public.tblwarna AS w
              ON RIGHT(su.fk_item, 2) = w.kd_warna
            WHERE su.status_sale = \'RFS\'
              AND su.fk_dealer = ?';

        $params = [$kodeDealer];

        if ($search) {
            $query .= ' AND (su.fk_item LIKE ? OR mgm."DeskripsiType" ILIKE ? OR w.warna ILIKE ?)';
            $params[] = '%' . $search . '%';
            $params[] = '%' . $search . '%';
            $params[] = '%' . $search . '%';
        }

        $query .= ' GROUP BY su.fk_item, mgm."DeskripsiType", mgm."Categori", w.warna
            ORDER BY CASE mgm."Categori" WHEN \'CUB\' THEN 1 WHEN \'AT\' THEN 2 WHEN \'SPORT\' THEN 3 WHEN \'EV\' THEN 4 ELSE 5 END, mgm."DeskripsiType", su.fk_item, jumlah DESC';

        $results = DB::connection('pgsql_sales')->select($query, $params);

        $grouped = [];
        foreach ($results as $row) {
            $grouped[$row->DeskripsiType][] = [
                'kode_item' => $row->fk_item,
                'categori' => $row->Categori,
                'warna' => $row->warna,
                'jumlah' => (int) $row->jumlah,
            ];
        }

        $data = [];
        foreach ($grouped as $tipe => $items) {
            $totalJumlah = array_sum(array_column($items, 'jumlah'));
            $data[] = [
                'tipe' => $tipe,
                'categori' => $items[0]['categori'] ?? '',
                'total' => $totalJumlah,
                'items' => $items,
            ];
        }

        return response()->json(['success' => true, 'data' => $data]);
    }
}
