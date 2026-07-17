import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, BarChart3, Loader2, Plus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import type { ShowData, TargetItem } from './types';
import { SummaryCards } from './_components/SummaryCards';
import { FlpList } from './_components/FlpList';
import { SeriesDialog } from './_components/SeriesDialog';
import { TargetDialog } from './_components/TargetDialog';
import { DeleteDialog } from './_components/DeleteDialog';

export default function Show() {
    const { kodeDealer, nmDealer, seriesList, isKacab } = usePage()
        .props as unknown as {
        kodeDealer: string;
        nmDealer: string;
        seriesList: string[];
        isKacab: boolean;
    };

    const searchParams = new URLSearchParams(window.location.search);
    const initialBulan =
        searchParams.get('bulan_tahun') ||
        (() => {
            const now = new Date();
            return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        })();

    const [bulanTahun, setBulanTahun] = useState(initialBulan);
    const [showData, setShowData] = useState<ShowData | null>(null);
    const [loading, setLoading] = useState(false);

    const [seriesDialogOpen, setSeriesDialogOpen] = useState(false);
    const [targetDialogOpen, setTargetDialogOpen] = useState(false);
    const [targetDialogKey, setTargetDialogKey] = useState(0);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

    const [formFlp, setFormFlp] = useState('');
    const [formSeries, setFormSeries] = useState('');
    const [formTarget, setFormTarget] = useState('');

    const [availableSeries, setAvailableSeries] = useState<string[]>(seriesList);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Target Dealer', href: '/target-dealer' },
        { title: nmDealer, href: '#' },
    ];

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(
                `/target-dealer/${kodeDealer}/data?bulan_tahun=${encodeURIComponent(bulanTahun)}`,
            );
            const json = await res.json();
            setShowData(json);
        } catch {
            toast.error('Gagal memuat data');
        } finally {
            setLoading(false);
        }
    }, [kodeDealer, bulanTahun]);

    useEffect(() => {
        loadData();
    }, []);

    const loadSeries = async () => {
        try {
            const res = await fetch(
                `/target-dealer/${kodeDealer}/series?bulan_tahun=${encodeURIComponent(bulanTahun)}`,
            );
            const json = await res.json();
            setAvailableSeries(json);
        } catch {
            setAvailableSeries(seriesList);
        }
    };

    const openTambahTarget = async () => {
        setEditingId(null);
        setFormFlp('');
        setFormSeries('');
        setFormTarget('');
        setTargetDialogKey((k) => k + 1);
        await loadSeries();
        setTargetDialogOpen(true);
    };

    const openEditTarget = (item: TargetItem, idFlp: string) => {
        setEditingId(item.id);
        setFormFlp(idFlp);
        setFormSeries(item.series);
        setFormTarget(String(item.target));
        setTargetDialogKey((k) => k + 1);
        setTargetDialogOpen(true);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Target Dealer - ${nmDealer}`} />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center gap-3">
                    <Link href="/target-dealer">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-lg font-semibold">{nmDealer}</h1>
                        <p className="text-muted-foreground text-sm">{kodeDealer}</p>
                    </div>
                </div>

                <Card>
                    <CardContent className="space-y-4 pt-6">
                        <div className="flex flex-wrap items-end gap-3">
                            <div className="space-y-1">
                                <Label htmlFor="bulan-tahun" className="text-xs">
                                    Periode
                                </Label>
                                <Input
                                    id="bulan-tahun"
                                    type="month"
                                    value={bulanTahun}
                                    onChange={(e) => setBulanTahun(e.target.value)}
                                    className="w-40"
                                />
                            </div>
                            <Button onClick={loadData} disabled={loading} size="sm">
                                {loading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                                Tampilkan
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSeriesDialogOpen(true)}
                            >
                                <BarChart3 className="mr-1 h-4 w-4" />
                                Kuota Series
                            </Button>
                            {isKacab && (
                                <Button size="sm" onClick={openTambahTarget} className="ml-auto">
                                    <Plus className="mr-1 h-4 w-4" />
                                    Tambah Target FLP
                                </Button>
                            )}
                        </div>

                        {showData && <SummaryCards data={showData} />}

                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
                            </div>
                        ) : !showData || showData.data.length === 0 ? (
                            <div className="text-muted-foreground py-12 text-center">
                                Tidak ada FLP untuk dealer ini
                            </div>
                        ) : (
                            <FlpList
                                data={showData.data}
                                isKacab={isKacab}
                                onEdit={openEditTarget}
                                onDelete={(id) => setDeleteConfirm(id)}
                            />
                        )}
                    </CardContent>
                </Card>
            </div>

            {showData && (
                <SeriesDialog
                    open={seriesDialogOpen}
                    onOpenChange={setSeriesDialogOpen}
                    breakdown={showData.series_breakdown}
                />
            )}

            <TargetDialog
                key={targetDialogKey}
                open={targetDialogOpen}
                onOpenChange={setTargetDialogOpen}
                editingId={editingId}
                initialFlp={formFlp}
                initialSeries={formSeries}
                initialTarget={formTarget}
                bulanTahun={bulanTahun}
                kodeDealer={kodeDealer}
                flpList={showData?.data ?? []}
                seriesList={availableSeries}
                seriesBreakdown={showData?.series_breakdown ?? []}
                onSaved={loadData}
            />

            <DeleteDialog
                targetId={deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                onDeleted={loadData}
            />
        </AppLayout>
    );
}
