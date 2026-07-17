export interface TargetItem {
    id: number;
    series: string;
    bulan_tahun: string;
    target: number;
    fk_dealer: string;
}

export interface FlpData {
    id_flp: string;
    nama_flp: string;
    is_active: string;
    total_target: number;
    targets: TargetItem[];
}

export interface SeriesBreakdown {
    series: string;
    target_dealer: number;
    terbagi: number;
    sisa: number;
}

export interface ShowData {
    data: FlpData[];
    total_target_dealer: number;
    total_target_flp: number;
    sisa: number;
    series_list: string[];
    series_breakdown: SeriesBreakdown[];
}

export const csrfToken = () =>
    document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';

export const getSisaColor = (sisa: number, target: number) => {
    if (sisa <= 0) return 'text-red-600';
    if (sisa < target * 0.2) return 'text-amber-600';
    return 'text-green-600';
};
