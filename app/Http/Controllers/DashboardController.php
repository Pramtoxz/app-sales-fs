<?php

namespace App\Http\Controllers;

use App\Models\DashboardWidget;
use App\Models\DashboardWidgetType;
use App\Models\DashboardDataSource;
use App\Models\DashboardTemplate;
use App\Models\Flp;
use App\Models\M_Dealer;
use App\Models\MTargetDealer;
use App\Models\TargetFlp;
use Carbon\Carbon;
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
        $widgets = DashboardWidget::where('user_id', $user->id)
            ->where('visible', true)
            ->with(['widgetType', 'dataSource'])
            ->orderBy('pos_y')
            ->orderBy('pos_x')
            ->get();

        if ($widgets->isEmpty()) {
            $widgets = $this->generateFromTemplate($user);
        }

        return Inertia::render('dashboard', [
            'widgets' => $widgets->map(fn ($w) => [
                'id' => $w->id,
                'widget_type' => $w->widgetType->key,
                'component' => $w->widgetType->component,
                'data_source' => $w->dataSource->key,
                'endpoint' => $w->dataSource->endpoint,
                'title' => $w->title,
                'config' => $w->config ?? [],
                'pos_x' => $w->pos_x,
                'pos_y' => $w->pos_y,
                'width' => $w->width,
                'height' => $w->height,
            ]),
            'isKacab' => $user->isKacab(),
            'isMd' => $user->isMd(),
            'isIt' => $user->isIt(),
        ]);
    }

    public function summary(Request $request)
    {
        $user = Auth::user();
        $kodeDealer = $this->resolveDealer($user, $request);
        $bulan = $request->input('bulan_tahun', Carbon::now()->format('Y-m'));
        $startOfMonth = Carbon::parse($bulan . '-01')->startOfMonth()->format('Y-m-d');
        $endOfMonth = Carbon::parse($bulan . '-01')->endOfMonth()->format('Y-m-d');

        $bulanYM = substr($bulan, 0, 7);

        $flpQuery = Flp::where('is_active', true);
        if ($kodeDealer) $flpQuery->where('kode_dealer', $kodeDealer);
        $totalFlp = $flpQuery->count();

        $targetQuery = DB::connection('pgsql_sales')->table('H1_DOS.tbl_target_flp')
            ->where('bulan_tahun', $bulanYM);
        if ($kodeDealer) $targetQuery->where('fk_dealer', $kodeDealer);
        $totalTarget = (int) $targetQuery->sum('target');

        $jualQuery = DB::connection('pgsql_sales')->table('H1_DOS.fakturpenjualan as fp')
            ->join('H1_DOS.salesorder as so', 'so.IDSO', '=', 'fp.IDSO')
            ->join('H1_DOS.spk', 'spk.IDSpk', '=', 'so.IDSPK')
            ->whereBetween('fp.TglPenjualan', [$startOfMonth, $endOfMonth]);
        if ($kodeDealer) $jualQuery->where('fp.fk_dealer', $kodeDealer);
        $totalTerjual = $jualQuery->count();

        $prospekQuery = DB::connection('pgsql_sales')->table('H1_DOS.guestbook')
            ->whereBetween('Tanggal', [$startOfMonth, $endOfMonth]);
        if ($kodeDealer) $prospekQuery->where('fk_dealer', $kodeDealer);
        $totalProspek = $prospekQuery->count();

        $dealerQuery = M_Dealer::query();
        if ($kodeDealer) $dealerQuery->where('kd_dealer_md', $kodeDealer);
        $totalDealer = $dealerQuery->count();

        return response()->json([
            'success' => true,
            'data' => [
                'total_flp' => $totalFlp,
                'total_target' => $totalTarget,
                'total_terjual' => $totalTerjual,
                'persentase' => $totalTarget > 0 ? round(($totalTerjual / $totalTarget) * 100, 2) : 0,
                'total_prospek' => $totalProspek,
                'total_dealer' => $totalDealer,
            ],
        ]);
    }

    public function flpPerformance(Request $request)
    {
        $user = Auth::user();
        $kodeDealer = $this->resolveDealer($user, $request);
        $bulanTahun = $request->input('bulan_tahun', Carbon::now()->format('Y-m'));
        $limit = (int) $request->input('limit', 10);

        $bulan = substr($bulanTahun, 5, 2);
        $tahun = substr($bulanTahun, 0, 4);
        $bulanYM = substr($bulanTahun, 0, 7);
        $startDate = sprintf('%s-%s-01', $tahun, $bulan);
        $endDate = Carbon::parse($startDate)->endOfMonth()->format('Y-m-d');

        $query = "
            WITH target_summary AS (
                SELECT ttf.id_flp, COALESCE(flp.nama, 'FLP ' || ttf.id_flp) as nama, flp.foto, SUM(ttf.target) as total_target
                FROM \"H1_DOS\".\"tbl_target_flp\" ttf
                LEFT JOIN \"public\".\"flp\" ON flp.id_flp = ttf.id_flp
                WHERE ttf.bulan_tahun = ?
                " . ($kodeDealer ? 'AND ttf.fk_dealer = ?' : '') . "
                GROUP BY ttf.id_flp, flp.nama, flp.foto
            ),
            actual_summary AS (
                SELECT spk.\"id_flp\", COUNT(*) as total_terjual
                FROM \"H1_DOS\".\"fakturpenjualan\" fp
                JOIN \"H1_DOS\".\"salesorder\" so ON so.\"IDSO\" = fp.\"IDSO\"
                JOIN \"H1_DOS\".\"spk\" ON spk.\"IDSpk\" = so.\"IDSPK\"
                WHERE fp.\"TglPenjualan\" BETWEEN ? AND ?
                " . ($kodeDealer ? 'AND fp.\"fk_dealer\" = ?' : '') . "
                AND spk.\"id_flp\" IS NOT NULL
                GROUP BY spk.\"id_flp\"
            )
            SELECT ts.id_flp, ts.nama, ts.foto, ts.total_target,
                   COALESCE(acs.total_terjual, 0) as total_terjual,
                   CASE WHEN ts.total_target > 0 THEN ROUND((COALESCE(acs.total_terjual, 0)::float / ts.total_target * 100)::numeric, 2) ELSE 0 END as persentase
            FROM target_summary ts
            LEFT JOIN actual_summary acs ON acs.id_flp = ts.id_flp
            WHERE ts.total_target > 0
            ORDER BY persentase DESC
            LIMIT ?
        ";

        $params = [$bulanYM];
        if ($kodeDealer) $params[] = $kodeDealer;
        $params[] = $startDate;
        $params[] = $endDate;
        if ($kodeDealer) $params[] = $kodeDealer;
        $params[] = $limit;

        $results = DB::connection('pgsql_sales')->select($query, $params);

        $data = array_map(fn ($r) => [
            'id_flp' => $r->id_flp,
            'nama' => $r->nama,
            'foto' => $r->foto ? url($r->foto) : null,
            'total_target' => (int) $r->total_target,
            'total_terjual' => (int) $r->total_terjual,
            'persentase' => (float) $r->persentase,
        ], $results);

        return response()->json(['success' => true, 'data' => $data]);
    }

    public function targetVsActual(Request $request)
    {
        $user = Auth::user();
        $kodeDealer = $this->resolveDealer($user, $request);
        $bulanTahun = $request->input('bulan_tahun', Carbon::now()->format('Y-m'));

        $bulanYM = substr($bulanTahun, 0, 7);
        $startDate = Carbon::parse($bulanTahun . '-01')->startOfMonth()->format('Y-m-d');
        $endDate = Carbon::parse($bulanTahun . '-01')->endOfMonth()->format('Y-m-d');

        $dealerQuery = M_Dealer::select('kd_dealer_md', 'nm_dealer');
        if ($kodeDealer) $dealerQuery->where('kd_dealer_md', $kodeDealer);
        $dealers = $dealerQuery->get();

        $targets = MTargetDealer::where('bulan_tahun', $bulanYM)
            ->get()
            ->groupBy('kode_dealer');

        $sales = DB::connection('pgsql_sales')->table('H1_DOS.fakturpenjualan as fp')
            ->join('H1_DOS.salesorder as so', 'so.IDSO', '=', 'fp.IDSO')
            ->join('H1_DOS.spk', 'spk.IDSpk', '=', 'so.IDSPK')
            ->whereBetween('fp.TglPenjualan', [$startDate, $endDate])
            ->select('fp.fk_dealer', DB::raw('COUNT(*) as total'))
            ->groupBy('fp.fk_dealer')
            ->get()
            ->keyBy('fk_dealer');

        $data = $dealers->map(fn ($d) => [
            'dealer' => $d->nm_dealer,
            'kode_dealer' => $d->kd_dealer_md,
            'target' => $targets->get($d->kd_dealer_md, collect())->sum('target'),
            'terjual' => (int) ($sales->get($d->kd_dealer_md)?->total ?? 0),
        ])->values();

        return response()->json(['success' => true, 'data' => $data]);
    }

    public function prospek(Request $request)
    {
        $user = Auth::user();
        $kodeDealer = $this->resolveDealer($user, $request);
        $bulanTahun = $request->input('bulan_tahun', Carbon::now()->format('Y-m'));

        $startDate = Carbon::parse($bulanTahun . '-01')->startOfMonth()->format('Y-m-d');
        $endDate = Carbon::parse($bulanTahun . '-01')->endOfMonth()->format('Y-m-d');

        $query = DB::connection('pgsql_sales')->table('H1_DOS.guestbook')
            ->whereBetween('Tanggal', [$startDate, $endDate]);
        if ($kodeDealer) $query->where('fk_dealer', $kodeDealer);

        $total = (clone $query)->count();
        $deal = (clone $query)->where('Status_guestbook', 't')->count();

        return response()->json([
            'success' => true,
            'data' => ['total' => $total, 'deal' => $deal, 'persentase' => $total > 0 ? round(($deal / $total) * 100, 2) : 0],
        ]);
    }

    public function stock(Request $request)
    {
        $user = Auth::user();
        $kodeDealer = $this->resolveDealer($user, $request);

        $query = 'SELECT mgm."DeskripsiType" as tipe, COUNT(*) AS jumlah
            FROM "H1_DOS"."stokunit" AS su
            JOIN "H1_DOS"."mastergroupsegmenmotor" AS mgm ON SUBSTRING(su.fk_item FROM 1 FOR 3) = mgm."KodeType"
            WHERE su.status_sale = \'RFS\'';
        $params = [];

        if ($kodeDealer) {
            $query .= ' AND su.fk_dealer = ?';
            $params[] = $kodeDealer;
        }

        $query .= ' GROUP BY mgm."DeskripsiType" ORDER BY jumlah DESC';

        $results = DB::connection('pgsql_sales')->select($query, $params);

        $data = array_map(fn ($r) => ['tipe' => $r->tipe, 'jumlah' => (int) $r->jumlah], $results);

        return response()->json(['success' => true, 'data' => $data]);
    }

    public function indent(Request $request)
    {
        $user = Auth::user();
        $kodeDealer = $this->resolveDealer($user, $request);

        $query = 'SELECT COALESCE(mgm."DeskripsiType", indent."Desc_Tipe") as tipe, COUNT(*) AS jumlah
            FROM "H1_DOS"."indent"
            LEFT JOIN "H1_DOS".mastergroupsegmenmotor mgm ON mgm."KodeType" = indent."Desc_Tipe"
            WHERE indent."status_indent" = 2 AND indent."Tgl_Antrian" IS NOT NULL';
        $params = [];

        if ($kodeDealer) {
            $query .= ' AND indent."fk_dealer" = ?';
            $params[] = $kodeDealer;
        }

        $query .= ' GROUP BY tipe ORDER BY jumlah DESC';

        $results = DB::connection('pgsql_sales')->select($query, $params);

        $data = array_map(fn ($r) => ['tipe' => $r->tipe, 'jumlah' => (int) $r->jumlah], $results);

        return response()->json(['success' => true, 'data' => $data]);
    }

    public function dealers(Request $request)
    {
        $user = Auth::user();
        $kodeDealer = $this->resolveDealer($user, $request);
        $limit = (int) $request->input('limit', 10);

        $query = M_Dealer::select('kd_dealer_md', 'nm_dealer');
        if ($kodeDealer) $query->where('kd_dealer_md', $kodeDealer);

        $dealers = $query->orderBy('nm_dealer')->limit($limit)->get();

        $data = $dealers->map(function ($d) {
            $flpCount = Flp::where('kode_dealer', $d->kd_dealer_md)->where('is_active', true)->count();
            return [
                'kode_dealer' => $d->kd_dealer_md,
                'nama_dealer' => $d->nm_dealer,
                'total_flp' => $flpCount,
            ];
        });

        return response()->json(['success' => true, 'data' => $data]);
    }

    public function dataSources()
    {
        $sources = DashboardDataSource::all();
        return response()->json(['success' => true, 'data' => $sources]);
    }

    public function widgetTypes()
    {
        $types = DashboardWidgetType::all();
        return response()->json(['success' => true, 'data' => $types]);
    }

    private function resolveDealer($user, Request $request): ?string
    {
        if ($user->isKacab()) {
            return $user->fk_dealer;
        }
        return $request->input('kode_dealer');
    }

    private function generateFromTemplate($user)
    {
        $roles = $user->getRoles();
        $role = $roles[0] ?? 'IT';

        $templates = DashboardTemplate::where('role', $role)
            ->with(['widgetType', 'dataSource'])
            ->orderBy('sort_order')
            ->get();

        foreach ($templates as $tpl) {
            DashboardWidget::create([
                'user_id' => $user->id,
                'widget_type_id' => $tpl->widget_type_id,
                'data_source_id' => $tpl->data_source_id,
                'title' => $tpl->title,
                'config' => $tpl->config,
                'pos_x' => $tpl->pos_x,
                'pos_y' => $tpl->pos_y,
                'width' => $tpl->width,
                'height' => $tpl->height,
                'visible' => true,
            ]);
        }

        return DashboardWidget::where('user_id', $user->id)
            ->where('visible', true)
            ->with(['widgetType', 'dataSource'])
            ->orderBy('pos_y')
            ->orderBy('pos_x')
            ->get();
    }
}
