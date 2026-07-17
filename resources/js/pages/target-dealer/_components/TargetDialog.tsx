import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
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

import type { FlpData, SeriesBreakdown } from '../types';
import { csrfToken, getSisaColor } from '../types';

interface TargetDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingId: number | null;
    initialFlp: string;
    initialSeries: string;
    initialTarget: string;
    bulanTahun: string;
    kodeDealer: string;
    flpList: FlpData[];
    seriesList: string[];
    seriesBreakdown: SeriesBreakdown[];
    onSaved: () => void;
}

export function TargetDialog({
    open,
    onOpenChange,
    editingId,
    initialFlp,
    initialSeries,
    initialTarget,
    bulanTahun,
    kodeDealer,
    flpList,
    seriesList,
    seriesBreakdown,
    onSaved,
}: TargetDialogProps) {
    const [formFlp, setFormFlp] = useState(initialFlp);
    const [formSeries, setFormSeries] = useState(initialSeries);
    const [formTarget, setFormTarget] = useState(initialTarget);
    const [saving, setSaving] = useState(false);

    const getSeriesSisaInfo = () => {
        if (!formSeries) return null;
        const found = seriesBreakdown.find((s) => s.series === formSeries);
        if (!found) return null;

        let targetLama = 0;
        if (editingId) {
            for (const flp of flpList) {
                const t = flp.targets.find((t) => t.id === editingId);
                if (t) {
                    targetLama = t.target;
                    break;
                }
            }
        }

        const kuota = found.sisa + targetLama;
        return { ...found, kuota };
    };

    const seriesInfo = getSeriesSisaInfo();

    const handleSave = async () => {
        if (!formFlp) {
            toast.warning('Pilih FLP');
            return;
        }
        if (!formSeries) {
            toast.warning('Pilih series');
            return;
        }
        if (!formTarget || parseInt(formTarget) < 1) {
            toast.warning('Target harus lebih dari 0');
            return;
        }

        const seriesData = seriesBreakdown.find((s) => s.series === formSeries);

        let targetLama = 0;
        if (editingId) {
            for (const flp of flpList) {
                const found = flp.targets.find((t) => t.id === editingId);
                if (found) {
                    targetLama = found.target;
                    break;
                }
            }
        }

        if (seriesData) {
            const kuota = seriesData.sisa + targetLama;
            if (parseInt(formTarget) > kuota) {
                toast.error(
                    `Target ${formSeries} tidak boleh melebihi sisa kuota (${kuota.toLocaleString('id-ID')})`,
                );
                return;
            }
        }

        setSaving(true);
        try {
            const res = await fetch('/target-dealer/flp/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                },
                body: JSON.stringify({
                    id: editingId,
                    id_flp: formFlp,
                    series: formSeries,
                    bulan_tahun: bulanTahun,
                    target: parseInt(formTarget),
                    fk_dealer: kodeDealer,
                }),
            });
            const json = await res.json();
            if (json.success) {
                toast.success('Data berhasil disimpan');
                onOpenChange(false);
                onSaved();
            } else {
                toast.error(json.message || 'Gagal menyimpan data');
            }
        } catch {
            toast.error('Gagal menyimpan data');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {editingId ? 'Edit Target FLP' : 'Tambah Target FLP'}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-1">
                        <Label>
                            FLP <span className="text-red-500">*</span>
                        </Label>
                        <Select
                            value={formFlp}
                            onValueChange={setFormFlp}
                            disabled={!!editingId}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="-- Pilih FLP --" />
                            </SelectTrigger>
                            <SelectContent>
                                {flpList.map((flp) => (
                                    <SelectItem key={flp.id_flp} value={flp.id_flp}>
                                        {flp.nama_flp} ({flp.id_flp})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label>
                            Series <span className="text-red-500">*</span>
                        </Label>
                        <Select
                            value={formSeries}
                            onValueChange={setFormSeries}
                            disabled={!!editingId}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="-- Pilih Series --" />
                            </SelectTrigger>
                            <SelectContent>
                                {seriesList.map((s) => (
                                    <SelectItem key={s} value={s}>
                                        {s}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {seriesInfo && (
                            <p
                                className={`text-xs font-semibold ${getSisaColor(seriesInfo.kuota, seriesInfo.target_dealer)}`}
                            >
                                Sisa kuota: {seriesInfo.kuota.toLocaleString('id-ID')} unit
                            </p>
                        )}
                    </div>
                    <div className="space-y-1">
                        <Label>Periode</Label>
                        <Input value={bulanTahun} readOnly className="bg-muted" />
                    </div>
                    <div className="space-y-1">
                        <Label>
                            Target <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            type="number"
                            min={1}
                            value={formTarget}
                            onChange={(e) => setFormTarget(e.target.value)}
                            placeholder="Jumlah target"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Batal
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                        Simpan
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
