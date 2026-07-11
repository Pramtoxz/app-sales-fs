import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { ChevronDown, ChevronRight, Edit, Loader2, Plus, Trash2 } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';

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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';

interface MenuRole {
    id: number;
    menu_id: number;
    role: string;
}

interface MenuItem {
    id: number;
    nama_menu: string;
    ikon: string | null;
    route: string | null;
    url: string | null;
    parent_id: number | null;
    urutan: number;
    status_aktif: boolean;
    menu_role: MenuRole[];
    children?: MenuItem[];
}

interface Props {
    menus: MenuItem[];
    allRoles: string[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Pengaturan', href: '#' },
    { title: 'Menu', href: '/settings/menus' },
];

const csrfToken = () =>
    document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';

export default function MenuIndex({ menus, allRoles }: Props) {
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<MenuItem | null>(null);
    const [deleting, setDeleting] = useState(false);

    const [formNama, setFormNama] = useState('');
    const [formIkon, setFormIkon] = useState('');
    const [formRoute, setFormRoute] = useState('');
    const [formUrl, setFormUrl] = useState('');
    const [formParentId, setFormParentId] = useState<string>('root');
    const [formUrutan, setFormUrutan] = useState('0');
    const [formAktif, setFormAktif] = useState(true);
    const [formRoles, setFormRoles] = useState<string[]>([]);

    const toggleExpand = (id: number) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const getRoles = (menu: MenuItem): string[] =>
        menu.menu_role?.map((r) => r.role) ?? [];

    const openCreate = (parentId?: number) => {
        setEditingMenu(null);
        setFormNama('');
        setFormIkon('');
        setFormRoute('');
        setFormUrl('');
        setFormParentId(parentId ? String(parentId) : 'root');
        setFormUrutan('0');
        setFormAktif(true);
        setFormRoles([]);
        setDialogOpen(true);
    };

    const openEdit = (menu: MenuItem) => {
        setEditingMenu(menu);
        setFormNama(menu.nama_menu);
        setFormIkon(menu.ikon ?? '');
        setFormRoute(menu.route ?? '');
        setFormUrl(menu.url ?? '');
        setFormParentId(menu.parent_id ? String(menu.parent_id) : 'root');
        setFormUrutan(String(menu.urutan));
        setFormAktif(menu.status_aktif);
        setFormRoles(getRoles(menu));
        setDialogOpen(true);
    };

    const toggleRole = (role: string) => {
        setFormRoles((prev) =>
            prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
        );
    };

    const handleSave = async () => {
        if (!formNama.trim()) {
            toast.warning('Nama menu wajib diisi');
            return;
        }

        setSaving(true);
        const payload = {
            nama_menu: formNama,
            ikon: formIkon || null,
            route: formRoute || null,
            url: formUrl || null,
            parent_id: formParentId === 'root' ? null : parseInt(formParentId),
            urutan: parseInt(formUrutan) || 0,
            status_aktif: formAktif,
            roles: formRoles,
        };

        try {
            const url = editingMenu
                ? `/settings/menus/${editingMenu.id}`
                : '/settings/menus';
            const method = editingMenu ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                },
                body: JSON.stringify(payload),
            });
            const json = await res.json();

            if (json.success) {
                toast.success(editingMenu ? 'Menu diperbarui' : 'Menu dibuat');
                setDialogOpen(false);
                router.reload({ only: ['menus'] });
            } else {
                toast.error(json.message || 'Gagal menyimpan');
            }
        } catch {
            toast.error('Gagal menyimpan');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (menu: MenuItem) => {
        setDeleteConfirm(menu);
    };

    const confirmDelete = async () => {
        if (!deleteConfirm) return;

        setDeleting(true);
        try {
            const res = await fetch(`/settings/menus/${deleteConfirm.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                },
            });
            const json = await res.json();

            if (json.success) {
                toast.success('Menu dihapus');
                setDeleteConfirm(null);
                router.reload({ only: ['menus'] });
            } else {
                toast.error(json.message || 'Gagal menghapus');
            }
        } catch {
            toast.error('Gagal menghapus');
        } finally {
            setDeleting(false);
        }
    };

    const renderRoleBadges = (menu: MenuItem) => {
        const roles = getRoles(menu);
        if (roles.length === 0) return <span className="text-muted-foreground text-xs">-</span>;
        return (
            <div className="flex gap-1">
                {roles.map((r) => (
                    <Badge key={r} variant="outline" className="text-[10px]">
                        {r}
                    </Badge>
                ))}
            </div>
        );
    };

    const renderRow = (menu: MenuItem, depth: number = 0): React.ReactNode => {
        const hasChildren = menu.children && menu.children.length > 0;
        const isExpanded = expandedIds.has(menu.id);

        return (
            <>
                <TableRow key={menu.id}>
                    <TableCell>
                        <div className="flex items-center" style={{ paddingLeft: depth * 24 }}>
                            {hasChildren ? (
                                <button
                                    onClick={() => toggleExpand(menu.id)}
                                    className="hover:bg-muted mr-1 rounded p-0.5"
                                >
                                    {isExpanded ? (
                                        <ChevronDown className="h-4 w-4" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4" />
                                    )}
                                </button>
                            ) : (
                                <span className="mr-1 w-5" />
                            )}
                            <span className="text-sm font-medium">{menu.nama_menu}</span>
                        </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                        {menu.ikon ?? '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                        {menu.route ?? menu.url ?? '-'}
                    </TableCell>
                    <TableCell>{renderRoleBadges(menu)}</TableCell>
                    <TableCell className="text-center">
                        <span className={`text-xs ${menu.status_aktif ? 'text-green-600' : 'text-red-600'}`}>
                            {menu.status_aktif ? 'Aktif' : 'Nonaktif'}
                        </span>
                    </TableCell>
                    <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                            {depth === 0 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => openCreate(menu.id)}
                                >
                                    <Plus className="mr-1 h-3 w-3" />
                                    Sub
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => openEdit(menu)}
                            >
                                <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => handleDelete(menu)}
                            >
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                    </TableCell>
                </TableRow>
                {hasChildren && isExpanded && menu.children!.map((child) => renderRow(child, depth + 1))}
            </>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Menu Management" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">Menu Management</CardTitle>
                        <Button size="sm" onClick={() => openCreate()}>
                            <Plus className="mr-1 h-4 w-4" />
                            Tambah Menu
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nama Menu</TableHead>
                                        <TableHead>Icon</TableHead>
                                        <TableHead>Route / URL</TableHead>
                                        <TableHead>Roles</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                        <TableHead className="text-center">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {menus.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-muted-foreground h-24 text-center">
                                                Belum ada menu
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        menus.map((menu) => renderRow(menu))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Dialog Tambah/Edit Menu */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {editingMenu ? 'Edit Menu' : 'Tambah Menu'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-2">
                        <div className="space-y-1">
                            <Label>Nama Menu <span className="text-red-500">*</span></Label>
                            <Input
                                value={formNama}
                                onChange={(e) => setFormNama(e.target.value)}
                                placeholder="Contoh: Dashboard"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label>Icon (Lucide)</Label>
                                <Input
                                    value={formIkon}
                                    onChange={(e) => setFormIkon(e.target.value)}
                                    placeholder="Contoh: LayoutDashboard"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label>Urutan</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={formUrutan}
                                    onChange={(e) => setFormUrutan(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label>Route Name</Label>
                                <Input
                                    value={formRoute}
                                    onChange={(e) => setFormRoute(e.target.value)}
                                    placeholder="Contoh: dashboard"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label>URL</Label>
                                <Input
                                    value={formUrl}
                                    onChange={(e) => setFormUrl(e.target.value)}
                                    placeholder="Contoh: /dashboard"
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label>Parent Menu</Label>
                            <Select value={formParentId} onValueChange={setFormParentId}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="root">-- Root (Menu Utama) --</SelectItem>
                                    {menus.map((m) => (
                                        <SelectItem key={m.id} value={String(m.id)}>
                                            {m.nama_menu}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Roles</Label>
                            <div className="flex gap-4">
                                {allRoles.map((role) => (
                                    <label key={role} className="flex items-center gap-2 text-sm">
                                        <Checkbox
                                            checked={formRoles.includes(role)}
                                            onCheckedChange={() => toggleRole(role)}
                                        />
                                        {role}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Checkbox
                                checked={formAktif}
                                onCheckedChange={(v) => setFormAktif(v === true)}
                            />
                            <Label className="text-sm">Status Aktif</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            Batal
                        </Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                            Simpan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Hapus Menu</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        Yakin ingin menghapus menu{' '}
                        <strong>"{deleteConfirm?.nama_menu}"</strong>
                        {(deleteConfirm?.children?.length ?? 0) > 0
                            ? ` dan ${deleteConfirm?.children?.length} sub menu?`
                            : '?'}
                    </p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteConfirm(null)} disabled={deleting}>
                            Batal
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
                            {deleting && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                            Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
