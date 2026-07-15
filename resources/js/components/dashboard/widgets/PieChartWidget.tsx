import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Label,
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

interface PieChartWidgetProps {
    data: Array<Record<string, unknown>>;
    config: {
        title?: string;
        colors?: string[];
        show_legend?: boolean;
        show_label?: boolean;
    };
}

export default function PieChartWidget({ data, config }: PieChartWidgetProps) {
    if (!data || !data.length) return null;

    const keys = Object.keys(data[0]);
    const nameKey = keys.find((k) => typeof data[0][k] === 'string') ?? keys[0];
    const dataKey = keys.find((k) => k !== nameKey && typeof data[0][k] === 'number') ?? keys[1];
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
                    <PieChart>
                        <Pie
                            data={data}
                            dataKey={dataKey}
                            nameKey={nameKey}
                            cx="50%"
                            cy="50%"
                            outerRadius={120}
                            label={config.show_label}
                        >
                            {data.map((_, index) => (
                                <Cell key={index} fill={colors[index % colors.length]} />
                            ))}
                            {config.show_label && (
                                <Label
                                    position="inside"
                                    fill="#fff"
                                    fontSize={14}
                                />
                            )}
                        </Pie>
                        <Tooltip />
                        {config.show_legend !== false && <Legend />}
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
