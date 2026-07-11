import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { ClipboardList, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
    { title: 'Indent', href: '/indent' },
];

interface IndentItem {
    antrian: number;
    customer_id: string;
    customer_name: string;
    leasing: string;
    kode_item: string;
    warna: string | null;
    tgl_antrian: string;
    umur_indent: number;
    is_revisi: boolean;
    status: string;
}

interface IndentGroup {
    tipe: string;
    categori: string;
    idx_category: number;
    items: IndentItem[];
}

interface Dealer {
    kd_dealer_md: string;
    nm_dealer: string;
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
    const [data, setData] = useState<IndentGroup[]>([]);
    const [loading, setLoading] = useState(false);

    const loadData = useCallback(async () => {
        if (!kodeDealer) {
            toast.warning('Pilih dealer terlebih dahulu');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`/indent/data?kode_dealer=${encodeURIComponent(kodeDealer)}`);
            const json = await res.json();

            if (json.success) {
                setData(json.data ?? []);
            } else {
                toast.error(json.message || 'Gagal memuat data');
                setData([]);
            }
        } catch {
            toast.error('Gagal memuat data indent');
            setData([]);
        } finally {
            setLoading(false);
        }
    }, [kodeDealer]);

    const handleDealerChange = (v: string) => {
        setKodeDealer(v);
        setData([]);
    };

    useEffect(() => {
        if (kodeDealer) loadData();
    }, [kodeDealer]);

    const totalAll = data.reduce((sum, g) => sum + g.items.length, 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Indent" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Indent</CardTitle>
                            {data.length > 0 && (
                                <span className="text-muted-foreground text-sm">
                                    {totalAll} antrian
                                </span>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-end gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs">Dealer</Label>
                                <Select
                                    value={kodeDealer}
                                    onValueChange={handleDealerChange}
                                    disabled={isKacab && dealers.length === 1}
                                >
                                    <SelectTrigger className="w-64">
                                        <SelectValue placeholder="Pilih dealer" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {dealers.map((d) => (
                                            <SelectItem key={d.kd_dealer_md} value={d.kd_dealer_md}>
                                                {d.nm_dealer} ({d.kd_dealer_md})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {!isKacab && (
                                <Button onClick={loadData} disabled={loading || !kodeDealer} size="sm">
                                    {loading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                                    Tampilkan
                                </Button>
                            )}
                        </div>

                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Tipe</TableHead>
                                        <TableHead className="text-center">Kategori</TableHead>
                                        <TableHead className="text-right">Antrian</TableHead>
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
                                                Pilih dealer untuk melihat indent
                                            </TableCell>
                                        </TableRow>
                                    ) : data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-muted-foreground h-24 text-center">
                                                Tidak ada data indent aktif
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
                                                                    <ClipboardList className="text-muted-foreground h-4 w-4 shrink-0" />
                                                                    <span className="font-medium">{group.tipe}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                <Badge variant="outline">{group.categori}</Badge>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <Badge variant="secondary">
                                                                    {group.items.length}
                                                                </Badge>
                                                            </TableCell>
                                                        </TableRow>
                                                    </CollapsibleTrigger>
                                                    <CollapsibleContent asChild>
                                                        <>
                                                            <TableRow className="bg-muted/50">
                                                                <TableCell colSpan={3} className="px-4 py-2">
                                                                    <div className="rounded-md border">
                                                                        <Table>
                                                                            <TableHeader>
                                                                                <TableRow>
                                                                                    <TableHead className="w-12 text-center">#</TableHead>
                                                                                    <TableHead>Customer</TableHead>
                                                                                    <TableHead>Warna</TableHead>
                                                                                    <TableHead>Leasing</TableHead>
                                                                                    <TableHead>Tgl Antrian</TableHead>
                                                                                    <TableHead className="text-center">Umur</TableHead>
                                                                                    <TableHead className="text-center">Status</TableHead>
                                                                                </TableRow>
                                                                            </TableHeader>
                                                                            <TableBody>
                                                                                {group.items.map((item) => (
                                                                                    <TableRow key={`${group.tipe}-${item.antrian}`}>
                                                                                        <TableCell className="text-center">
                                                                                            {item.is_revisi ? (
                                                                                                <Badge variant="destructive" className="text-[10px] px-1">
                                                                                                    R{item.antrian}
                                                                                                </Badge>
                                                                                            ) : (
                                                                                                item.antrian
                                                                                            )}
                                                                                        </TableCell>
                                                                                        <TableCell>
                                                                                            <div>
                                                                                                <span className="text-sm font-medium">
                                                                                                    {item.customer_name ?? '-'}
                                                                                                </span>
                                                                                                <span className="text-muted-foreground block text-xs">
                                                                                                    {item.customer_id}
                                                                                                </span>
                                                                                            </div>
                                                                                        </TableCell>
                                                                                        <TableCell className="text-sm">
                                                                                            {item.warna ?? '-'}
                                                                                        </TableCell>
                                                                                        <TableCell className="text-sm">
                                                                                            {item.leasing}
                                                                                        </TableCell>
                                                                                        <TableCell className="text-muted-foreground text-sm">
                                                                                            {item.tgl_antrian}
                                                                                        </TableCell>
                                                                                        <TableCell className="text-center text-sm">
                                                                                            {item.umur_indent} hari
                                                                                        </TableCell>
                                                                                        <TableCell className="text-center">
                                                                                            <Badge
                                                                                                variant={item.status === 'terpenuhi' ? 'default' : 'secondary'}
                                                                                                className="text-[10px]"
                                                                                            >
                                                                                                {item.status}
                                                                                            </Badge>
                                                                                        </TableCell>
                                                                                    </TableRow>
                                                                                ))}
                                                                            </TableBody>
                                                                        </Table>
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
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
