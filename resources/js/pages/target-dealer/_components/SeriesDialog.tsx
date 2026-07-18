import {
    Dialog,
    DialogContent,
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

import type { SeriesBreakdown } from '../types';
import { getSisaColor } from '../types';

interface SeriesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    breakdown: SeriesBreakdown[];
}

export function SeriesDialog({ open, onOpenChange, breakdown }: SeriesDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Kuota Target per Series</DialogTitle>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Series</TableHead>
                            <TableHead className="text-center">Target Dealer</TableHead>
                            <TableHead className="text-center">Terbagi ke FLP</TableHead>
                            <TableHead className="text-center">Sisa</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {breakdown.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-muted-foreground h-16 text-center">
                                    Tidak ada data
                                </TableCell>
                            </TableRow>
                        ) : (
                            breakdown.map((s) => (
                                <TableRow key={s.series}>
                                    <TableCell className="font-semibold">{s.series}</TableCell>
                                    <TableCell className="text-center">
                                        {s.target_dealer.toLocaleString('id-ID')}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {s.terbagi.toLocaleString('id-ID')}
                                    </TableCell>
                                    <TableCell
                                        className={`text-center font-bold ${getSisaColor(s.sisa, s.target_dealer)}`}
                                    >
                                        {s.sisa.toLocaleString('id-ID')}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
                </div>
            </DialogContent>
        </Dialog>
    );
}
