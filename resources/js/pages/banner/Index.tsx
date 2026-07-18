import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Edit, Loader2, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';

interface BannerItem {
    id: number;
    title: string;
    description: string | null;
    image_url: string | null;
    start_date: string | null;
    end_date: string | null;
    sort_order: number;
    is_active: boolean;
}

interface Props {
    banners: BannerItem[];
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Banner', href: '/banner' }];

export default function BannerIndex({ banners }: Props) {
    const { flash } = usePage().props as unknown as {
        flash?: { error?: string; success?: string };
    };
    const [deleteConfirm, setDeleteConfirm] = useState<BannerItem | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (flash?.error) toast.error(flash.error);
        if (flash?.success) toast.success(flash.success);
    }, [flash]);

    useEffect(() => {
        let driverObj: ReturnType<typeof driver> | null = null;
        const hasSeenTour = localStorage.getItem('has_seen_banner_tour');
        if (!hasSeenTour) {
            driverObj = driver({
                showProgress: true,
                animate: true,
                nextBtnText: 'Next →',
                prevBtnText: '← Previous',
                doneBtnText: 'Got it!',
                steps: [
                    {
                        element: '#tour-banner-create',
                        popover: {
                            title: 'Tambah Banner',
                            description: 'Klik tombol ini untuk menambahkan banner baru yang akan tampil di aplikasi mobile.',
                            side: 'bottom',
                            align: 'end',
                        },
                    },
                    {
                        element: '#tour-banner-table',
                        popover: {
                            title: 'Daftar Banner',
                            description: 'Kelola banner di sini. Klik edit untuk mengubah, atau hapus untuk menghapus banner.',
                            side: 'top',
                            align: 'start',
                        },
                    },
                ],
                onDestroyStarted: () => {
                    localStorage.setItem('has_seen_banner_tour', 'true');
                    driverObj?.destroy();
                },
            });
            setTimeout(() => {
                if (document.getElementById('tour-banner-create')) {
                    driverObj?.drive();
                }
            }, 500);
        }
        return () => { driverObj?.destroy(); };
    }, []);

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const isExpired = (endDate: string | null) => {
        if (!endDate) return false;
        return new Date(endDate) < new Date();
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        setDeleting(true);
        router.delete(`/banner/${deleteConfirm.id}`, {
            onFinish: () => {
                setDeleting(false);
                setDeleteConfirm(null);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Banner" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">Kelola Banner</CardTitle>
                            <p className="text-muted-foreground text-sm mt-1">
                                Banner yang tampil di aplikasi mobile FLP
                            </p>
                        </div>
                        <Link href="/banner/create">
                            <Button id="tour-banner-create" size="sm">
                                <Plus className="mr-1 h-4 w-4" />
                                Tambah Banner
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {banners.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                                <p className="text-sm">Belum ada banner</p>
                                <Link href="/banner/create" className="mt-2">
                                    <Button variant="outline" size="sm">
                                        <Plus className="mr-1 h-4 w-4" />
                                        Tambah Banner Pertama
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div id="tour-banner-table" className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-24">Gambar</TableHead>
                                            <TableHead>Judul</TableHead>
                                            <TableHead>Deskripsi</TableHead>
                                            <TableHead>Tanggal</TableHead>
                                            <TableHead className="text-center">Urutan</TableHead>
                                            <TableHead className="text-center">Status</TableHead>
                                            <TableHead className="text-right">Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {banners.map((banner) => (
                                            <TableRow key={banner.id}>
                                                <TableCell>
                                                    {banner.image_url ? (
                                                        <img
                                                            src={banner.image_url}
                                                            alt={banner.title}
                                                            className="h-14 w-20 rounded object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-14 w-20 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
                                                            No Image
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {banner.title}
                                                </TableCell>
                                                <TableCell className="max-w-48 truncate text-sm text-muted-foreground">
                                                    {banner.description ?? '-'}
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                                    <div>{formatDate(banner.start_date)}</div>
                                                    <div>s/d {formatDate(banner.end_date)}</div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {banner.sort_order}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {banner.is_active ? (
                                                        isExpired(banner.end_date) ? (
                                                            <Badge variant="outline" className="border-yellow-300 text-yellow-600">
                                                                Expired
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="default">Aktif</Badge>
                                                        )
                                                    ) : (
                                                        <Badge variant="secondary">Nonaktif</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Link href={`/banner/${banner.id}/edit`}>
                                                            <Button variant="ghost" size="icon" title="Edit">
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            title="Hapus"
                                                            className="text-destructive hover:text-destructive"
                                                            onClick={() => setDeleteConfirm(banner)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Delete Confirmation */}
            <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Hapus Banner</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        Yakin ingin menghapus banner <strong>"{deleteConfirm?.title}"</strong>?
                        Gambar banner juga akan dihapus.
                    </p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteConfirm(null)} disabled={deleting}>
                            Batal
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                            {deleting && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                            Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
