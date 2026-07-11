import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { Loader2, Search, Send, X } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';

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
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Broadcast', href: '/notifikasi' },
];

interface SalesItem {
    id_flp: string;
    nama: string;
    kode_dealer: string;
    is_active: boolean;
}

export default function Index() {
    const { isKacab } = usePage().props as unknown as {
        isKacab: boolean;
        isMd: boolean;
        isIt: boolean;
        fkDealer: string;
    };

    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [target, setTarget] = useState<'all' | 'specific'>('all');
    const [salesList, setSalesList] = useState<SalesItem[]>([]);
    const [selectedFlp, setSelectedFlp] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [sending, setSending] = useState(false);
    const searchTimeout = useRef<ReturnType<typeof setTimeout>>(null);

    const searchSales = useCallback(async (q: string) => {
        if (q.length < 2) {
            setSalesList([]);
            return;
        }
        setSearching(true);
        try {
            const res = await fetch(`/notifikasi/sales?search=${encodeURIComponent(q)}`);
            const json = await res.json();
            setSalesList(json.data ?? []);
        } catch {
            toast.error('Gagal memuat data sales');
        } finally {
            setSearching(false);
        }
    }, []);

    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        setSelectedFlp('');
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => searchSales(value), 300);
    };

    const handleSend = async () => {
        if (!title.trim()) {
            toast.warning('Judul wajib diisi');
            return;
        }
        if (!message.trim()) {
            toast.warning('Pesan wajib diisi');
            return;
        }
        if (target === 'specific' && !selectedFlp) {
            toast.warning('Pilih sales terlebih dahulu');
            return;
        }

        setSending(true);
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
            const res = await fetch('/notifikasi/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({
                    title,
                    message,
                    target,
                    id_flp: target === 'specific' ? selectedFlp : null,
                }),
            });
            const json = await res.json();

            if (json.success) {
                toast.success(json.message);
                setTitle('');
                setMessage('');
                setTarget('all');
                setSelectedFlp('');
                setSearchQuery('');
                setSalesList([]);
            } else {
                toast.error(json.message || 'Gagal mengirim notifikasi');
            }
        } catch {
            toast.error('Gagal mengirim notifikasi');
        } finally {
            setSending(false);
        }
    };

    const selectedSales = salesList.find((s) => s.id_flp === selectedFlp);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Broadcast Notifikasi" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Broadcast Notifikasi</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1">
                            <Label>
                                Judul <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Contoh: Promo Spesial Bulan Ini"
                                maxLength={255}
                            />
                        </div>

                        <div className="space-y-1">
                            <Label>
                                Pesan <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Tulis pesan notifikasi..."
                                rows={4}
                                maxLength={1000}
                            />
                            <p className="text-muted-foreground text-xs text-right">
                                {message.length}/1000
                            </p>
                        </div>

                        <div className="space-y-1">
                            <Label>Target Penerima</Label>
                            <Select value={target} onValueChange={(v) => {
                                setTarget(v as 'all' | 'specific');
                                if (v === 'all') {
                                    setSelectedFlp('');
                                    setSearchQuery('');
                                    setSalesList([]);
                                }
                            }}>
                                <SelectTrigger className="w-full sm:w-64">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        {isKacab ? 'Semua Sales di Dealer Saya' : 'Semua Sales'}
                                    </SelectItem>
                                    <SelectItem value="specific">Pilih Sales Tertentu</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {target === 'specific' && (
                            <div className="space-y-2">
                                <Label>Cari Sales</Label>
                                <div className="relative">
                                    <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                                    <Input
                                        value={searchQuery}
                                        onChange={(e) => handleSearchChange(e.target.value)}
                                        placeholder="Ketik nama atau ID sales..."
                                        className="pl-9 pr-8"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => {
                                                setSearchQuery('');
                                                setSelectedFlp('');
                                                setSalesList([]);
                                            }}
                                            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                    {searching && (
                                        <Loader2 className="text-muted-foreground absolute top-1/2 right-8 h-4 w-4 -translate-y-1/2 animate-spin" />
                                    )}
                                </div>

                                {salesList.length > 0 && (
                                    <div className="max-h-48 overflow-y-auto rounded-md border">
                                        {salesList.map((s) => (
                                            <button
                                                key={s.id_flp}
                                                onClick={() => setSelectedFlp(s.id_flp)}
                                                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted ${
                                                    selectedFlp === s.id_flp ? 'bg-muted' : ''
                                                }`}
                                            >
                                                <div>
                                                    <span className="font-medium">{s.nama}</span>
                                                    <span className="text-muted-foreground ml-2 text-xs">
                                                        ({s.id_flp})
                                                    </span>
                                                </div>
                                                <span className="text-muted-foreground text-xs">
                                                    {s.kode_dealer}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {searchQuery.length >= 2 && salesList.length === 0 && !searching && (
                                    <p className="text-muted-foreground text-sm">Sales tidak ditemukan</p>
                                )}

                                {selectedSales && (
                                    <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm">
                                        <span className="font-medium">{selectedSales.nama}</span>
                                        <span className="text-muted-foreground text-xs">
                                            ({selectedSales.id_flp} — {selectedSales.kode_dealer})
                                        </span>
                                        <button
                                            onClick={() => {
                                                setSelectedFlp('');
                                                setSearchQuery('');
                                                setSalesList([]);
                                            }}
                                            className="ml-auto text-muted-foreground hover:text-foreground"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex items-center gap-3 pt-2">
                            <Button onClick={handleSend} disabled={sending}>
                                {sending ? (
                                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="mr-1 h-4 w-4" />
                                )}
                                Kirim Notifikasi
                            </Button>
                            <span className="text-muted-foreground text-xs">
                                {target === 'all'
                                    ? isKacab
                                        ? 'Akan dikirim ke semua sales di dealer Anda'
                                        : 'Akan dikirim ke semua sales di semua dealer'
                                    : selectedFlp
                                        ? `Akan dikirim ke ${selectedSales?.nama ?? selectedFlp}`
                                        : 'Pilih sales terlebih dahulu'}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
