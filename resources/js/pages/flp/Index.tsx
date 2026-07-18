import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

const breadcrumbs: BreadcrumbItem[] = [{ title: 'FLP', href: '/flp' }];

interface FlpItem {
    id_flp: string;
    nama: string;
    jabatan: string;
    is_active: boolean;
    last_login: string;
    foto: string | null;
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
    const [data, setData] = useState<FlpItem[]>([]);
    const [loading, setLoading] = useState(false);

    const loadData = useCallback(async () => {
        if (!kodeDealer) {
            toast.warning('Pilih dealer terlebih dahulu');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(
                `/flp/data?kode_dealer=${encodeURIComponent(kodeDealer)}`,
            );
            const json = await res.json();

            if (json.success) {
                setData(json.data ?? []);
            } else {
                toast.error(json.message || 'Gagal memuat data');
                setData([]);
            }
        } catch {
            toast.error('Gagal memuat data FLP');
            setData([]);
        } finally {
            setLoading(false);
        }
    }, [kodeDealer]);

    useEffect(() => {
        if (kodeDealer) loadData();
    }, [kodeDealer]);

    const handleDealerChange = (v: string) => {
        setKodeDealer(v);
        setData([]);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="FLP" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">
                                Daftar FLP
                            </CardTitle>
                            {data.length > 0 && (
                                <span className="text-sm text-muted-foreground">
                                    {data.length} FLP
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
                                            <SelectItem
                                                key={d.kd_dealer_md}
                                                value={d.kd_dealer_md}
                                            >
                                                {d.kd_dealer_md} - {d.nm_alias_dealer}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {!isKacab && (
                                <Button
                                    onClick={loadData}
                                    disabled={loading || !kodeDealer}
                                    size="sm"
                                >
                                    {loading ? (
                                        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                                    ) : null}
                                    Tampilkan
                                </Button>
                            )}
                        </div>

                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>FLP</TableHead>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Jabatan</TableHead>
                                        <TableHead className="text-center">
                                            Status
                                        </TableHead>
                                        <TableHead>Last Login</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={6}
                                                className="h-24 text-center text-muted-foreground"
                                            >
                                                <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                                            </TableCell>
                                        </TableRow>
                                    ) : !kodeDealer ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={6}
                                                className="h-24 text-center text-muted-foreground"
                                            >
                                                Pilih dealer untuk melihat
                                                daftar FLP
                                            </TableCell>
                                        </TableRow>
                                    ) : data.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={6}
                                                className="h-24 text-center text-muted-foreground"
                                            >
                                                Tidak ada data FLP
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        data.map((flp) => (
                                            <TableRow key={flp.id_flp}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage
                                                                src={
                                                                    flp.foto ??
                                                                    undefined
                                                                }
                                                                alt={flp.nama}
                                                            />
                                                            <AvatarFallback className="text-xs">
                                                                {flp.nama?.charAt(
                                                                    0,
                                                                ) ?? '?'}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span className="font-medium">
                                                            {flp.nama}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-mono text-sm">
                                                    {flp.id_flp}
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {flp.jabatan}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge
                                                        variant={
                                                            flp.is_active
                                                                ? 'default'
                                                                : 'destructive'
                                                        }
                                                        className="text-[10px]"
                                                    >
                                                        {flp.is_active
                                                            ? 'Aktif'
                                                            : 'Non-Aktif'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {flp.last_login}
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
