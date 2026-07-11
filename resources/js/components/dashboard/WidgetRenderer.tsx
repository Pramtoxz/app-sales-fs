import StatCard from '@/components/dashboard/widgets/StatCard';
import type { ComponentType } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const COMPONENT_MAP: Record<string, ComponentType<any>> = {
    StatCard,
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

    return <Component data={data} config={config} />;
}
