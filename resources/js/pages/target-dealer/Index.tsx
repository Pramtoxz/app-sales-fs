import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { Download, FileSpreadsheet, Loader2, Search, Upload, Users, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Target Dealer', href: '/target-dealer' },
];

interface DealerData {
    kode_dealer: string;
    alias: string;
    nm_dealer: string;
    total_target: number;
    detail: { series: string; bulan_tahun: string; target: number }[];
}

const PER_PAGE = 10;

export default function Index() {
    const { isKacab, isMd, isIt } = usePage().props as unknown as {
        isKacab: boolean;
        isMd: boolean;
        isIt: boolean;
    };

    const [bulanTahun, setBulanTahun] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    const [dealers, setDealers] = useState<DealerData[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [fileName, setFileName] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const fileRef = useRef<HTMLInputElement>(null);

    const canUpload = isMd || isIt;

    const filteredDealers = useMemo(() => {
        let result = [...dealers];

        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(
                (d) =>
                    d.kode_dealer.toLowerCase().includes(q) ||
                    d.alias.toLowerCase().includes(q) ||
                    d.nm_dealer.toLowerCase().includes(q),
            );
        }

        result.sort((a, b) => b.total_target - a.total_target);
        return result;
    }, [dealers, search]);

    const totalPages = Math.max(1, Math.ceil(filteredDealers.length / PER_PAGE));
    const paginatedDealers = useMemo(() => {
        const start = (page - 1) * PER_PAGE;
        return filteredDealers.slice(start, start + PER_PAGE);
    }, [filteredDealers, page]);

    const loadData = useCallback(async () => {
        setLoading(true);
        setPage(1);
        try {
            const res = await fetch(`/target-dealer/data?bulan_tahun=${encodeURIComponent(bulanTahun)}`);
            const json = await res.json();
            setDealers(json.data ?? []);
        } catch {
            toast.error('Gagal memuat data dealer');
        } finally {
            setLoading(false);
        }
    }, [bulanTahun]);

    useEffect(() => {
        loadData();
    }, []);

    const handleUpload = async () => {
        const file = fileRef.current?.files?.[0];
        if (!file) {
            toast.warning('Pilih file Excel terlebih dahulu');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        try {
            const res = await fetch('/target-dealer/upload', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '',
                },
            });
            const data = await res.json();
            let msg = data.message;
            if (data.errors?.length) {
                msg += ` (${data.errors.length} baris gagal)`;
            }
            toast.success(msg);
            if (fileRef.current) fileRef.current.value = '';
            setFileName('');
            loadData();
        } catch {
            toast.error('Gagal upload');
        } finally {
            setUploading(false);
        }
    };

    const handleDownloadTemplate = () => {
        window.location.href = '/target-dealer/template';
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            window.location.href = `/target-dealer/export?bulan_tahun=${encodeURIComponent(bulanTahun)}`;
        } finally {
            setTimeout(() => setExporting(false), 2000);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Target Dealer" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Target Dealer</CardTitle>
                            <span className="text-muted-foreground text-sm">
                                {filteredDealers.length} dealer
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Filter */}
                        <div className="flex items-end gap-3">
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
                            {!isKacab && (
                                <div className="relative ml-auto flex-1 max-w-xs">
                                    <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                                    <Input
                                        placeholder="Cari kode / nama dealer..."
                                        value={search}
                                        onChange={(e) => {
                                            setSearch(e.target.value);
                                            setPage(1);
                                        }}
                                        className="pl-9 pr-8"
                                    />
                                    {search && (
                                        <button
                                            onClick={() => {
                                                setSearch('');
                                                setPage(1);
                                            }}
                                            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Upload Excel — MD/IT only */}
                        {canUpload && (
                            <div className="flex items-center gap-3 rounded-lg border border-dashed p-4">
                                <FileSpreadsheet className="text-muted-foreground h-8 w-8 shrink-0" />
                                <div className="flex-1 space-y-1">
                                    <input
                                        ref={fileRef}
                                        type="file"
                                        accept=".xlsx,.xls"
                                        className="hidden"
                                        onChange={(e) => setFileName(e.target.files?.[0]?.name ?? '')}
                                    />
                                    <p
                                        className="text-muted-foreground cursor-pointer text-sm hover:underline"
                                        onClick={() => fileRef.current?.click()}
                                    >
                                        {fileName || 'Klik untuk pilih file Excel (.xlsx / .xls)'}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" onClick={handleUpload} disabled={uploading}>
                                        {uploading ? (
                                            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Upload className="mr-1 h-4 w-4" />
                                        )}
                                        Upload
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={handleDownloadTemplate}>
                                        <Download className="mr-1 h-4 w-4" />
                                        Template
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={handleExport} disabled={exporting}>
                                        {exporting ? (
                                            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Download className="mr-1 h-4 w-4" />
                                        )}
                                        Export Excel
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Table */}
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12 text-center">No</TableHead>
                                        <TableHead>Kode Dealer</TableHead>
                                        <TableHead>Nama Dealer</TableHead>
                                        <TableHead className="text-right">Total Target</TableHead>
                                        <TableHead className="text-center">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-muted-foreground h-24 text-center">
                                                <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                                            </TableCell>
                                        </TableRow>
                                    ) : paginatedDealers.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-muted-foreground h-24 text-center">
                                                {search ? 'Dealer tidak ditemukan' : 'Tidak ada data'}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        paginatedDealers.map((d, i) => (
                                            <TableRow key={d.kode_dealer}>
                                                <TableCell className="text-center">
                                                    {(page - 1) * PER_PAGE + i + 1}
                                                </TableCell>
                                                <TableCell className="font-mono text-sm">{d.kode_dealer}</TableCell>
                                                <TableCell>{d.nm_dealer}</TableCell>
                                                <TableCell className="text-right font-semibold">
                                                    {d.total_target.toLocaleString('id-ID')}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Link href={`/target-dealer/${d.kode_dealer}?bulan_tahun=${bulanTahun}`}>
                                                        <Button size="sm" variant={isKacab ? 'default' : 'outline'}>
                                                            <Users className="mr-1 h-4 w-4" />
                                                            {isKacab ? 'Bagi FLP' : 'Detail'}
                                                        </Button>
                                                    </Link>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between">
                                <p className="text-muted-foreground text-xs">
                                    Halaman {page} dari {totalPages}
                                </p>
                                <Pagination>
                                    <PaginationContent>
                                        <PaginationItem>
                                            <PaginationPrevious
                                                href="#"
                                                className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    if (page > 1) setPage(page - 1);
                                                }}
                                            />
                                        </PaginationItem>
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                            <PaginationItem key={p} className="hidden sm:inline-block">
                                                <PaginationLink
                                                    href="#"
                                                    isActive={p === page}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setPage(p);
                                                    }}
                                                >
                                                    {p}
                                                </PaginationLink>
                                            </PaginationItem>
                                        ))}
                                        <PaginationItem>
                                            <PaginationNext
                                                href="#"
                                                className={page >= totalPages ? 'pointer-events-none opacity-50' : ''}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    if (page < totalPages) setPage(page + 1);
                                                }}
                                            />
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
