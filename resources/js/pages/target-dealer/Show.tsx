import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    BarChart3,
    ChevronDown,
    Edit,
    Loader2,
    Plus,
    Search,
    Trash2,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';

interface TargetItem {
    id: number;
    series: string;
    bulan_tahun: string;
    target: number;
    fk_dealer: string;
}

interface FlpData {
    id_flp: string;
    nama_flp: string;
    is_active: string;
    total_target: number;
    targets: TargetItem[];
}

interface SeriesBreakdown {
    series: string;
    target_dealer: number;
    terbagi: number;
    sisa: number;
}

interface ShowData {
    data: FlpData[];
    total_target_dealer: number;
    total_target_flp: number;
    sisa: number;
    series_list: string[];
    series_breakdown: SeriesBreakdown[];
}

const csrfToken = () =>
    document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';

export default function Show() {
    const { kodeDealer, nmDealer, seriesList, isKacab } = usePage()
        .props as unknown as {
        kodeDealer: string;
        nmDealer: string;
        seriesList: string[];
        isKacab: boolean;
        isMd: boolean;
        isIt: boolean;
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
    const [openFlps, setOpenFlps] = useState<Record<string, boolean>>({});
    const [seriesDialogOpen, setSeriesDialogOpen] = useState(false);
    const [targetDialogOpen, setTargetDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);

    const [formFlp, setFormFlp] = useState('');
    const [formSeries, setFormSeries] = useState('');
    const [formTarget, setFormTarget] = useState('');

    const [availableSeries, setAvailableSeries] = useState<string[]>(seriesList);
    const [flpSearch, setFlpSearch] = useState('');
    const [flpPage, setFlpPage] = useState(1);
    const FLP_PER_PAGE = 10;

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

    const toggleFlp = (id: string) => {
        setOpenFlps((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const getSisaColor = (sisa: number, target: number) => {
        if (sisa <= 0) return 'text-red-600';
        if (sisa < target * 0.2) return 'text-amber-600';
        return 'text-green-600';
    };

    const openTambahTarget = async () => {
        setEditingId(null);
        setFormFlp('');
        setFormSeries('');
        setFormTarget('');
        await loadSeries();
        setTargetDialogOpen(true);
    };

    const openEditTarget = (item: TargetItem, idFlp: string) => {
        setEditingId(item.id);
        setFormFlp(idFlp);
        setFormSeries(item.series);
        setFormTarget(String(item.target));
        setTargetDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formFlp) {
            toast.warning('Pilih FLP');
            return;
        }
        if (!formSeries) {
            toast.warning('Pilih series');
            return;
        }
        if (!formTarget || parseInt(formTarget) < 1) {
            toast.warning('Target harus lebih dari 0');
            return;
        }

        const seriesData = showData?.series_breakdown.find(
            (s) => s.series === formSeries,
        );

        let targetLama = 0;
        if (editingId && showData) {
            for (const flp of showData.data) {
                const found = flp.targets.find((t) => t.id === editingId);
                if (found) {
                    targetLama = found.target;
                    break;
                }
            }
        }

        if (seriesData) {
            const kuota = seriesData.sisa + targetLama;
            if (parseInt(formTarget) > kuota) {
                toast.error(
                    `Target ${formSeries} tidak boleh melebihi sisa kuota (${kuota.toLocaleString('id-ID')})`,
                );
                return;
            }
        }

        setSaving(true);
        try {
            const res = await fetch('/target-dealer/flp/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                },
                body: JSON.stringify({
                    id: editingId,
                    id_flp: formFlp,
                    series: formSeries,
                    bulan_tahun: bulanTahun,
                    target: parseInt(formTarget),
                    fk_dealer: kodeDealer,
                }),
            });
            const json = await res.json();
            if (json.success) {
                toast.success('Data berhasil disimpan');
                setTargetDialogOpen(false);
                loadData();
            } else {
                toast.error(json.message || 'Gagal menyimpan data');
            }
        } catch {
            toast.error('Gagal menyimpan data');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Hapus target ini?')) return;

        try {
            const res = await fetch(`/target-dealer/flp/${id}/delete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                },
            });
            const json = await res.json();
            if (json.success) {
                toast.success('Data berhasil dihapus');
                loadData();
            } else {
                toast.error('Gagal menghapus data');
            }
        } catch {
            toast.error('Gagal menghapus data');
        }
    };

    const getSeriesSisaInfo = () => {
        if (!formSeries || !showData) return null;
        const found = showData.series_breakdown.find(
            (s) => s.series === formSeries,
        );
        if (!found) return null;

        let targetLama = 0;
        if (editingId) {
            for (const flp of showData.data) {
                const t = flp.targets.find((t) => t.id === editingId);
                if (t) {
                    targetLama = t.target;
                    break;
                }
            }
        }

        const kuota = found.sisa + targetLama;
        return { ...found, kuota };
    };

    const seriesInfo = getSeriesSisaInfo();

    const filteredFlps = useMemo(() => {
        if (!showData) return [];
        let result = showData.data;
        if (flpSearch.trim()) {
            const q = flpSearch.toLowerCase();
            result = result.filter(
                (f) =>
                    f.nama_flp.toLowerCase().includes(q) ||
                    f.id_flp.toLowerCase().includes(q),
            );
        }
        result.sort((a, b) => b.total_target - a.total_target);
        return result;
    }, [showData, flpSearch]);

    const flpTotalPages = Math.max(1, Math.ceil(filteredFlps.length / FLP_PER_PAGE));
    const paginatedFlps = useMemo(() => {
        const start = (flpPage - 1) * FLP_PER_PAGE;
        return filteredFlps.slice(start, start + FLP_PER_PAGE);
    }, [filteredFlps, flpPage]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Target Dealer - ${nmDealer}`} />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Header */}
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
                        {/* Filter + Actions */}
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

                        {/* Summary */}
                        {showData && (
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                <Card>
                                    <CardContent className="flex items-center gap-3 pt-4">
                                        <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                                            <BarChart3 className="text-primary h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold">
                                                {showData.total_target_dealer.toLocaleString('id-ID')}
                                            </p>
                                            <p className="text-muted-foreground text-xs">Target Dealer</p>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="flex items-center gap-3 pt-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
                                            <BarChart3 className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold">
                                                {showData.total_target_flp.toLocaleString('id-ID')}
                                            </p>
                                            <p className="text-muted-foreground text-xs">Total ke FLP</p>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="flex items-center gap-3 pt-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50">
                                            <BarChart3 className="h-5 w-5 text-amber-600" />
                                        </div>
                                        <div>
                                            <p
                                                className={`text-2xl font-bold ${showData.sisa <= 0 ? 'text-red-600' : ''}`}
                                            >
                                                {showData.sisa.toLocaleString('id-ID')}
                                            </p>
                                            <p className="text-muted-foreground text-xs">Sisa</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* FLP Cards */}
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
                            </div>
                        ) : !showData || showData.data.length === 0 ? (
                            <div className="text-muted-foreground py-12 text-center">
                                Tidak ada FLP untuk dealer ini
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between gap-3">
                                    <div className="relative flex-1 max-w-xs">
                                        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                                        <Input
                                            placeholder="Cari nama / ID FLP..."
                                            value={flpSearch}
                                            onChange={(e) => {
                                                setFlpSearch(e.target.value);
                                                setFlpPage(1);
                                            }}
                                            className="pl-9 pr-8"
                                        />
                                        {flpSearch && (
                                            <button
                                                onClick={() => {
                                                    setFlpSearch('');
                                                    setFlpPage(1);
                                                }}
                                                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                    <span className="text-muted-foreground text-sm">
                                        {filteredFlps.length} FLP
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    {paginatedFlps.length === 0 ? (
                                        <div className="text-muted-foreground py-8 text-center text-sm">
                                            FLP tidak ditemukan
                                        </div>
                                    ) : (
                                        paginatedFlps.map((flp) => (
                                            <Collapsible
                                                key={flp.id_flp}
                                                open={openFlps[flp.id_flp]}
                                                onOpenChange={() => toggleFlp(flp.id_flp)}
                                            >
                                                <Card>
                                                    <CollapsibleTrigger asChild>
                                                        <div className="hover:bg-muted/50 flex cursor-pointer items-center justify-between px-4 py-3 transition-colors">
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-2 w-2 rounded-full bg-red-500" />
                                                                <div>
                                                                    <p className="text-sm font-semibold">
                                                                        {flp.nama_flp}{' '}
                                                                        <span className="text-muted-foreground font-normal">
                                                                            ({flp.id_flp})
                                                                        </span>
                                                                    </p>
                                                                    <div className="mt-0.5 flex items-center gap-2">
                                                                        <Badge
                                                                            variant={
                                                                                flp.is_active === 'Aktif'
                                                                                    ? 'default'
                                                                                    : 'secondary'
                                                                            }
                                                                            className="text-[10px]"
                                                                        >
                                                                            {flp.is_active}
                                                                        </Badge>
                                                                        <span className="text-muted-foreground text-xs">
                                                                            Target:{' '}
                                                                            <strong>
                                                                                {flp.total_target.toLocaleString('id-ID')}
                                                                            </strong>
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <ChevronDown
                                                                className={`text-muted-foreground h-4 w-4 transition-transform ${openFlps[flp.id_flp] ? 'rotate-180' : ''}`}
                                                            />
                                                        </div>
                                                    </CollapsibleTrigger>
                                                    <CollapsibleContent>
                                                        <div className="px-4 pb-3">
                                                            <Table>
                                                                <TableHeader>
                                                                    <TableRow>
                                                                        <TableHead className="w-12 text-center">No</TableHead>
                                                                        <TableHead>Series</TableHead>
                                                                        <TableHead>Periode</TableHead>
                                                                        <TableHead className="text-right">Target</TableHead>
                                                                        {isKacab && (
                                                                            <TableHead className="text-center">Aksi</TableHead>
                                                                        )}
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {flp.targets.length === 0 ? (
                                                                        <TableRow>
                                                                            <TableCell
                                                                                colSpan={isKacab ? 5 : 4}
                                                                                className="text-muted-foreground h-16 text-center text-xs italic"
                                                                            >
                                                                                Belum ada target
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    ) : (
                                                                        flp.targets.map((t, i) => (
                                                                            <TableRow key={t.id}>
                                                                                <TableCell className="text-center">{i + 1}</TableCell>
                                                                                <TableCell>{t.series}</TableCell>
                                                                                <TableCell>{t.bulan_tahun}</TableCell>
                                                                                <TableCell className="text-right font-medium">
                                                                                    {t.target?.toLocaleString('id-ID') ?? '-'}
                                                                                </TableCell>
                                                                                {isKacab && (
                                                                                    <TableCell className="text-center">
                                                                                        <div className="flex items-center justify-center gap-1">
                                                                                            <Button
                                                                                                variant="outline"
                                                                                                size="sm"
                                                                                                className="h-7 w-7 p-0"
                                                                                                onClick={() => openEditTarget(t, flp.id_flp)}
                                                                                            >
                                                                                                <Edit className="h-3 w-3" />
                                                                                            </Button>
                                                                                            <Button
                                                                                                variant="destructive"
                                                                                                size="sm"
                                                                                                className="h-7 w-7 p-0"
                                                                                                onClick={() => handleDelete(t.id)}
                                                                                            >
                                                                                                <Trash2 className="h-3 w-3" />
                                                                                            </Button>
                                                                                        </div>
                                                                                    </TableCell>
                                                                                )}
                                                                            </TableRow>
                                                                        ))
                                                                    )}
                                                                </TableBody>
                                                            </Table>
                                                        </div>
                                                    </CollapsibleContent>
                                                </Card>
                                            </Collapsible>
                                        ))
                                    )}
                                </div>

                                {flpTotalPages > 1 && (
                                    <div className="flex items-center justify-between">
                                        <p className="text-muted-foreground text-xs">
                                            Halaman {flpPage} dari {flpTotalPages}
                                        </p>
                                        <Pagination>
                                            <PaginationContent>
                                                <PaginationItem>
                                                    <PaginationPrevious
                                                        href="#"
                                                        className={flpPage <= 1 ? 'pointer-events-none opacity-50' : ''}
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            if (flpPage > 1) setFlpPage(flpPage - 1);
                                                        }}
                                                    />
                                                </PaginationItem>
                                                {Array.from({ length: flpTotalPages }, (_, i) => i + 1).map((p) => (
                                                    <PaginationItem key={p} className="hidden sm:inline-block">
                                                        <PaginationLink
                                                            href="#"
                                                            isActive={p === flpPage}
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                setFlpPage(p);
                                                            }}
                                                        >
                                                            {p}
                                                        </PaginationLink>
                                                    </PaginationItem>
                                                ))}
                                                <PaginationItem>
                                                    <PaginationNext
                                                        href="#"
                                                        className={flpPage >= flpTotalPages ? 'pointer-events-none opacity-50' : ''}
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            if (flpPage < flpTotalPages) setFlpPage(flpPage + 1);
                                                        }}
                                                    />
                                                </PaginationItem>
                                            </PaginationContent>
                                        </Pagination>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Dialog Kuota Series */}
            <Dialog open={seriesDialogOpen} onOpenChange={setSeriesDialogOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Kuota Target per Series</DialogTitle>
                    </DialogHeader>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Series</TableHead>
                                <TableHead className="text-center">Target Dealer</TableHead>
                                <TableHead className="text-center">Terbagi ke FLP</TableHead>
                                <TableHead className="text-center">Sisa</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {!showData || showData.series_breakdown.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-muted-foreground h-16 text-center">
                                        Tidak ada data
                                    </TableCell>
                                </TableRow>
                            ) : (
                                showData.series_breakdown.map((s) => (
                                    <TableRow key={s.series}>
                                        <TableCell className="font-semibold">{s.series}</TableCell>
                                        <TableCell className="text-center">
                                            {s.target_dealer.toLocaleString('id-ID')}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {s.terbagi.toLocaleString('id-ID')}
                                        </TableCell>
                                        <TableCell
                                            className={`text-center font-bold ${getSisaColor(s.sisa, s.target_dealer)}`}
                                        >
                                            {s.sisa.toLocaleString('id-ID')}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </DialogContent>
            </Dialog>

            {/* Dialog Tambah/Edit Target FLP */}
            <Dialog open={targetDialogOpen} onOpenChange={setTargetDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingId ? 'Edit Target FLP' : 'Tambah Target FLP'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <Label>
                                FLP <span className="text-red-500">*</span>
                            </Label>
                            <Select value={formFlp} onValueChange={setFormFlp} disabled={!!editingId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="-- Pilih FLP --" />
                                </SelectTrigger>
                                <SelectContent>
                                    {showData?.data.map((flp) => (
                                        <SelectItem key={flp.id_flp} value={flp.id_flp}>
                                            {flp.nama_flp} ({flp.id_flp})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label>
                                Series <span className="text-red-500">*</span>
                            </Label>
                            <Select value={formSeries} onValueChange={setFormSeries} disabled={!!editingId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="-- Pilih Series --" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableSeries.map((s) => (
                                        <SelectItem key={s} value={s}>
                                            {s}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {seriesInfo && (
                                <p
                                    className={`text-xs font-semibold ${getSisaColor(seriesInfo.kuota, seriesInfo.target_dealer)}`}
                                >
                                    Sisa kuota: {seriesInfo.kuota.toLocaleString('id-ID')} unit
                                </p>
                            )}
                        </div>
                        <div className="space-y-1">
                            <Label>Periode</Label>
                            <Input value={bulanTahun} readOnly className="bg-muted" />
                        </div>
                        <div className="space-y-1">
                            <Label>
                                Target <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                type="number"
                                min={1}
                                value={formTarget}
                                onChange={(e) => setFormTarget(e.target.value)}
                                placeholder="Jumlah target"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setTargetDialogOpen(false)}>
                            Batal
                        </Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                            Simpan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
