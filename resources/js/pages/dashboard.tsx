import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
    Users,
    Target,
    ShoppingCart,
    TrendingUp,
    MessageSquare,
    Handshake,
    Package,
    Trophy,
    BarChart3,
    Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    Cell,
} from 'recharts';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: '/dashboard' }];

const DISTINCT_COLORS = [
    '#2563eb', '#16a34a', '#dc2626', '#f59e0b', '#7c3aed',
    '#0891b2', '#db2777', '#ea580c', '#4f46e5', '#059669',
    '#be185d', '#0d9488', '#6d28d9', '#ca8a04', '#e11d48',
    '#0284c7', '#9333ea', '#b45309', '#047857', '#7e22ce',
];

interface Stats {
    total_dealers?: number;
    total_flp: number;
    total_target: number;
    total_terjual: number;
    persentase: number;
    total_prospek: number;
    deal_prospek?: number;
}

interface DealerPerf {
    dealer: string;
    kode_dealer: string;
    target: number;
    terjual: number;
    persentase: number;
}

interface FlpPerf {
    id_flp: string;
    nama: string;
    total_target: number;
    total_terjual: number;
    persentase: number;
}

interface StockItem {
    tipe: string;
    categori: string;
    jumlah: number;
}

interface DashboardData {
    stats: Stats;
    dealer_performance?: DealerPerf[];
    top_dealers?: DealerPerf[];
    flp_performance?: FlpPerf[];
    stock_data?: StockItem[];
    dealer_name?: string;
    kode_dealer?: string;
}

interface Props {
    isKacab: boolean;
    isMd: boolean;
    isIt: boolean;
    fkDealer: string | null;
}

function truncate(str: string, max: number): string {
    return str.length > max ? str.substring(0, max) + '...' : str;
}

function StatCard({
    icon: Icon,
    label,
    value,
    sub,
    color,
    badge,
}: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    sub?: React.ReactNode;
    color: string;
    badge?: { text: string; variant: 'default' | 'destructive' | 'outline' | 'secondary' };
}) {
    return (
        <Card className="relative overflow-hidden">
            <CardContent className="p-4">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</p>
                        <div className="flex items-center gap-2">
                            <p className="text-2xl font-bold tabular-nums">{value}</p>
                            {badge && <Badge variant={badge.variant} className="text-[10px]">{badge.text}</Badge>}
                        </div>
                        {sub && <p className="text-muted-foreground text-xs">{sub}</p>}
                    </div>
                    <div className={`rounded-lg p-2 ${color}`}>
                        <Icon className="h-4 w-4 text-white" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default function Dashboard({ isKacab }: Props) {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [bulan, setBulan] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/dashboard/data?bulan_tahun=${bulan}`, {
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'same-origin',
            });
            const json = await res.json();
            if (json.success) {
                setData(json.data);
            } else {
                toast.error(json.message || 'Gagal memuat data');
            }
        } catch {
            toast.error('Gagal memuat data dashboard');
        } finally {
            setLoading(false);
        }
    }, [bulan]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const bulanLabel = useMemo(() => {
        try {
            return new Date(bulan + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
        } catch {
            return bulan;
        }
    }, [bulan]);

    if (loading || !data) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Dashboard" />
                <div className="flex h-[60vh] items-center justify-center">
                    <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
                </div>
            </AppLayout>
        );
    }

    const { stats } = data;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {isKacab && data.dealer_name ? data.dealer_name : 'Seluruh Dealer'}
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            {isKacab ? 'Performa dealer dan tim FLP Anda' : 'Ringkasan performa seluruh dealer'}
                        </p>
                    </div>
                    <Input type="month" value={bulan} onChange={(e) => setBulan(e.target.value)} className="w-40" />
                </div>

                {isKacab ? <KacabStats stats={stats} /> : <AdminStats stats={stats} bulanLabel={bulanLabel} />}
                {isKacab ? <KacabCharts data={data} /> : <AdminCharts data={data} bulanLabel={bulanLabel} />}
            </div>
        </AppLayout>
    );
}

function ProspekSub({ total, deal }: { total: number; deal: number }) {
    const rate = total > 0 ? ((deal / total) * 100).toFixed(1) : '0';
    return (
        <span className="text-muted-foreground text-xs">
            {deal} deal &middot; <span className="font-medium text-foreground">{rate}% konversi</span>
        </span>
    );
}

function AdminStats({ stats, bulanLabel }: { stats: Stats; bulanLabel: string }) {
    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard icon={Users} label="Total Dealer" value={stats.total_dealers ?? 0} color="bg-blue-600" />
            <StatCard icon={Users} label="Total FLP" value={stats.total_flp} color="bg-violet-600" />
            <StatCard icon={Target} label="Target" value={stats.total_target.toLocaleString('id-ID')} sub={bulanLabel} color="bg-amber-500" />
            <StatCard icon={ShoppingCart} label="Terjual" value={stats.total_terjual.toLocaleString('id-ID')} sub={bulanLabel} color="bg-green-600" />
            <StatCard
                icon={TrendingUp}
                label="Capai"
                value={`${stats.persentase}%`}
                sub={stats.total_target > 0 ? `${stats.total_terjual} dari ${stats.total_target} unit` : 'Belum ada target'}
                color={stats.persentase >= 100 ? 'bg-green-600' : stats.persentase >= 50 ? 'bg-amber-500' : 'bg-red-500'}
                badge={stats.persentase > 100 ? { text: 'Melebihi target', variant: 'outline' } : undefined}
            />
            <StatCard
                icon={MessageSquare}
                label="Prospek"
                value={stats.total_prospek.toLocaleString('id-ID')}
                sub={<ProspekSub total={stats.total_prospek} deal={stats.deal_prospek ?? 0} />}
                color="bg-cyan-600"
            />
        </div>
    );
}

function KacabStats({ stats }: { stats: Stats }) {
    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard icon={Users} label="FLP Aktif" value={stats.total_flp} color="bg-violet-600" />
            <StatCard icon={Target} label="Target" value={stats.total_target.toLocaleString('id-ID')} color="bg-amber-500" />
            <StatCard icon={ShoppingCart} label="Terjual" value={stats.total_terjual.toLocaleString('id-ID')} color="bg-green-600" />
            <StatCard
                icon={TrendingUp}
                label="Capai"
                value={`${stats.persentase}%`}
                sub={stats.total_target > 0 ? `${stats.total_terjual} dari ${stats.total_target} unit` : 'Belum ada target'}
                color={stats.persentase >= 100 ? 'bg-green-600' : stats.persentase >= 50 ? 'bg-amber-500' : 'bg-red-500'}
                badge={stats.persentase > 100 ? { text: 'Melebihi target', variant: 'outline' } : undefined}
            />
            <StatCard
                icon={Handshake}
                label="Prospek"
                value={stats.total_prospek.toLocaleString('id-ID')}
                sub={<ProspekSub total={stats.total_prospek} deal={stats.deal_prospek ?? 0} />}
                color="bg-cyan-600"
            />
        </div>
    );
}

function AdminCharts({ data, bulanLabel }: { data: DashboardData; bulanLabel: string }) {
    const dealerPerf = data.dealer_performance ?? [];
    const topDealers = data.top_dealers ?? [];

    const chartData = dealerPerf
        .filter((d) => d.target > 0 || d.terjual > 0)
        .slice(0, 10)
        .map((d) => ({
            nama: truncate(d.dealer, 12),
            Target: d.target,
            Terjual: d.terjual,
        }));

    return (
        <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                        <BarChart3 className="text-muted-foreground h-4 w-4" />
                        <CardTitle className="text-sm font-semibold">Target vs Terjual per Dealer</CardTitle>
                    </div>
                    <p className="text-muted-foreground text-xs">{bulanLabel} &middot; Top 10 dealer</p>
                </CardHeader>
                <CardContent>
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={320}>
                            <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 50 }}>
                                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                <XAxis dataKey="nama" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" interval={0} height={60} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', fontSize: 12 }}
                                    formatter={(value: number) => value.toLocaleString('id-ID')}
                                />
                                <Legend wrapperStyle={{ fontSize: 12 }} />
                                <Bar dataKey="Target" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Terjual" fill="#2563eb" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyState icon={BarChart3} message="Belum ada data dealer" />
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-amber-500" />
                        <CardTitle className="text-sm font-semibold">Top 5 Dealer</CardTitle>
                    </div>
                    <p className="text-muted-foreground text-xs">Berdasarkan % pencapaian</p>
                </CardHeader>
                <CardContent>
                    {topDealers.length > 0 ? (
                        <div className="space-y-3">
                            {topDealers.map((d, i) => (
                                <div key={d.kode_dealer} className="flex items-center gap-3">
                                    <div
                                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                                            i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-700' : 'bg-muted-foreground'
                                        }`}
                                    >
                                        {i + 1}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between">
                                            <p className="truncate text-sm font-medium">{d.dealer}</p>
                                            <span className="text-muted-foreground ml-2 shrink-0 text-xs tabular-nums">
                                                {d.target > 0 ? `${d.terjual}/${d.target}` : `${d.terjual} unit`}
                                            </span>
                                        </div>
                                        <div className="mt-1 flex items-center gap-2">
                                            <div className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
                                                <div
                                                    className="h-full rounded-full transition-all"
                                                    style={{
                                                        width: `${Math.min(d.persentase, 100)}%`,
                                                        backgroundColor: d.persentase >= 100 ? '#16a34a' : d.persentase >= 50 ? '#f59e0b' : '#ef4444',
                                                    }}
                                                />
                                            </div>
                                            <span className={`w-12 text-right text-xs font-medium tabular-nums ${
                                                d.persentase >= 100 ? 'text-green-600' : d.persentase >= 50 ? 'text-amber-600' : 'text-red-600'
                                            }`}>
                                                {d.persentase}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState icon={Trophy} message="Belum ada data" />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function KacabCharts({ data }: { data: DashboardData }) {
    const flpPerf = data.flp_performance ?? [];
    const stockData = data.stock_data ?? [];

    const flpChartData = flpPerf
        .sort((a, b) => Number(b.persentase) - Number(a.persentase))
        .slice(0, 10)
        .map((f) => ({
            nama: truncate(f.nama ?? 'FLP ' + f.id_flp, 14),
            Target: Number(f.total_target),
            Terjual: Number(f.total_terjual),
            persentase: Number(f.persentase),
        }));

    const stockChart = stockData
        .slice(0, 12)
        .map((s) => ({
            tipe: truncate(s.tipe, 18),
            jumlah: Number(s.jumlah),
        }));

    const flpHeight = Math.max(240, flpChartData.length * 44);
    const stockHeight = Math.max(240, stockChart.length * 36);

    return (
        <div className="grid gap-4 lg:grid-cols-2">
            <Card>
                <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                        <Users className="text-muted-foreground h-4 w-4" />
                        <CardTitle className="text-sm font-semibold">Performa FLP</CardTitle>
                    </div>
                    <p className="text-muted-foreground text-xs">
                        Top {Math.min(flpPerf.length, 10)} dari {flpPerf.length} FLP &middot; Target vs terjual
                    </p>
                </CardHeader>
                <CardContent>
                    {flpChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={flpHeight}>
                            <BarChart data={flpChartData} layout="vertical" margin={{ top: 5, right: 50, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                <XAxis type="number" tick={{ fontSize: 11 }} />
                                <YAxis type="category" dataKey="nama" width={110} tick={{ fontSize: 11 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', fontSize: 12 }}
                                    formatter={(value: number, name: string) => [value.toLocaleString('id-ID'), name]}
                                />
                                <Legend wrapperStyle={{ fontSize: 12 }} />
                                <Bar dataKey="Target" fill="#94a3b8" radius={[0, 4, 4, 0]} barSize={16} />
                                <Bar dataKey="Terjual" fill="#2563eb" radius={[0, 4, 4, 0]} barSize={16} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyState icon={Users} message="Belum ada data FLP" />
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                        <Package className="text-muted-foreground h-4 w-4" />
                        <CardTitle className="text-sm font-semibold">Stok Unit</CardTitle>
                    </div>
                    <p className="text-muted-foreground text-xs">
                        {stockData.reduce((s, d) => s + Number(d.jumlah), 0)} unit RFS &middot; {stockData.length} tipe
                    </p>
                </CardHeader>
                <CardContent>
                    {stockChart.length > 0 ? (
                        <ResponsiveContainer width="100%" height={stockHeight}>
                            <BarChart data={stockChart} layout="vertical" margin={{ top: 5, right: 40, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                                <YAxis type="category" dataKey="tipe" width={130} tick={{ fontSize: 10 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', fontSize: 12 }}
                                    formatter={(value: number) => [`${value} unit`, 'Jumlah']}
                                    labelFormatter={(label) => label}
                                />
                                <Bar dataKey="jumlah" radius={[0, 4, 4, 0]} barSize={18}>
                                    {stockChart.map((_, i) => (
                                        <Cell key={i} fill={DISTINCT_COLORS[i % DISTINCT_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyState icon={Package} message="Belum ada data stok" />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Icon className="mb-2 h-8 w-8 opacity-40" />
            <p className="text-sm">{message}</p>
        </div>
    );
}
