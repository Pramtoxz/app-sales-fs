import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProgressItem {
    tipe?: string;
    nama?: string;
    target?: number;
    terjual?: number;
    persentase?: number;
    jumlah?: number;
}

interface ProgressWidgetProps {
    data: ProgressItem[];
    config: { title?: string };
}

function getLabelKey(data: ProgressItem[]): keyof ProgressItem {
    if (data.length === 0) return 'nama';
    const keys = Object.keys(data[0]);
    const strKey = keys.find((k) => typeof data[0][k as keyof ProgressItem] === 'string');
    return (strKey as keyof ProgressItem) ?? 'nama';
}

function getValueKey(data: ProgressItem[]): keyof ProgressItem {
    if (data.length === 0) return 'persentase';
    if ('persentase' in data[0]) return 'persentase';
    const keys = Object.keys(data[0]);
    const numKey = keys.find((k) => typeof data[0][k as keyof ProgressItem] === 'number');
    return (numKey as keyof ProgressItem) ?? 'persentase';
}

function progressColor(pct: number) {
    if (pct >= 100) return 'bg-green-500';
    if (pct >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
}

export default function ProgressWidget({ data, config }: ProgressWidgetProps) {
    const labelKey = getLabelKey(data);
    const valueKey = getValueKey(data);

    return (
        <Card>
            {config.title && (
                <CardHeader>
                    <CardTitle>{config.title}</CardTitle>
                </CardHeader>
            )}
            <CardContent className="space-y-4">
                {data.map((item, idx) => {
                    const label = String(item[labelKey] ?? '-');
                    const value = Number(item[valueKey] ?? 0);
                    const clamped = Math.min(Math.max(value, 0), 100);

                    return (
                        <div key={idx} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">{label}</span>
                                <span className="text-muted-foreground">
                                    {value.toLocaleString('id-ID')}%
                                </span>
                            </div>
                            <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                                <div
                                    className={`h-full rounded-full transition-all ${progressColor(value)}`}
                                    style={{ width: `${clamped}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}
