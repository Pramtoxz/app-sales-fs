import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    { title: 'Performance', href: '/performance' },
];

interface PerformanceItem {
    rank: number;
    id_flp: string;
    nama: string;
    foto: string | null;
    total_target: number;
    total_terjual: number;
    persentase: number;
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
    const [bulanTahun, setBulanTahun] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    const [data, setData] = useState<PerformanceItem[]>([]);
    const [loading, setLoading] = useState(false);

    const loadData = useCallback(async () => {
        if (!kodeDealer) {
            toast.warning('Pilih dealer terlebih dahulu');
            return;
        }
        setLoading(true);
        try {
            const params = new URLSearchParams({
                kode_dealer: kodeDealer,
                bulan_tahun: bulanTahun,
            });
            const res = await fetch(`/performance/data?${params}`);
            const json = await res.json();

            if (json.success) {
                setData(json.data ?? []);
            } else {
                toast.error(json.message || 'Gagal memuat data');
                setData([]);
            }
        } catch {
            toast.error('Gagal memuat data performance');
            setData([]);
        } finally {
            setLoading(false);
        }
    }, [kodeDealer, bulanTahun]);

    useEffect(() => {
        if (kodeDealer) loadData();
    }, [kodeDealer]);

    const handleDealerChange = (v: string) => {
        setKodeDealer(v);
        setData([]);
    };

    const getRankBadge = (rank: number) => {
        if (rank === 1) return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">1</Badge>;
        if (rank === 2) return <Badge className="bg-gray-400 hover:bg-gray-500 text-white">2</Badge>;
        if (rank === 3) return <Badge className="bg-amber-700 hover:bg-amber-800 text-white">3</Badge>;
        return <span className="text-muted-foreground text-sm">{rank}</span>;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Performance" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Performance Leaderboard</CardTitle>
                            {data.length > 0 && (
                                <span className="text-muted-foreground text-sm">
                                    {data.length} FLP
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
                            <div className="space-y-1">
                                <Label className="text-xs">Periode</Label>
                                <Input
                                    type="month"
                                    value={bulanTahun}
                                    onChange={(e) => setBulanTahun(e.target.value)}
                                    className="w-40"
                                />
                            </div>
                            {!isKacab && (
                                <Button onClick={loadData} disabled={loading || !kodeDealer} size="sm">
                                    {loading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                                    Tampilkan
                                </Button>
                            )}
                            {isKacab && (
                                <Button onClick={loadData} disabled={loading || !kodeDealer} size="sm" variant="outline">
                                    {loading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                                    Refresh
                                </Button>
                            )}
                        </div>

                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12 text-center">Rank</TableHead>
                                        <TableHead>FLP</TableHead>
                                        <TableHead className="text-right">Target</TableHead>
                                        <TableHead className="text-right">Terjual</TableHead>
                                        <TableHead className="text-right">Capai</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-muted-foreground h-24 text-center">
                                                <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                                            </TableCell>
                                        </TableRow>
                                    ) : !kodeDealer ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-muted-foreground h-24 text-center">
                                                Pilih dealer untuk melihat performance
                                            </TableCell>
                                        </TableRow>
                                    ) : data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-muted-foreground h-24 text-center">
                                                Tidak ada data performance
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        data.map((item) => (
                                            <TableRow key={item.id_flp}>
                                                <TableCell className="text-center">
                                                    {getRankBadge(item.rank)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={item.foto ?? undefined} alt={item.nama} />
                                                            <AvatarFallback className="text-xs">
                                                                {item.nama?.charAt(0) ?? '?'}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <span className="font-medium">{item.nama}</span>
                                                            <span className="text-muted-foreground block text-xs">
                                                                {item.id_flp}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {item.total_target.toLocaleString('id-ID')}
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {item.total_terjual.toLocaleString('id-ID')}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Badge
                                                        variant={item.persentase >= 100 ? 'default' : item.persentase >= 50 ? 'secondary' : 'destructive'}
                                                        className="text-xs"
                                                    >
                                                        {item.persentase}%
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
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
