<?php

namespace App\Console\Commands;

use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class SyncProspekDaily extends Command
{
    protected $signature = 'app:sync-prospek-daily {--date= : Tanggal spesifik (Y-m-d). Tanpa opsi = backfill seluruh bulan berjalan}';
    protected $description = 'Hitung & simpan ringkasan prospek harian ke table prospek_daily_summary';

    public function handle(): int
    {
        $this->cleanOldMonths();

        $dates = [];

        if ($this->option('date')) {
            $dates[] = $this->option('date');
        } else {
            $today = date('Y-m-d');
            $firstDay = date('Y-m-01');
            $cursor = $firstDay;

            while ($cursor <= $today) {
                $dates[] = $cursor;
                $cursor = date('Y-m-d', strtotime($cursor . ' +1 day'));
            }
        }

        $this->info("Sync prospek daily untuk " . count($dates) . " tanggal...");

        foreach ($dates as $date) {
            $this->line("  {$date}");
            $this->syncDealerLevel($date);
            $this->syncFlpLevel($date);
        }

        $this->info('Update summary bulanan...');
        $this->syncMonthlySummary();

        $this->info('Selesai.');
        return self::SUCCESS;
    }

    private function cleanOldMonths(): void
    {
        $currentMonth = date('Y-m-01');
        $deleted = DB::connection('pgsql')
            ->table('prospek_daily_summary')
            ->where('tanggal', '<', $currentMonth)
            ->delete();

        $deletedSummary = DB::connection('pgsql')
            ->table('prospek_daily_summary')
            ->whereNull('tanggal')
            ->where('updated_at', '<', $currentMonth)
            ->delete();

        $this->info("Hapus data lama: {$deleted} baris harian, {$deletedSummary} baris summary.");
    }

    private function syncDealerLevel(string $date): void
    {
        $prospek = DB::connection('pgsql_sales')
            ->table('H1_DOS.guestbook')
            ->select('fk_dealer', DB::raw('COUNT(*) as total'))
            ->whereRaw('"Tanggal"::date = ?', [$date])
            ->whereNotNull('fk_dealer')
            ->groupBy('fk_dealer')
            ->pluck('total', 'fk_dealer');

        $deal = DB::connection('pgsql_sales')
            ->table('H1_DOS.guestbook as gb')
            ->join('H1_DOS.spk as s', DB::raw('s."IDGuestBook"'), '=', DB::raw('gb."IDGuestBook"'))
            ->join('H1_DOS.salesorder as so', DB::raw('so."IDSPK"'), '=', DB::raw('s."IDSpk"'))
            ->select('gb.fk_dealer', DB::raw('COUNT(DISTINCT gb."IDGuestBook") as total'))
            ->whereRaw('gb."Tanggal"::date = ?', [$date])
            ->whereNotNull('gb.fk_dealer')
            ->groupBy('gb.fk_dealer')
            ->pluck('total', 'gb.fk_dealer');

        $allDealers = collect(array_unique(array_merge(
            $prospek->keys()->toArray(),
            $deal->keys()->toArray()
        )));

        foreach ($allDealers as $kdDealer) {
            DB::connection('pgsql')
                ->table('prospek_daily_summary')
                ->upsert(
                    [
                        'tanggal' => $date,
                        'kd_dealer' => $kdDealer,
                        'id_flp' => null,
                        'jml_prospek' => $prospek->get($kdDealer, 0),
                        'jml_deal' => $deal->get($kdDealer, 0),
                        'updated_at' => now(),
                    ],
                    ['tanggal', 'kd_dealer', 'id_flp'],
                    ['jml_prospek', 'jml_deal', 'updated_at']
                );
        }
    }

    private function syncFlpLevel(string $date): void
    {
        $prospek = DB::connection('pgsql_sales')
            ->table('H1_DOS.guestbook')
            ->select('id_flp', DB::raw('COUNT(*) as total'))
            ->whereRaw('"Tanggal"::date = ?', [$date])
            ->whereNotNull('id_flp')
            ->where('id_flp', '!=', '')
            ->groupBy('id_flp')
            ->pluck('total', 'id_flp');

        $deal = DB::connection('pgsql_sales')
            ->table('H1_DOS.guestbook as gb')
            ->join('H1_DOS.spk as s', DB::raw('s."IDGuestBook"'), '=', DB::raw('gb."IDGuestBook"'))
            ->join('H1_DOS.salesorder as so', DB::raw('so."IDSPK"'), '=', DB::raw('s."IDSpk"'))
            ->select('gb.id_flp', DB::raw('COUNT(DISTINCT gb."IDGuestBook") as total'))
            ->whereRaw('gb."Tanggal"::date = ?', [$date])
            ->whereNotNull('gb.id_flp')
            ->where('gb.id_flp', '!=', '')
            ->groupBy('gb.id_flp')
            ->pluck('total', 'gb.id_flp');

        $allFlps = collect(array_unique(array_merge(
            $prospek->keys()->toArray(),
            $deal->keys()->toArray()
        )));

        if ($allFlps->isEmpty()) return;

        $flpDealerMap = DB::connection('pgsql_sales')
            ->table('public.flp')
            ->whereIn('id_flp', $allFlps->toArray())
            ->pluck('kode_dealer', 'id_flp');

        foreach ($allFlps as $idFlp) {
            $kdDealer = $flpDealerMap->get($idFlp);
            if (!$kdDealer) continue;

            DB::connection('pgsql')
                ->table('prospek_daily_summary')
                ->upsert(
                    [
                        'tanggal' => $date,
                        'kd_dealer' => $kdDealer,
                        'id_flp' => $idFlp,
                        'jml_prospek' => $prospek->get($idFlp, 0),
                        'jml_deal' => $deal->get($idFlp, 0),
                        'updated_at' => now(),
                    ],
                    ['tanggal', 'kd_dealer', 'id_flp'],
                    ['jml_prospek', 'jml_deal', 'updated_at']
                );
        }
    }

    private function syncMonthlySummary(): void
    {
        $startOfMonth = date('Y-m-01');
        $endOfMonth = date('Y-m-t');

        DB::connection('pgsql')
            ->table('prospek_daily_summary')
            ->whereNull('tanggal')
            ->delete();

        $dealerSummary = DB::connection('pgsql')
            ->table('prospek_daily_summary')
            ->whereNotNull('tanggal')
            ->whereBetween('tanggal', [$startOfMonth, $endOfMonth])
            ->whereNull('id_flp')
            ->select('kd_dealer', DB::raw('SUM(jml_prospek) as total_prospek'), DB::raw('SUM(jml_deal) as total_deal'))
            ->groupBy('kd_dealer')
            ->get();

        $flpSummary = DB::connection('pgsql')
            ->table('prospek_daily_summary')
            ->whereNotNull('tanggal')
            ->whereBetween('tanggal', [$startOfMonth, $endOfMonth])
            ->whereNotNull('id_flp')
            ->select('kd_dealer', 'id_flp', DB::raw('SUM(jml_prospek) as total_prospek'), DB::raw('SUM(jml_deal) as total_deal'))
            ->groupBy('kd_dealer', 'id_flp')
            ->get();

        $rows = [];

        foreach ($dealerSummary as $row) {
            $rows[] = [
                'tanggal' => null,
                'kd_dealer' => $row->kd_dealer,
                'id_flp' => null,
                'jml_prospek' => $row->total_prospek,
                'jml_deal' => $row->total_deal,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        foreach ($flpSummary as $row) {
            $rows[] = [
                'tanggal' => null,
                'kd_dealer' => $row->kd_dealer,
                'id_flp' => $row->id_flp,
                'jml_prospek' => $row->total_prospek,
                'jml_deal' => $row->total_deal,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        if (!empty($rows)) {
            DB::connection('pgsql')
                ->table('prospek_daily_summary')
                ->insert($rows);
        }

        $this->info("  Summary: {$dealerSummary->count()} dealer, {$flpSummary->count()} FLP");
    }
}
