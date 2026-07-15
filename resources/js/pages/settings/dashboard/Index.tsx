import AppLayout from '@/layouts/app-layout';
import WidgetRenderer from '@/components/dashboard/WidgetRenderer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Loader2, Plus, RotateCcw, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface WidgetType {
    id: number;
    key: string;
    label: string;
    component: string;
    icon: string;
}

interface DataSource {
    id: number;
    key: string;
    label: string;
    endpoint: string;
    description: string;
    default_config: Record<string, unknown>;
}

interface Widget {
    id: number;
    widget_type_id: number;
    widget_type_key: string;
    widget_type_label: string;
    widget_type_component: string;
    data_source_id: number;
    data_source_key: string;
    data_source_label: string;
    data_source_endpoint: string;
    title: string;
    config: Record<string, unknown>;
    pos_x: number;
    pos_y: number;
    width: number;
    height: number;
    visible: boolean;
}

interface Dealer {
    kode_dealer: string;
    nama_dealer: string;
}

interface Props {
    widgetTypes: WidgetType[];
    dataSources: DataSource[];
    widgets: Widget[];
    isKacab: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Pengaturan', href: '#' },
    { title: 'Dashboard', href: '/settings/dashboard' },
];

const csrfToken = () =>
    document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';

export default function KelolaDashboard({ widgetTypes: rawWidgetTypes, dataSources: rawDataSources, widgets: rawWidgets, isKacab }: Props) {
    const widgetTypes = Array.isArray(rawWidgetTypes) ? rawWidgetTypes : [];
    const dataSources = Array.isArray(rawDataSources) ? rawDataSources : [];
    const initialWidgets = Array.isArray(rawWidgets) ? rawWidgets : [];

    const [widgets, setWidgets] = useState<Widget[]>(initialWidgets);
    const [widgetData, setWidgetData] = useState<Record<number, unknown>>({});
    const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set());
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<Widget | null>(null);
    const [resetConfirm, setResetConfirm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [dealers, setDealers] = useState<Dealer[]>([]);

    const [formWidgetTypeId, setFormWidgetTypeId] = useState('');
    const [formDataSourceId, setFormDataSourceId] = useState('');
    const [formTitle, setFormTitle] = useState('');
    const [formKodeDealer, setFormKodeDealer] = useState('');
    const [formBulanTahun, setFormBulanTahun] = useState('');
    const [formLimit, setFormLimit] = useState('');
    const [formShowLegend, setFormShowLegend] = useState(false);
    const [formShowLabel, setFormShowLabel] = useState(false);
    const [formColors, setFormColors] = useState('');

    useEffect(() => {
        if (!isKacab) {
            fetch('/dashboard/data/dealers', {
                headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'same-origin',
            })
                .then((res) => res.json())
                .then((data) => {
                    const list = data?.dealers ?? data?.data ?? data;
                    setDealers(Array.isArray(list) ? list : []);
                })
                .catch(() => {});
        }
    }, [isKacab]);

    useEffect(() => {
        if (widgets.length === 0) return;

        setLoadingIds(new Set(widgets.map((w) => w.id)));

        const fetchAll = widgets.map(async (widget) => {
            try {
                const params = new URLSearchParams();
                if (!isKacab && widget.config?.kode_dealer) {
                    params.append('kode_dealer', String(widget.config.kode_dealer));
                }
                Object.entries(widget.config ?? {}).forEach(([key, value]) => {
                    if (key !== 'kode_dealer' && value !== undefined && value !== null) {
                        params.append(key, String(value));
                    }
                });

                const url = params.toString()
                    ? `${widget.data_source_endpoint}?${params.toString()}`
                    : widget.data_source_endpoint;

                const res = await fetch(url, {
                    headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                    credentials: 'same-origin',
                });

                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                return { id: widget.id, data };
            } catch {
                return { id: widget.id, data: null };
            }
        });

        Promise.all(fetchAll).then((results) => {
            setWidgetData((prev) => {
                const next = { ...prev };
                for (const r of results) {
                    next[r.id] = r.data;
                }
                return next;
            });
            setLoadingIds(new Set());
        });
    }, [widgets, isKacab]);

    const getSpanClass = (w: number) => {
        if (w >= 12) return 'col-span-12';
        if (w >= 8) return 'col-span-12 lg:col-span-8';
        if (w >= 6) return 'col-span-12 lg:col-span-6';
        if (w >= 4) return 'col-span-12 lg:col-span-4';
        return 'col-span-12 lg:col-span-6';
    };

    const resetForm = () => {
        setFormWidgetTypeId('');
        setFormDataSourceId('');
        setFormTitle('');
        setFormKodeDealer('');
        setFormBulanTahun('');
        setFormLimit('');
        setFormShowLegend(false);
        setFormShowLabel(false);
        setFormColors('');
    };

    const openAddDialog = () => {
        resetForm();
        setAddDialogOpen(true);
    };

    const handleAddWidget = async () => {
        if (!formWidgetTypeId) {
            toast.warning('Pilih jenis widget');
            return;
        }
        if (!formDataSourceId) {
            toast.warning('Pilih sumber data');
            return;
        }
        if (!formTitle.trim()) {
            toast.warning('Judul wajib diisi');
            return;
        }

        setSaving(true);

        const config: Record<string, unknown> = {};
        if (!isKacab && formKodeDealer) config.kode_dealer = formKodeDealer;
        if (formBulanTahun) config.bulan_tahun = formBulanTahun;
        if (formLimit) config.limit = parseInt(formLimit);
        config.show_legend = formShowLegend;
        config.show_label = formShowLabel;
        if (formColors.trim()) config.colors = formColors.split(',').map((c) => c.trim());

        try {
            const res = await fetch('/settings/dashboard', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    widget_type_id: parseInt(formWidgetTypeId),
                    data_source_id: parseInt(formDataSourceId),
                    title: formTitle,
                    config,
                }),
            });

            const data = await res.json();

            if (data.success) {
                toast.success('Widget ditambahkan');
                setAddDialogOpen(false);
                router.reload({
                    onSuccess: (page) => {
                        setWidgets((page.props.widgets as Widget[]) ?? widgets);
                    },
                });
            } else {
                toast.error(data.message || 'Gagal menambahkan widget');
            }
        } catch {
            toast.error('Gagal menambahkan widget');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteWidget = async () => {
        if (!deleteConfirm) return;

        setSaving(true);
        try {
            const res = await fetch(`/settings/dashboard/${deleteConfirm.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                    'Accept': 'application/json',
                },
            });

            const data = await res.json();

            if (data.success) {
                toast.success('Widget dihapus');
                setWidgets((prev) => prev.filter((w) => w.id !== deleteConfirm.id));
                setDeleteConfirm(null);
            } else {
                toast.error(data.message || 'Gagal menghapus widget');
            }
        } catch {
            toast.error('Gagal menghapus widget');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = async () => {
        setSaving(true);
        try {
            const res = await fetch('/settings/dashboard/reset', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                    'Accept': 'application/json',
                },
            });

            const data = await res.json();

            if (data.success) {
                toast.success('Dashboard direset ke default');
                setResetConfirm(false);
                router.reload({
                    onSuccess: (page) => {
                        setWidgets((page.props.widgets as Widget[]) ?? []);
                    },
                });
            } else {
                toast.error(data.message || 'Gagal mereset dashboard');
            }
        } catch {
            toast.error('Gagal mereset dashboard');
        } finally {
            setSaving(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kelola Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">Kelola Dashboard</CardTitle>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setResetConfirm(true)}>
                                <RotateCcw className="mr-1 h-4 w-4" />
                                Reset ke Default
                            </Button>
                            <Button size="sm" onClick={openAddDialog}>
                                <Plus className="mr-1 h-4 w-4" />
                                Tambah Widget
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {widgets.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                                <p className="text-lg font-medium">Belum ada widget</p>
                                <p className="text-sm">Klik "Tambah Widget" untuk menambahkan widget baru</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-12 gap-4">
                                {widgets.map((widget) => (
                                    <div
                                        key={String(widget.id)}
                                        className={`${getSpanClass(widget.width)} rounded-lg border bg-card shadow-sm overflow-hidden`}
                                        style={{ minHeight: (widget.height ?? 4) * 50 }}
                                    >
                                        <div className="flex items-center justify-between border-b px-4 py-2">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-sm font-semibold">{widget.title}</h3>
                                                <Badge variant="secondary" className="text-[10px]">
                                                    {widget.widget_type_label}
                                                </Badge>
                                                <Badge variant="outline" className="text-[10px]">
                                                    {widget.data_source_label}
                                                </Badge>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                                onClick={() => setDeleteConfirm(widget)}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                        <div className="p-4 h-[calc(100%-44px)] overflow-auto">
                                            <WidgetRenderer
                                                component={widget.widget_type_component}
                                                data={widgetData[widget.id]}
                                                config={widget.config ?? {}}
                                                loading={loadingIds.has(widget.id)}
                                            />
                                        </div>
                                </div>
                            ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Tambah Widget</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-2">
                        <div className="space-y-1">
                            <Label>Jenis Widget <span className="text-destructive">*</span></Label>
                            <Select value={formWidgetTypeId} onValueChange={setFormWidgetTypeId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih jenis widget" />
                                </SelectTrigger>
                                <SelectContent>
                                    {widgetTypes.map((wt) => (
                                        <SelectItem key={wt.id} value={String(wt.id)}>
                                            {wt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <Label>Sumber Data <span className="text-destructive">*</span></Label>
                            <Select value={formDataSourceId} onValueChange={setFormDataSourceId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih sumber data" />
                                </SelectTrigger>
                                <SelectContent>
                                    {dataSources.map((ds) => (
                                        <SelectItem key={ds.id} value={String(ds.id)}>
                                            {ds.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <Label>Judul <span className="text-destructive">*</span></Label>
                            <Input
                                value={formTitle}
                                onChange={(e) => setFormTitle(e.target.value)}
                                placeholder="Judul widget"
                            />
                        </div>

                        {!isKacab && (
                            <div className="space-y-1">
                                <Label>Dealer</Label>
                                <Select value={formKodeDealer} onValueChange={setFormKodeDealer}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih dealer (opsional)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {dealers.map((d) => (
                                            <SelectItem key={d.kode_dealer} value={d.kode_dealer}>
                                                {d.nama_dealer}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label>Bulan/Tahun</Label>
                                <Input
                                    type="month"
                                    value={formBulanTahun}
                                    onChange={(e) => setFormBulanTahun(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label>Limit</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    value={formLimit}
                                    onChange={(e) => setFormLimit(e.target.value)}
                                    placeholder="Jumlah data"
                                />
                            </div>
                        </div>

                        <div className="flex gap-6">
                            <label className="flex items-center gap-2 text-sm">
                                <Checkbox
                                    checked={formShowLegend}
                                    onCheckedChange={(v) => setFormShowLegend(v === true)}
                                />
                                Tampilkan Legend
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                                <Checkbox
                                    checked={formShowLabel}
                                    onCheckedChange={(v) => setFormShowLabel(v === true)}
                                />
                                Tampilkan Label
                            </label>
                        </div>

                        <div className="space-y-1">
                            <Label>Warna (hex, pisahkan koma)</Label>
                            <Input
                                value={formColors}
                                onChange={(e) => setFormColors(e.target.value)}
                                placeholder="#FF0000, #00FF00, #0000FF"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddDialogOpen(false)} disabled={saving}>
                            Batal
                        </Button>
                        <Button onClick={handleAddWidget} disabled={saving}>
                            {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                            Tambah
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Hapus Widget</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        Yakin ingin menghapus widget <strong>"{deleteConfirm?.title}"</strong>?
                    </p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteConfirm(null)} disabled={saving}>
                            Batal
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteWidget} disabled={saving}>
                            {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                            Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={resetConfirm} onOpenChange={setResetConfirm}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Reset Dashboard</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        Semua widget akan dihapus dan dikembalikan ke pengaturan default. Lanjutkan?
                    </p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setResetConfirm(false)} disabled={saving}>
                            Batal
                        </Button>
                        <Button variant="destructive" onClick={handleReset} disabled={saving}>
                            {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                            Reset
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
