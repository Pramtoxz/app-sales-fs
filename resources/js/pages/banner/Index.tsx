import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Edit, ImagePlus, Loader2, Plus, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';

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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface BannerItem {
    id: number;
    title: string;
    description: string | null;
    image_path: string | null;
    image_url: string | null;
    start_date: string | null;
    end_date: string | null;
    sort_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface Props {
    banners: BannerItem[];
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Banner', href: '/banner' }];

const csrfToken = () =>
    document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute('content') ?? '';

export default function BannerIndex({ banners }: Props) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingBanner, setEditingBanner] = useState<BannerItem | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<BannerItem | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Form state
    const [formTitle, setFormTitle] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formStartDate, setFormStartDate] = useState('');
    const [formEndDate, setFormEndDate] = useState('');
    const [formSortOrder, setFormSortOrder] = useState('0');
    const [formIsActive, setFormIsActive] = useState(true);
    const [formImage, setFormImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const fileRef = useRef<HTMLInputElement>(null);

    const resetForm = () => {
        setFormTitle('');
        setFormDescription('');
        setFormStartDate('');
        setFormEndDate('');
        setFormSortOrder('0');
        setFormIsActive(true);
        setFormImage(null);
        setImagePreview(null);
        if (fileRef.current) fileRef.current.value = '';
    };

    const openCreate = () => {
        setEditingBanner(null);
        resetForm();
        setDialogOpen(true);
    };

    const openEdit = (banner: BannerItem) => {
        setEditingBanner(banner);
        setFormTitle(banner.title);
        setFormDescription(banner.description ?? '');
        setFormStartDate(
            banner.start_date ? banner.start_date.split('T')[0] : '',
        );
        setFormEndDate(banner.end_date ? banner.end_date.split('T')[0] : '');
        setFormSortOrder(String(banner.sort_order));
        setFormIsActive(banner.is_active);
        setFormImage(null);
        setImagePreview(banner.image_url ?? null);
        if (fileRef.current) fileRef.current.value = '';
        setDialogOpen(true);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            toast.error('Ukuran gambar maksimal 2MB');
            return;
        }

        setFormImage(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const handleSave = async () => {
        if (!formTitle.trim()) {
            toast.warning('Judul wajib diisi');
            return;
        }

        if (!editingBanner && !formImage) {
            toast.warning('Gambar wajib diupload');
            return;
        }

        setSaving(true);

        const formData = new FormData();
        formData.append('title', formTitle);
        formData.append('description', formDescription || '');
        formData.append('sort_order', formSortOrder);
        formData.append('is_active', formIsActive ? '1' : '0');

        if (formStartDate) formData.append('start_date', formStartDate);
        if (formEndDate) formData.append('end_date', formEndDate);
        if (formImage) formData.append('image', formImage);

        try {
            const url = editingBanner
                ? `/banner/${editingBanner.id}`
                : '/banner';
            const method = editingBanner ? 'POST' : 'POST';

            if (editingBanner) {
                formData.append('_method', 'PUT');
            }

            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrfToken(),
                },
                body: formData,
            });

            const json = await res.json();

            if (json.success) {
                toast.success(
                    editingBanner ? 'Banner diperbarui' : 'Banner ditambahkan',
                );
                setDialogOpen(false);
                router.reload({ only: ['banners'] });
            } else {
                toast.error(json.message || 'Gagal menyimpan');
            }
        } catch {
            toast.error('Gagal menyimpan');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;

        setDeleting(true);
        try {
            const res = await fetch(`/banner/${deleteConfirm.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                },
            });

            const json = await res.json();

            if (json.success) {
                toast.success('Banner dihapus');
                setDeleteConfirm(null);
                router.reload({ only: ['banners'] });
            } else {
                toast.error(json.message || 'Gagal menghapus');
            }
        } catch {
            toast.error('Gagal menghapus');
        } finally {
            setDeleting(false);
        }
    };

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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Banner" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">Kelola Banner</CardTitle>
                        <Button onClick={openCreate} size="sm">
                            <Plus className="mr-1 h-4 w-4" />
                            Tambah Banner
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {banners.length === 0 ? (
                            <div className="py-8 text-center text-muted-foreground">
                                Belum ada banner. Klik tombol "Tambah Banner"
                                untuk membuat.
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-20">
                                            Gambar
                                        </TableHead>
                                        <TableHead>Judul</TableHead>
                                        <TableHead>Deskripsi</TableHead>
                                        <TableHead>Tanggal</TableHead>
                                        <TableHead className="text-center">
                                            Urutan
                                        </TableHead>
                                        <TableHead className="text-center">
                                            Status
                                        </TableHead>
                                        <TableHead className="text-right">
                                            Aksi
                                        </TableHead>
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
                                                        className="h-12 w-20 rounded object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-12 w-20 items-center justify-center rounded bg-muted text-xs">
                                                        No Image
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {banner.title}
                                            </TableCell>
                                            <TableCell className="max-w-50 truncate text-sm text-muted-foreground">
                                                {banner.description ?? '-'}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                <div>
                                                    {formatDate(
                                                        banner.start_date,
                                                    )}
                                                </div>
                                                <div>
                                                    s/d{' '}
                                                    {formatDate(
                                                        banner.end_date,
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {banner.sort_order}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {banner.is_active ? (
                                                    isExpired(
                                                        banner.end_date,
                                                    ) ? (
                                                        <Badge
                                                            variant="outline"
                                                            className="border-yellow-300 text-yellow-600"
                                                        >
                                                            Expired
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="default">
                                                            Aktif
                                                        </Badge>
                                                    )
                                                ) : (
                                                    <Badge variant="secondary">
                                                        Nonaktif
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            openEdit(banner)
                                                        }
                                                        title="Edit"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            setDeleteConfirm(
                                                                banner,
                                                            )
                                                        }
                                                        title="Hapus"
                                                        className="text-destructive hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Create / Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {editingBanner ? 'Edit Banner' : 'Tambah Banner'}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-4 py-2">
                        {/* Image Upload */}
                        <div className="grid gap-2">
                            <Label>Gambar Banner</Label>
                            <div
                                className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-4 transition-colors hover:border-muted-foreground/50"
                                onClick={() => fileRef.current?.click()}
                            >
                                {imagePreview ? (
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="max-h-40 rounded object-contain"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center gap-2 py-4 text-muted-foreground">
                                        <ImagePlus className="h-8 w-8" />
                                        <span className="text-sm">
                                            Klik untuk upload gambar
                                        </span>
                                        <span className="text-xs">
                                            JPEG, PNG, WEBP (maks 2MB)
                                        </span>
                                    </div>
                                )}
                            </div>
                            <input
                                ref={fileRef}
                                type="file"
                                accept="image/jpeg,image/png,image/jpg,image/webp"
                                className="hidden"
                                onChange={handleImageChange}
                            />
                            {imagePreview && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-fit"
                                    onClick={() => {
                                        setFormImage(null);
                                        setImagePreview(null);
                                        if (fileRef.current)
                                            fileRef.current.value = '';
                                    }}
                                >
                                    Hapus Gambar
                                </Button>
                            )}
                        </div>

                        {/* Title */}
                        <div className="grid gap-2">
                            <Label htmlFor="title">
                                Judul{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="title"
                                value={formTitle}
                                onChange={(e) => setFormTitle(e.target.value)}
                                placeholder="Masukkan judul banner"
                            />
                        </div>

                        {/* Description */}
                        <div className="grid gap-2">
                            <Label htmlFor="description">Deskripsi</Label>
                            <Textarea
                                id="description"
                                value={formDescription}
                                onChange={(e) =>
                                    setFormDescription(e.target.value)
                                }
                                placeholder="Deskripsi banner (opsional)"
                                rows={3}
                            />
                        </div>

                        {/* Date Range */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="start_date">
                                    Tanggal Mulai
                                </Label>
                                <Input
                                    id="start_date"
                                    type="date"
                                    value={formStartDate}
                                    onChange={(e) =>
                                        setFormStartDate(e.target.value)
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="end_date">
                                    Tanggal Berakhir
                                </Label>
                                <Input
                                    id="end_date"
                                    type="date"
                                    value={formEndDate}
                                    onChange={(e) =>
                                        setFormEndDate(e.target.value)
                                    }
                                />
                            </div>
                        </div>

                        {/* Sort Order & Active */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="sort_order">Urutan</Label>
                                <Input
                                    id="sort_order"
                                    type="number"
                                    min="0"
                                    value={formSortOrder}
                                    onChange={(e) =>
                                        setFormSortOrder(e.target.value)
                                    }
                                />
                            </div>
                            <div className="flex items-end gap-2">
                                <Switch
                                    id="is_active"
                                    checked={formIsActive}
                                    onCheckedChange={setFormIsActive}
                                />
                                <Label
                                    htmlFor="is_active"
                                    className="cursor-pointer"
                                >
                                    {formIsActive ? 'Aktif' : 'Nonaktif'}
                                </Label>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDialogOpen(false)}
                            disabled={saving}
                        >
                            Batal
                        </Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving && (
                                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                            )}
                            {editingBanner ? 'Simpan' : 'Tambah'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={!!deleteConfirm}
                onOpenChange={() => setDeleteConfirm(null)}
            >
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Hapus Banner</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        Yakin ingin menghapus banner{' '}
                        <strong>"{deleteConfirm?.title}"</strong>? Gambar banner
                        juga akan dihapus.
                    </p>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteConfirm(null)}
                            disabled={deleting}
                        >
                            Batal
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deleting}
                        >
                            {deleting && (
                                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                            )}
                            Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
