<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class TargetFlp extends Model
{
    protected $connection = 'pgsql_sales';
    protected $table = 'H1_DOS.tbl_target_flp';
    protected $primaryKey = 'id';
    public $timestamps = false;

    protected $fillable = [
        'fk_dealer',
        'series',
        'bulan_tahun',
        'id_flp',
        'target',
    ];

    public static function getTargetSalesComparison($fk_dealer, $id_flp = null, $start_date = null, $end_date = null)
    {
        if (!$start_date) {
            $start_date = date('Y-m-01');
        }
        if (!$end_date) {
            $end_date = date('Y-m-d');
        }

        $terjualSub = DB::connection('pgsql_sales')
            ->table('H1_DOS.stokunit as s')
            ->leftJoin('H1_DOS.mastergroupsegmenmotor as m', 's.fk_tipe', '=', DB::raw('m."KodeType"'))
            ->leftJoin('H1_DOS.fakturpenjualan as f', 's.no_so_dlr', '=', DB::raw('f."IDSO"'))
            ->select(
                's.id_sales_people',
                DB::raw('UPPER(m."Series") as series'),
                'f.fk_dealer',
                DB::raw('COUNT(*) as total_terjual')
            )
            ->where('f.fk_dealer', $fk_dealer)
            ->whereBetween(DB::raw('f."TglPenjualan"'), [$start_date, $end_date]);

        if ($id_flp) {
            $terjualSub->where('s.id_sales_people', $id_flp);
        }

        $terjualSub->groupBy('s.id_sales_people', DB::raw('UPPER(m."Series")'), 'f.fk_dealer');

        $terjualData = $terjualSub->get()->keyBy(function ($item) {
            return $item->id_sales_people . '|' . $item->series;
        });

        $targetQuery = DB::connection('pgsql_sales')
            ->table('H1_DOS.tbl_target_flp as t')
            ->join('public.flp as f', 't.id_flp', '=', 'f.id_flp')
            ->select([
                't.id',
                't.id_flp',
                'f.nama',
                't.series',
                't.bulan_tahun',
                DB::raw('SUM(t.target) as total_target'),
            ])
            ->where('t.fk_dealer', $fk_dealer)
            ->whereRaw("CASE WHEN position('/' in t.bulan_tahun) > 0 THEN TO_DATE(t.bulan_tahun, 'MM/DD/YYYY') ELSE t.bulan_tahun::date END >= ?", [$start_date])
            ->whereRaw("CASE WHEN position('/' in t.bulan_tahun) > 0 THEN TO_DATE(t.bulan_tahun, 'MM/DD/YYYY') ELSE t.bulan_tahun::date END <= ?", [$end_date]);

        if ($id_flp) {
            $targetQuery->where('t.id_flp', $id_flp);
        }

        $targetData = $targetQuery
            ->groupBy(['t.id', 't.id_flp', 'f.nama', 't.series', 't.bulan_tahun'])
            ->orderBy('t.bulan_tahun', 'desc')
            ->orderBy('t.id')
            ->orderByDesc('total_target')
            ->get();

        $targetKeys = [];
        foreach ($targetData as $target) {
            $key = $target->id_flp . '|' . strtoupper($target->series);
            $target->total_terjual = isset($terjualData[$key]) ? (int) $terjualData[$key]->total_terjual : 0;
            $target->selisih = $target->total_target - $target->total_terjual;
            $targetKeys[$key] = true;
        }

        foreach ($terjualData as $key => $terjual) {
            if (!isset($targetKeys[$key])) {
                $extra = (object) [
                    'id_flp' => $terjual->id_sales_people,
                    'nama' => null,
                    'series' => $terjual->series,
                    'bulan_tahun' => null,
                    'total_target' => 0,
                    'total_terjual' => (int) $terjual->total_terjual,
                    'selisih' => -(int) $terjual->total_terjual,
                ];
                $targetData->push($extra);
            }
        }

        return $targetData;
    }
}
