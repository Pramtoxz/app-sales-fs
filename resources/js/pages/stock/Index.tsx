import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { Loader2, Package, Search, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Stock', href: '/stock' },
];

interface StockItem {
    kode_item: string;
    warna: string | null;
    jumlah: number;
}

interface StockGroup {
    kode_type: string;
    tipe: string;
    categori: string;
    total: number;
    items: StockItem[];
}

interface Dealer {
    kd_dealer_md: string;
    nm_alias_dealer: string;
}

export default function Index() {
    const { dealers, isKacab } = usePage().props as unknown as {
        dealers: Dealer[];
        isKacab: boolean;
    };

    const [kodeDealer, setKodeDealer] = useState(() => {
        if (isKacab && dealers.length === 1) return dealers[0].kd_dealer_md;
        return '';
    });
    const [search, setSearch] = useState('');
    const [data, setData] = useState<StockGroup[]>([]);
    const [loading, setLoading] = useState(false);

    const loadData = useCallback(async () => {
        if (!kodeDealer) {
            toast.warning('Pilih dealer terlebih dahulu');
            return;
        }
        setLoading(true);
        try {
            const params = new URLSearchParams({ kode_dealer: kodeDealer });
            if (search.trim()) params.set('search', search.trim());

            const res = await fetch(`/stock/data?${params}`);
            const json = await res.json();

            if (json.success) {
                setData(json.data ?? []);
            } else {
                toast.error(json.message || 'Gagal memuat data');
                setData([]);
            }
        } catch {
            toast.error('Gagal memuat data stock');
            setData([]);
        } finally {
            setLoading(false);
        }
    }, [kodeDealer, search]);

    useEffect(() => {
        if (kodeDealer) loadData();
    }, [kodeDealer]);

    const totalAll = useMemo(() => data.reduce((sum, g) => sum + g.total, 0), [data]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Stock" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Stock Unit</CardTitle>
                            {data.length > 0 && (
                                <span className="text-muted-foreground text-sm">
                                    {totalAll.toLocaleString('id-ID')} unit
                                </span>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-end gap-3 flex-wrap">
                            <div className="space-y-1">
                                <Label className="text-xs">Dealer</Label>
                                <Select
                                    value={kodeDealer}
                                    onValueChange={(v) => {
                                        setKodeDealer(v);
                                        setSearch('');
                                        setData([]);
                                    }}
                                    disabled={isKacab && dealers.length === 1}
                                >
                                    <SelectTrigger className="w-64">
                                        <SelectValue placeholder="Pilih dealer" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {dealers.map((d) => (
                                            <SelectItem key={d.kd_dealer_md} value={d.kd_dealer_md}>
                                                {d.kd_dealer_md} - {d.nm_alias_dealer}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {!isKacab && (
                                <>
                                    <div className="relative flex-1 max-w-xs">
                                        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                                        <Input
                                            placeholder="Cari tipe / warna..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') loadData();
                                            }}
                                            className="pl-9 pr-8"
                                        />
                                        {search && (
                                            <button
                                                onClick={() => setSearch('')}
                                                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                    <Button onClick={loadData} disabled={loading || !kodeDealer} size="sm">
                                        {loading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                                        Tampilkan
                                    </Button>
                                </>
                            )}
                        </div>

                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                        <TableRow>
                                            <TableHead>Tipe</TableHead>
                                            <TableHead className="text-center">Kategori</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                        </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-muted-foreground h-24 text-center">
                                                <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                                            </TableCell>
                                        </TableRow>
                                    ) : !kodeDealer ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-muted-foreground h-24 text-center">
                                                Pilih dealer untuk melihat stock
                                            </TableCell>
                                        </TableRow>
                                    ) : data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-muted-foreground h-24 text-center">
                                                Tidak ada data stock
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        data.map((group) => (
                                            <Collapsible key={group.tipe} asChild>
                                                <>
                                                    <CollapsibleTrigger asChild>
                                                        <TableRow className="cursor-pointer hover:bg-muted/50">
                                                            <TableCell>
                                                                <div className="flex items-center gap-2">
                                                                    <Package className="text-muted-foreground h-4 w-4 shrink-0" />
                                                                    <span className="font-medium">{group.kode_type} - {group.tipe}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                <Badge variant="outline">{group.categori}</Badge>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <Badge variant="secondary">
                                                                    {group.total.toLocaleString('id-ID')} unit
                                                                </Badge>
                                                            </TableCell>
                                                        </TableRow>
                                                    </CollapsibleTrigger>
                                                    <CollapsibleContent asChild>
                                                        <>
                                                            {group.items.map((item, idx) => (
                                                                    <TableRow key={`${group.tipe}-${item.kode_item}-${idx}`} className="bg-muted/30">
                                                                    <TableCell className="pl-12">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-muted-foreground font-mono text-xs">
                                                                                {item.kode_item}
                                                                            </span>
                                                                            <span className="text-sm">{item.warna ?? '-'}</span>
                                                                        </div>
                                                                    </TableCell>
                                                                    <TableCell></TableCell>
                                                                    <TableCell className="text-right text-sm">
                                                                        {item.jumlah.toLocaleString('id-ID')}
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </>
                                                    </CollapsibleContent>
                                                </>
                                            </Collapsible>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
