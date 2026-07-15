import AppLayout from '@/layouts/app-layout';
import WidgetRenderer from '@/components/dashboard/WidgetRenderer';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';

interface Widget {
    id: number;
    widget_type: string;
    component: string;
    data_source: string;
    endpoint: string;
    title: string;
    config: Record<string, unknown>;
    pos_x: number;
    pos_y: number;
    width: number;
    height: number;
}

interface Props {
    widgets?: Widget[];
    isKacab: boolean;
    isMd: boolean;
    isIt: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
];

export default function Dashboard({ widgets: rawWidgets, isKacab }: Props) {
    const widgets = Array.isArray(rawWidgets) ? rawWidgets : [];
    const [widgetData, setWidgetData] = useState<Record<number, unknown>>({});
    const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set());

    useEffect(() => {
        if (!widgets || widgets.length === 0) return;

        setLoadingIds(new Set(widgets.map((w) => w.id)));

        const fetchAll = widgets.map(async (widget) => {
            try {
                const params = new URLSearchParams();
                if (!isKacab && widget.config?.kode_dealer) {
                    params.append('kode_dealer', String(widget.config.kode_dealer));
                }
                Object.entries(widget.config ?? {}).forEach(([key, value]) => {
                    if (key !== 'kode_dealer' && value !== undefined && value !== null) {
                        params.append(key, String(value));
                    }
                });

                const url = params.toString()
                    ? `${widget.endpoint}?${params.toString()}`
                    : widget.endpoint;

                const res = await fetch(url, {
                    headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                    credentials: 'same-origin',
                });

                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();

                return { id: widget.id, data };
            } catch {
                return { id: widget.id, data: null };
            }
        });

        Promise.all(fetchAll).then((results) => {
            setWidgetData((prev) => {
                const next = { ...prev };
                for (const r of results) {
                    next[r.id] = r.data;
                }
                return next;
            });
            setLoadingIds(new Set());
        });
    }, [widgets, isKacab]);

    const getSpanClass = (w: number) => {
        if (w >= 12) return 'col-span-12';
        if (w >= 8) return 'col-span-12 lg:col-span-8';
        if (w >= 6) return 'col-span-12 lg:col-span-6';
        if (w >= 4) return 'col-span-12 lg:col-span-4';
        return 'col-span-12 lg:col-span-6';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {widgets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                        <p className="text-lg font-medium">Belum ada widget</p>
                        <p className="text-sm">Buka Kelola Dashboard untuk mengatur widget</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-12 gap-4">
                        {widgets.map((widget) => (
                            <div
                                key={String(widget.id)}
                                className={`${getSpanClass(widget.width)} rounded-lg border bg-card shadow-sm overflow-hidden`}
                                style={{ minHeight: (widget.height ?? 4) * 50 }}
                            >
                                <div className="border-b px-4 py-2">
                                    <h3 className="text-sm font-semibold">{widget.title}</h3>
                                </div>
                                <div className="p-4 h-[calc(100%-40px)] overflow-auto">
                                    <WidgetRenderer
                                        component={widget.component}
                                        data={widgetData[widget.id]}
                                        config={widget.config ?? {}}
                                        loading={loadingIds.has(widget.id)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
