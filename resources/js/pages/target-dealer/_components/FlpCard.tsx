import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { ChevronDown, Edit, Trash2 } from 'lucide-react';

import type { FlpData, TargetItem } from '../types';

interface FlpCardProps {
    flp: FlpData;
    isOpen: boolean;
    isKacab: boolean;
    onToggle: () => void;
    onEdit: (item: TargetItem) => void;
    onDelete: (id: number) => void;
}

export function FlpCard({ flp, isOpen, isKacab, onToggle, onEdit, onDelete }: FlpCardProps) {
    return (
        <Collapsible open={isOpen} onOpenChange={onToggle}>
            <Card>
                <CollapsibleTrigger asChild>
                    <div className="hover:bg-muted/50 flex cursor-pointer items-center justify-between px-4 py-3 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-red-500" />
                            <div>
                                <p className="text-sm font-semibold">
                                    {flp.nama_flp}{' '}
                                    <span className="text-muted-foreground font-normal">
                                        ({flp.id_flp})
                                    </span>
                                </p>
                                <div className="mt-0.5 flex items-center gap-2">
                                    <Badge
                                        variant={
                                            flp.is_active === 'Aktif'
                                                ? 'default'
                                                : 'secondary'
                                        }
                                        className="text-[10px]"
                                    >
                                        {flp.is_active}
                                    </Badge>
                                    <span className="text-muted-foreground text-xs">
                                        Target:{' '}
                                        <strong>
                                            {flp.total_target.toLocaleString('id-ID')}
                                        </strong>
                                    </span>
                                </div>
                            </div>
                        </div>
                        <ChevronDown
                            className={`text-muted-foreground h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        />
                    </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <div className="px-4 pb-3">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12 text-center">No</TableHead>
                                    <TableHead>Series</TableHead>
                                    <TableHead>Periode</TableHead>
                                    <TableHead className="text-right">Target</TableHead>
                                    {isKacab && (
                                        <TableHead className="text-center">Aksi</TableHead>
                                    )}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {flp.targets.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={isKacab ? 5 : 4}
                                            className="text-muted-foreground h-16 text-center text-xs italic"
                                        >
                                            Belum ada target
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    flp.targets.map((t, i) => (
                                        <TableRow key={t.id}>
                                            <TableCell className="text-center">{i + 1}</TableCell>
                                            <TableCell>{t.series}</TableCell>
                                            <TableCell>{t.bulan_tahun}</TableCell>
                                            <TableCell className="text-right font-medium">
                                                {t.target?.toLocaleString('id-ID') ?? '-'}
                                            </TableCell>
                                            {isKacab && (
                                                <TableCell className="text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-7 w-7 p-0"
                                                            onClick={() => onEdit(t)}
                                                        >
                                                            <Edit className="h-3 w-3" />
                                                        </Button>
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            className="h-7 w-7 p-0"
                                                            onClick={() => onDelete(t.id)}
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    );
}
