import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

const SKIP_KEYS = ['foto', 'id_flp'];

function formatCell(value: unknown): string {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'number') return value.toLocaleString('id-ID');
    return String(value);
}

function toTitle(key: string): string {
    return key
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

interface TableWidgetProps {
    data: Array<Record<string, unknown>>;
    config: { title?: string };
}

export default function TableWidget({ data, config }: TableWidgetProps) {
    if (!data || !data.length) return null;

    const columns = Object.keys(data[0]).filter((k) => !SKIP_KEYS.includes(k));

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
                            {columns.map((col) => (
                                <TableHead key={col}>{toTitle(col)}</TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((row, idx) => (
                            <TableRow key={idx}>
                                {columns.map((col) => (
                                    <TableCell key={col}>
                                        {formatCell(row[col])}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
