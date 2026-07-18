import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, ImagePlus, Loader2, Save } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { compressImage, formatFileSize } from '@/utils/imageCompressor';

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
    banner: BannerItem;
}

export default function Edit({ banner }: Props) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [saving, setSaving] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(banner.image_url);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageInfo, setImageInfo] = useState<string>(banner.image_url ? 'Gambar saat ini' : '');

    const [form, setForm] = useState({
        title: banner.title,
        description: banner.description ?? '',
        start_date: banner.start_date ? banner.start_date.split('T')[0] : '',
        end_date: banner.end_date ? banner.end_date.split('T')[0] : '',
        sort_order: String(banner.sort_order),
        is_active: banner.is_active,
    });

    const truncate = (str: string, max: number) =>
        str.length > max ? str.substring(0, max) + '...' : str;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Banner', href: '/banner' },
        { title: truncate(banner.title, 20), href: '#' },
    ];

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const compressed = await compressImage(file, 4.5, 1920);
            if (compressed.size < file.size) {
                toast.success(`Gambar dikompres: ${formatFileSize(file.size)} → ${formatFileSize(compressed.size)}`);
            }
            setImageFile(compressed);
            setImagePreview(URL.createObjectURL(compressed));
            setImageInfo(`${compressed.name} (${formatFileSize(compressed.size)})`);
        } catch {
            toast.error('Gagal memproses gambar');
        }
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
        setImageInfo('');
        if (fileRef.current) fileRef.current.value = '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.title.trim()) {
            toast.warning('Judul wajib diisi');
            return;
        }

        setSaving(true);

        const formData = new FormData();
        formData.append('_method', 'PUT');
        formData.append('title', form.title);
        formData.append('description', form.description);
        formData.append('sort_order', form.sort_order);
        formData.append('is_active', form.is_active ? '1' : '0');
        if (form.start_date) formData.append('start_date', form.start_date);
        if (form.end_date) formData.append('end_date', form.end_date);
        if (imageFile) formData.append('image', imageFile);

        router.post(`/banner/${banner.id}`, formData, {
            onFinish: () => setSaving(false),
            onError: (errors) => {
                const firstError = Object.values(errors)[0];
                if (firstError) toast.error(firstError);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Banner" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center gap-3">
                    <Link href="/banner">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-lg font-semibold">Edit Banner</h1>
                        <p className="text-muted-foreground text-sm max-w-md truncate" title={banner.title}>{truncate(banner.title, 50)}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* Preview */}
                        <Card className="lg:col-span-1">
                            <CardHeader>
                                <CardTitle className="text-sm">Gambar Banner</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div
                                    className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 transition-colors hover:border-muted-foreground/50 overflow-hidden"
                                    onClick={() => fileRef.current?.click()}
                                >
                                    {imagePreview ? (
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="w-full rounded-lg object-contain"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
                                            <ImagePlus className="h-12 w-12" />
                                            <div className="text-center">
                                                <p className="text-sm font-medium">Klik untuk upload gambar baru</p>
                                                <p className="text-xs">JPEG, PNG, WEBP (maks 5MB)</p>
                                            </div>
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
                                {imageInfo && (
                                    <div className="mt-2 flex items-center justify-between">
                                        <p className="text-muted-foreground text-xs">{imageInfo}</p>
                                        {imageFile && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 text-xs text-destructive"
                                                onClick={removeImage}
                                            >
                                                Batal
                                            </Button>
                                        )}
                                    </div>
                                )}
                                {!imageFile && banner.image_url && (
                                    <p className="text-muted-foreground mt-1 text-xs">Klik gambar untuk mengganti</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Form */}
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="text-sm">Informasi Banner</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                <div className="space-y-1.5">
                                    <Label htmlFor="title">
                                        Judul <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="title"
                                        value={form.title}
                                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                                        placeholder="Masukkan judul banner"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="description">Deskripsi</Label>
                                    <Textarea
                                        id="description"
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        placeholder="Deskripsi banner (opsional)"
                                        rows={3}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="start_date">Tanggal Mulai</Label>
                                        <Input
                                            id="start_date"
                                            type="date"
                                            value={form.start_date}
                                            onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="end_date">Tanggal Berakhir</Label>
                                        <Input
                                            id="end_date"
                                            type="date"
                                            value={form.end_date}
                                            onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="sort_order">Urutan Tampil</Label>
                                        <Input
                                            id="sort_order"
                                            type="number"
                                            min="0"
                                            value={form.sort_order}
                                            onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                                        />
                                        <p className="text-muted-foreground text-xs">Angka kecil = tampil lebih dulu</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Status</Label>
                                        <div className="flex items-center gap-2 pt-1">
                                            <Switch
                                                checked={form.is_active}
                                                onCheckedChange={(v) => setForm({ ...form, is_active: v })}
                                            />
                                            <span className="text-sm">{form.is_active ? 'Aktif' : 'Nonaktif'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 pt-2">
                                    <Button type="submit" disabled={saving}>
                                        {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
                                        Simpan Perubahan
                                    </Button>
                                    <Link href="/banner">
                                        <Button type="button" variant="outline">Batal</Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
