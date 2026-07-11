import BarChartWidget from '@/components/dashboard/widgets/BarChartWidget';
import LeaderboardWidget from '@/components/dashboard/widgets/LeaderboardWidget';
import LineChartWidget from '@/components/dashboard/widgets/LineChartWidget';
import PieChartWidget from '@/components/dashboard/widgets/PieChartWidget';
import ProgressWidget from '@/components/dashboard/widgets/ProgressWidget';
import StatCard from '@/components/dashboard/widgets/StatCard';
import TableWidget from '@/components/dashboard/widgets/TableWidget';
import type { ComponentType } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const COMPONENT_MAP: Record<string, ComponentType<any>> = {
    StatCard,
    BarChartWidget,
    PieChartWidget,
    LineChartWidget,
    LeaderboardWidget,
    ProgressWidget,
    TableWidget,
};

interface WidgetRendererProps {
    component: string;
    data: unknown;
    config: Record<string, unknown>;
    loading?: boolean;
}

export default function WidgetRenderer({ component, data, config, loading }: WidgetRendererProps) {
    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
            </div>
        );
    }

    const Component = COMPONENT_MAP[component];

    if (!Component) {
        return (
            <div className="flex h-full items-center justify-center text-muted-foreground">
                Komponen "{component}" tidak ditemukan
            </div>
        );
    }

    return <Component data={data} config={config ?? {}} />;
}
