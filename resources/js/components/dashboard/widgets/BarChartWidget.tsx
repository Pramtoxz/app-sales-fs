import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell,
} from 'recharts';

const DEFAULT_COLORS = [
    '#2563eb',
    '#16a34a',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#ec4899',
    '#06b6d4',
    '#f97316',
];

const SKIP_KEYS = ['id_flp', 'foto', 'kode_dealer'];

function isSkippedKey(key: string): boolean {
    return key.startsWith('_') || SKIP_KEYS.includes(key);
}

interface BarChartWidgetProps {
    data: Array<Record<string, unknown>>;
    config: {
        title?: string;
        colors?: string[];
        show_legend?: boolean;
        show_label?: boolean;
    };
}

export default function BarChartWidget({ data, config }: BarChartWidgetProps) {
    if (!data || !data.length) return null;

    const keys = Object.keys(data[0]).filter((k) => !isSkippedKey(k));
    const xKey = keys.find((k) => typeof data[0][k] === 'string') ?? keys[0];
    const barKeys = keys.filter((k) => k !== xKey && typeof data[0][k] === 'number');
    const colors = config.colors ?? DEFAULT_COLORS;

    return (
        <Card>
            {config.title && (
                <CardHeader>
                    <CardTitle>{config.title}</CardTitle>
                </CardHeader>
            )}
            <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey={xKey} />
                        <YAxis />
                        <Tooltip />
                        {config.show_legend !== false && <Legend />}
                        {barKeys.map((key, i) => (
                            <Bar key={key} dataKey={key} fill={colors[i % colors.length]}>
                                {data.map((_, idx) => (
                                    <Cell
                                        key={idx}
                                        fill={colors[(i + idx) % colors.length]}
                                    />
                                ))}
                            </Bar>
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
