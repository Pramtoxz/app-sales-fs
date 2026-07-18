<?php

namespace App\Http\Controllers;

use App\Models\Flp;
use App\Models\M_Dealer;
use App\Models\MTargetDealer;
use App\Models\TargetFlp;
use App\Support\BulanTahunHelper;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use App\Exports\TargetDealerExport;
use App\Exports\TargetDealerTemplateExport;
use App\Imports\TargetDealerImport;
use Maatwebsite\Excel\Facades\Excel;

class TargetController extends Controller
{
    public function index(): Response
    {
        $user = Auth::user();
        $isKacab = $user->isKacab();
        $isMd = $user->isMd();
        $isIt = $user->isIt();

        return Inertia::render('target-dealer/Index', [
            'isKacab' => $isKacab,
            'isMd' => $isMd,
            'isIt' => $isIt,
        ]);
    }

    public function show(string $kode_dealer): Response
    {
        $user = Auth::user();

        if ($user->isKacab() && $user->fk_dealer !== $kode_dealer) {
            abort(403);
        }

        $nmDealerRaw = M_Dealer::where('kd_dealer_md', $kode_dealer)
            ->value('nm_alias_dealer_2') ?? $kode_dealer;
        $nmDealer = $nmDealerRaw && strlen($nmDealerRaw) > 4 ? substr($nmDealerRaw, 4) : $nmDealerRaw;

        $seriesList = MTargetDealer::where('kode_dealer', $kode_dealer)
            ->where('bulan_tahun', Carbon::now()->format('Y-m'))
            ->pluck('series')
            ->filter()
            ->unique()
            ->values();

        return Inertia::render('target-dealer/Show', [
            'kodeDealer' => $kode_dealer,
            'nmDealer' => $nmDealer,
            'seriesList' => $seriesList,
            'isKacab' => $user->isKacab(),
            'isMd' => $user->isMd(),
            'isIt' => $user->isIt(),
        ]);
    }

    public function getData(Request $request)
    {
        try {
            $bulanTahun = $request->input('bulan_tahun', Carbon::now()->format('Y-m'));
            $user = Auth::user();

            $dealerQuery = M_Dealer::select('kd_dealer_md', 'nm_alias_dealer', 'nm_alias_dealer_2')
                ->where('jenis_dealer', 'like', '%H1%');
            if ($user->isKacab()) {
                $dealerQuery->where('kd_dealer_md', $user->fk_dealer);
            }
            $dealers = $dealerQuery->get();

            $kodeDealerList = $dealers->pluck('kd_dealer_md')->toArray();

            $targets = MTargetDealer::whereIn('kode_dealer', $kodeDealerList)
                ->where('bulan_tahun', $bulanTahun)
                ->get()
                ->groupBy('kode_dealer');

            $data = $dealers->map(function ($dealer) use ($targets) {
                $dealerTargets = $targets->get($dealer->kd_dealer_md, collect());
                $namaBersih = $dealer->nm_alias_dealer_2 && strlen($dealer->nm_alias_dealer_2) > 4
                    ? substr($dealer->nm_alias_dealer_2, 4)
                    : ($dealer->nm_alias_dealer_2 ?? $dealer->kd_dealer_md);
                return [
                    'kode_dealer' => $dealer->kd_dealer_md,
                    'nm_dealer' => $namaBersih,
                    'alias' => $dealer->nm_alias_dealer,
                    'total_target' => $dealerTargets->sum('target'),
                    'detail' => $dealerTargets->map(function ($t) {
                        return [
                            'series' => $t->series,
                            'bulan_tahun' => BulanTahunHelper::displayShort($t->bulan_tahun),
                            'target' => $t->target,
                        ];
                    })->values(),
                ];
            })->values();

            return response()->json(['data' => $data]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'message' => 'Terjadi kesalahan: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function getShowData(Request $request, string $kode_dealer)
    {
        try {
            $bulanTahun = $request->input('bulan_tahun', Carbon::now()->format('Y-m'));
            $user = Auth::user();

            if ($user->isKacab() && $user->fk_dealer !== $kode_dealer) {
                return response()->json(['data' => []]);
            }

            $flpList = Flp::where('kode_dealer', $kode_dealer)
                ->select('id_flp', 'nama', 'is_active')
                ->get();

            $idFlpList = $flpList->pluck('id_flp')->toArray();

            $targets = TargetFlp::whereIn('id_flp', $idFlpList)
                ->where('bulan_tahun', $bulanTahun)
                ->get()
                ->groupBy('id_flp');

            $targetDealer = MTargetDealer::where('kode_dealer', $kode_dealer)
                ->where('bulan_tahun', $bulanTahun)
                ->get();

            $totalTargetDealer = $targetDealer->sum('target');
            $totalTargetFlp = 0;

            $data = $flpList->map(function ($flp) use ($targets, &$totalTargetFlp) {
                $flpTargets = $targets->get($flp->id_flp, collect());
                $totalTargetFlp += $flpTargets->sum('target');
                return [
                    'id_flp' => $flp->id_flp,
                    'nama_flp' => $flp->nama ?? '-',
                    'is_active' => $flp->is_active ? 'Aktif' : 'Non-Aktif',
                    'total_target' => $flpTargets->sum('target'),
                    'targets' => $flpTargets->map(function ($item) {
                        return [
                            'id' => $item->id,
                            'series' => $item->series,
                            'bulan_tahun' => $item->bulan_tahun ? BulanTahunHelper::displayShort($item->bulan_tahun) : '-',
                            'target' => $item->target,
                            'fk_dealer' => $item->fk_dealer,
                        ];
                    })->values(),
                ];
            })->values();

            $allFlpTargets = $targets->flatten(1);
            $flpPerSeries = $allFlpTargets->groupBy('series')
                ->map(function ($g) {
                    return (int) $g->sum('target');
                });

            $seriesBreakdown = $targetDealer->map(function ($t) use ($flpPerSeries) {
                $terbagi = $flpPerSeries->get($t->series, 0);
                return [
                    'series' => $t->series,
                    'target_dealer' => (int) $t->target,
                    'terbagi' => $terbagi,
                    'sisa' => (int) $t->target - $terbagi,
                ];
            })->values();

            $seriesList = $targetDealer->pluck('series')->unique()->values();

            return response()->json([
                'data' => $data,
                'total_target_dealer' => $totalTargetDealer,
                'total_target_flp' => $totalTargetFlp,
                'sisa' => $totalTargetDealer - $totalTargetFlp,
                'series_list' => $seriesList,
                'series_breakdown' => $seriesBreakdown,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'message' => 'Terjadi kesalahan: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function getSeriesList(Request $request, string $kode_dealer)
    {
        $bulanTahun = $request->input('bulan_tahun', Carbon::now()->format('Y-m'));

        $series = MTargetDealer::where('kode_dealer', $kode_dealer)
            ->where('bulan_tahun', $bulanTahun)
            ->pluck('series')
            ->filter()
            ->unique()
            ->values();

        return response()->json($series);
    }

    public function uploadExcel(Request $request)
    {
        $user = Auth::user();
        if ($user->isKacab()) {
            abort(403);
        }

        $request->validate([
            'file' => 'required|mimes:xlsx,xls',
        ]);

        try {
            $import = new TargetDealerImport();
            Excel::import($import, $request->file('file'));
            $rows = $import->rows;
            $inserted = 0;
            $errors = [];

            foreach ($rows as $row) {
                if (empty($row['kode_dealer'])) continue;

                try {
                    $bt = BulanTahunHelper::normalize($row['bulan_tahun']);
                } catch (\Exception $e) {
                    $errors[] = "Dealer {$row['kode_dealer']}: format bulan_tahun tidak valid ({$row['bulan_tahun']})";
                    continue;
                }

                MTargetDealer::updateOrCreate(
                    [
                        'kode_dealer' => trim($row['kode_dealer']),
                        'series' => trim($row['series']),
                        'bulan_tahun' => $bt,
                    ],
                    [
                        'target' => $row['target'] ?? 0,
                    ]
                );

                $inserted++;
            }

            return response()->json([
                'success' => true,
                'message' => "{$inserted} data berhasil diimport",
                'errors' => $errors,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'message' => 'Gagal import: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function saveTargetFlp(Request $request)
    {
        $user = Auth::user();
        if (!$user->isKacab()) {
            abort(403);
        }

        $request->validate([
            'id_flp' => 'required|string',
            'series' => 'required|string',
            'bulan_tahun' => 'required|string',
            'target' => 'required|integer|min:1',
            'fk_dealer' => 'required|string',
        ]);

        try {
            $data = [
                'fk_dealer' => $request->fk_dealer,
                'id_flp' => $request->id_flp,
                'series' => $request->series,
                'bulan_tahun' => BulanTahunHelper::normalize($request->bulan_tahun),
                'target' => $request->target,
            ];

            if ($request->id) {
                TargetFlp::where('id', $request->id)->update($data);
            } else {
                TargetFlp::create($data);
            }

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function deleteTargetFlp(int $id)
    {
        $user = Auth::user();
        if (!$user->isKacab()) {
            abort(403);
        }

        try {
            TargetFlp::where('id', $id)->delete();
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function downloadTemplate()
    {
        $user = Auth::user();
        if ($user->isKacab()) {
            abort(403);
        }

        return Excel::download(new TargetDealerTemplateExport(), 'template_target_dealer.xlsx');
    }

    public function exportExcel(Request $request)
    {
        $user = Auth::user();
        if (!$user->isMd() && !$user->isIt()) {
            abort(403);
        }

        $bulanTahun = $request->input('bulan_tahun', Carbon::now()->format('Y-m'));
        $bulanTahunNorm = BulanTahunHelper::normalize($bulanTahun);

        $rows = DB::connection('pgsql_sales')
            ->table('H1_DOS.tbl_target_flp as t')
            ->leftJoin('public.flp as f', 't.id_flp', '=', 'f.id_flp')
            ->select([
                't.fk_dealer',
                't.id_flp',
                'f.nama as nama_flp',
                't.series',
                't.bulan_tahun',
                't.target',
            ])
            ->where('t.bulan_tahun', $bulanTahunNorm)
            ->orderBy('t.fk_dealer')
            ->orderBy('f.nama')
            ->orderBy('t.series')
            ->get()
            ->map(fn($r) => [
                $r->fk_dealer,
                $r->id_flp,
                $r->nama_flp ?? '-',
                $r->series,
                $r->bulan_tahun,
                (int) $r->target,
            ]);

        $filename = 'target_flp_' . $bulanTahunNorm . '.xlsx';

        return Excel::download(new TargetDealerExport($rows), $filename);
    }
}
