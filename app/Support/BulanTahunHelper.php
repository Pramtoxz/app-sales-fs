<?php

namespace App\Support;

use Carbon\Carbon;

class BulanTahunHelper
{
    /**
     * Normalisasi input bulan_tahun apapun formatnya ke YYYY-MM.
     *
     * Didukung:
     *   2026-07        → 2026-07
     *   2026-07-01     → 2026-07
     *   2026-7-1       → 2026-07
     *   07/01/2026     → 2026-07
     *   7/1/2026       → 2026-07
     *   01/07/2026     → 2026-07 (DD/MM/YYYY jika hari > 12)
     *   01-07-2026     → 2026-07
     *   Juli 2026      → 2026-07
     *   July 2026      → 2026-07
     *   202607         → 2026-07
     *
     * @throws \InvalidArgumentException jika format tidak dikenali
     */
    public static function normalize(string $input): string
    {
        $raw = trim($input);

        if ($raw === '') {
            throw new \InvalidArgumentException('bulan_tahun tidak boleh kosong');
        }

        // YYYY-MM (sudah benar)
        if (preg_match('/^\d{4}-\d{1,2}$/', $raw)) {
            return self::pad($raw);
        }

        // YYYY-MM-DD → ambil YYYY-MM saja
        if (preg_match('/^(\d{4})-(\d{1,2})-\d{1,2}$/', $raw, $m)) {
            return self::padYearMonth($m[1], $m[2]);
        }

        // YYYYMM (tanpa separator)
        if (preg_match('/^(\d{4})(\d{2})$/', $raw, $m)) {
            return $m[1] . '-' . $m[2];
        }

        // Separator "/" atau "-"
        $sep = str_contains($raw, '/') ? '/' : (str_contains($raw, '-') ? '-' : null);

        if ($sep) {
            $parts = explode($sep, $raw);

            if (count($parts) === 3) {
                $a = (int) $parts[0];
                $b = (int) $parts[1];
                $c = (int) $parts[2];

                // Bagian ke-3 pasti tahun jika 4 digit
                if (strlen($parts[2]) === 4) {
                    $year = $c;
                    // Heuristik: jika $a > 12 → $a pasti hari, $b bulan
                    //            jika $b > 12 → $b pasti hari, $a bulan
                    //            default: anggap MM/DD/YYYY
                    if ($a > 12) {
                        $month = $b;
                    } elseif ($b > 12) {
                        $month = $a;
                    } else {
                        // Default: MM/DD/YYYY (format US)
                        $month = $a;
                    }
                    return self::padYearMonth($year, $month);
                }

                // Bagian ke-1 pasti tahun jika 4 digit
                if (strlen($parts[0]) === 4) {
                    return self::padYearMonth($a, $b);
                }
            }
        }

        // Nama bulan: "Juli 2026", "July 2026", "Jan 2026", dll
        try {
            $dt = Carbon::parse($raw);
            return $dt->format('Y-m');
        } catch (\Exception $e) {
            // lanjut ke fallback
        }

        // Fallback: coba Carbon parse
        try {
            $dt = Carbon::createFromFormat('Y-m', $raw);
            return $dt->format('Y-m');
        } catch (\Exception $e) {
            // lanjut ke fallback
        }

        throw new \InvalidArgumentException("Format bulan_tahun tidak dikenali: {$raw}");
    }

    /**
     * Format YYYY-MM untuk display (contoh: "Juli 2026").
     */
    public static function display(string $bulanTahun, string $locale = 'id'): string
    {
        $ym = self::normalize($bulanTahun);
        $dt = Carbon::createFromFormat('Y-m', $ym);
        $dt->locale($locale);
        return $dt->translatedFormat('F Y');
    }

    /**
     * Format YYYY-MM untuk display pendek (contoh: "07/2026").
     */
    public static function displayShort(string $bulanTahun): string
    {
        $ym = self::normalize($bulanTahun);
        $dt = Carbon::createFromFormat('Y-m', $ym);
        return $dt->format('m/Y');
    }

    private static function pad(string $ym): string
    {
        [$y, $m] = explode('-', $ym);
        return self::padYearMonth((int) $y, (int) $m);
    }

    private static function padYearMonth(int $year, int $month): string
    {
        return sprintf('%04d-%02d', $year, $month);
    }
}
