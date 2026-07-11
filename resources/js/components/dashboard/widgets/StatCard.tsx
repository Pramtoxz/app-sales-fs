import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const LABEL_MAP: Record<string, string> = {
    total_flp: 'Total FLP',
    total_target: 'Target',
    total_terjual: 'Terjual',
    persentase: 'Capai %',
    total_prospek: 'Prospek',
    total_dealer: 'Dealer',
};

function formatValue(value: number | string): string {
    if (typeof value === 'number') {
        return value.toLocaleString('id-ID');
    }
    return String(value);
}

interface StatCardProps {
    data: Record<string, number | string>;
    config: { title?: string };
}

export default function StatCard({ data, config }: StatCardProps) {
    return (
        <div className="space-y-4">
            {config.title && <h3 className="text-lg font-semibold">{config.title}</h3>}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                {Object.entries(data).map(([key, value]) => (
                    <Card key={key}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-muted-foreground text-sm font-medium">
                                {LABEL_MAP[key] ?? key}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatValue(value)}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
