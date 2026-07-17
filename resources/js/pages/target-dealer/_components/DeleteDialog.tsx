import { useState } from 'react';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

import { csrfToken } from '../types';
import { toast } from 'sonner';

interface DeleteDialogProps {
    targetId: number | null;
    onClose: () => void;
    onDeleted: () => void;
}

export function DeleteDialog({ targetId, onClose, onDeleted }: DeleteDialogProps) {
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        if (!targetId) return;

        setDeleting(true);
        try {
            const res = await fetch(`/target-dealer/flp/${targetId}/delete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                },
            });
            const json = await res.json();
            if (json.success) {
                toast.success('Data berhasil dihapus');
                onClose();
                onDeleted();
            } else {
                toast.error('Gagal menghapus data');
            }
        } catch {
            toast.error('Gagal menghapus data');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <Dialog open={targetId !== null} onOpenChange={() => onClose()}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>Hapus Target</DialogTitle>
                </DialogHeader>
                <p className="text-muted-foreground text-sm">
                    Yakin ingin menghapus target ini?
                </p>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={deleting}>
                        Batal
                    </Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                        {deleting && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                        Hapus
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
