import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface LeaderboardItem {
    rank?: number;
    id_flp?: string;
    nama?: string;
    foto?: string | null;
    total_target?: number;
    total_terjual?: number;
    persentase?: number;
}

interface LeaderboardWidgetProps {
    data: LeaderboardItem[];
    config: { title?: string };
}

function rankBadge(rank: number) {
    if (rank === 1) return 'bg-yellow-500 text-white';
    if (rank === 2) return 'bg-gray-400 text-white';
    if (rank === 3) return 'bg-amber-700 text-white';
    return 'bg-muted text-muted-foreground';
}

function percentColor(pct: number) {
    if (pct >= 100) return 'bg-green-100 text-green-800';
    if (pct >= 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
}

export default function LeaderboardWidget({ data, config }: LeaderboardWidgetProps) {
    if (!data || data.length === 0) {
        return (
            <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                Tidak ada data
            </div>
        );
    }

    return (
        <Card>
            {config.title && (
                <CardHeader>
                    <CardTitle>{config.title}</CardTitle>
                </CardHeader>
            )}
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-16">Rank</TableHead>
                            <TableHead>Nama</TableHead>
                            <TableHead className="text-right">Target</TableHead>
                            <TableHead className="text-right">Terjual</TableHead>
                            <TableHead className="text-right">%</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((item, idx) => {
                            const rank = item.rank ?? idx + 1;
                            const pct = item.persentase ?? 0;
                            return (
                                <TableRow key={item.id_flp ?? idx}>
                                    <TableCell>
                                        <span
                                            className={`inline-flex size-7 items-center justify-center rounded-full text-xs font-bold ${rankBadge(rank)}`}
                                        >
                                            {rank}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Avatar className="size-8">
                                                <AvatarImage src={item.foto ?? undefined} />
                                                <AvatarFallback>
                                                    {item.nama?.charAt(0) ?? '?'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span>{item.nama ?? '-'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {(item.total_target ?? 0).toLocaleString('id-ID')}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {(item.total_terjual ?? 0).toLocaleString('id-ID')}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Badge className={percentColor(pct)}>
                                            {pct.toLocaleString('id-ID')}%
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
