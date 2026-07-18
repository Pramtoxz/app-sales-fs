import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Calendar, Edit, Hash, ImagePlus, Power, Trash2 } from 'lucide-react';
import { useState } from 'react';

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
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface BannerItem {
    id: number;
    title: string;
    description: string | null;
    image_url: string | null;
    start_date: string | null;
    end_date: string | null;
    sort_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface Props {
    banner: BannerItem;
}

export default function Show({ banner }: Props) {
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Banner', href: '/banner' },
        { title: banner.title, href: '#' },
    ];

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        });
    };

    const isExpired = (endDate: string | null) => {
        if (!endDate) return false;
        return new Date(endDate) < new Date();
    };

    const getStatusBadge = () => {
        if (!banner.is_active) return <Badge variant="secondary">Nonaktif</Badge>;
        if (isExpired(banner.end_date)) return <Badge variant="outline" className="border-yellow-300 text-yellow-600">Expired</Badge>;
        return <Badge variant="default">Aktif</Badge>;
    };

    const handleDelete = () => {
        setDeleting(true);
        router.delete(`/banner/${banner.id}`, {
            onFinish: () => {
                setDeleting(false);
                setDeleteConfirm(false);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Banner - ${banner.title}`} />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/banner">
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg font-semibold">{banner.title}</h1>
                                {getStatusBadge()}
                            </div>
                            <p className="text-muted-foreground text-sm">
                                Detail banner #{banner.id}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href={`/banner/${banner.id}/edit`}>
                            <Button size="sm">
                                <Edit className="mr-1 h-4 w-4" />
                                Edit
                            </Button>
                        </Link>
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setDeleteConfirm(true)}
                        >
                            <Trash2 className="mr-1 h-4 w-4" />
                            Hapus
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Image */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-sm">Gambar Banner</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {banner.image_url ? (
                                <div className="overflow-hidden rounded-lg border">
                                    <img
                                        src={banner.image_url}
                                        alt={banner.title}
                                        className="w-full object-contain"
                                    />
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-20 text-muted-foreground">
                                    <ImagePlus className="mb-2 h-12 w-12" />
                                    <p className="text-sm">Tidak ada gambar</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Info */}
                    <Card className="lg:col-span-1">
                        <CardHeader>
                            <CardTitle className="text-sm">Informasi</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            {banner.description && (
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-muted-foreground">Deskripsi</Label>
                                    <p className="text-sm">{banner.description}</p>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Periode Tampil
                                </Label>
                                <div className="text-sm">
                                    <div>{formatDate(banner.start_date)}</div>
                                    <div className="text-muted-foreground">s/d {formatDate(banner.end_date)}</div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Hash className="h-3 w-3" />
                                    Urutan Tampil
                                </Label>
                                <p className="text-sm font-medium">{banner.sort_order}</p>
                                <p className="text-muted-foreground text-xs">Angka kecil = tampil lebih dulu</p>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Power className="h-3 w-3" />
                                    Status
                                </Label>
                                <div>{getStatusBadge()}</div>
                            </div>

                            <div className="border-t pt-4 space-y-2">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Dibuat</span>
                                    <span>{formatDate(banner.created_at)}</span>
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Diupdate</span>
                                    <span>{formatDate(banner.updated_at)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Delete Confirmation */}
            <Dialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Hapus Banner</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        Yakin ingin menghapus banner <strong>"{banner.title}"</strong>?
                        Gambar banner juga akan dihapus.
                    </p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteConfirm(false)} disabled={deleting}>
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
