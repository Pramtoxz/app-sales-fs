<?php

namespace App\Exports;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class TargetDealerTemplateExport implements WithMultipleSheets
{
    public function sheets(): array
    {
        return [
            'Template' => new TargetDealerTemplateSheet(),
            'Series' => new TargetDealerSeriesSheet(),
        ];
    }
}

class TargetDealerTemplateSheet implements FromCollection, WithHeadings
{
    public function collection()
    {
        return new Collection([
            ['kode_dealer' => '06732', 'series' => 'VARIO 125', 'bulan_tahun' => '2026-05', 'target' => 50],
            ['kode_dealer' => '06732', 'series' => 'BEAT', 'bulan_tahun' => '2026-05', 'target' => 30],
        ]);
    }

    public function headings(): array
    {
        return ['kode_dealer', 'series', 'bulan_tahun', 'target'];
    }
}

class TargetDealerSeriesSheet implements FromCollection, WithHeadings
{
    public function collection()
    {
        return DB::connection('pgsql_sales')
            ->table('H1_DOS.mastergroupsegmenmotor')
            ->select('Series', 'Categori')
            ->whereNotNull('Series')
            ->where('Series', '!=', '')
            ->groupBy('Series', 'Categori')
            ->orderByRaw("CASE \"Categori\" WHEN 'CUB' THEN 1 WHEN 'AT' THEN 2 WHEN 'SPORT' THEN 3 WHEN 'EV' THEN 4 ELSE 5 END")
            ->orderBy('Series')
            ->get()
            ->map(fn($r) => [
                'series' => $r->Series,
                'kategori' => $r->Categori,
            ]);
    }

    public function headings(): array
    {
        return ['series', 'kategori'];
    }
}
