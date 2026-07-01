<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use Illuminate\Support\Collection;

class TargetDealerTemplateExport implements WithMultipleSheets
{
    public function sheets(): array
    {
        return [
            'Template' => new TargetDealerTemplateSheet(),
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
