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
    PieChart as PieChartIcon,
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
    PieChart,
    Pie,
    Cell,
    Legend,
} from 'recharts';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: '/dashboard' }];

const CHART_COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

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

function StatCard({
    icon: Icon,
    label,
    value,
    sub,
    color,
}: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    sub?: string;
    color: string;
}) {
    return (
        <Card className="relative overflow-hidden">
            <CardContent className="p-4">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</p>
                        <p className="text-2xl font-bold tabular-nums">{value}</p>
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

function ProgressRing({ percentage, size = 64, stroke = 6 }: { percentage: number; size?: number; stroke?: number }) {
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (Math.min(percentage, 100) / 100) * circumference;
    const color = percentage >= 100 ? '#16a34a' : percentage >= 50 ? '#f59e0b' : '#ef4444';

    return (
        <svg width={size} height={size} className="rotate-[-90deg]">
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-muted" />
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth={stroke}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
            />
        </svg>
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
                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {isKacab && data.dealer_name ? data.dealer_name : 'Seluruh Dealer'}
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            {isKacab ? 'Performa dealer dan tim FLP Anda' : 'Ringkasan performa seluruh dealer'}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Input
                            type="month"
                            value={bulan}
                            onChange={(e) => setBulan(e.target.value)}
                            className="w-40"
                        />
                    </div>
                </div>

                {/* Stats Grid */}
                {isKacab ? (
                    <KacabStats stats={stats} />
                ) : (
                    <AdminStats stats={stats} bulanLabel={bulanLabel} />
                )}

                {/* Charts */}
                {isKacab ? (
                    <KacabCharts data={data} />
                ) : (
                    <AdminCharts data={data} bulanLabel={bulanLabel} />
                )}
            </div>
        </AppLayout>
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
                sub={stats.persentase >= 100 ? 'Tercapai!' : 'Dalam proses'}
                color={stats.persentase >= 100 ? 'bg-green-600' : stats.persentase >= 50 ? 'bg-amber-500' : 'bg-red-500'}
            />
            <StatCard icon={MessageSquare} label="Prospek" value={stats.total_prospek} sub={`${stats.deal_prospek ?? 0} deal`} color="bg-cyan-600" />
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
                sub={stats.persentase >= 100 ? 'Tercapai!' : 'Dalam proses'}
                color={stats.persentase >= 100 ? 'bg-green-600' : stats.persentase >= 50 ? 'bg-amber-500' : 'bg-red-500'}
            />
            <StatCard icon={Handshake} label="Prospek" value={stats.total_prospek} sub={`${stats.deal_prospek ?? 0} deal`} color="bg-cyan-600" />
        </div>
    );
}

function AdminCharts({ data, bulanLabel }: { data: DashboardData; bulanLabel: string }) {
    const dealerPerf = data.dealer_performance ?? [];
    const topDealers = data.top_dealers ?? [];

    const chartData = dealerPerf
        .filter((d) => d.target > 0)
        .slice(0, 15)
        .map((d) => ({
            nama: d.dealer.length > 15 ? d.dealer.substring(0, 15) + '...' : d.dealer,
            Target: d.target,
            Terjual: d.terjual,
        }));

    return (
        <div className="grid gap-4 lg:grid-cols-3">
            {/* Bar Chart */}
            <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                        <BarChart3 className="text-muted-foreground h-4 w-4" />
                        <CardTitle className="text-sm font-semibold">Target vs Terjual per Dealer</CardTitle>
                    </div>
                    <p className="text-muted-foreground text-xs">{bulanLabel}</p>
                </CardHeader>
                <CardContent>
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={320}>
                            <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 60 }}>
                                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                <XAxis dataKey="nama" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" interval={0} />
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

            {/* Top Dealers */}
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
                                        <p className="truncate text-sm font-medium">{d.dealer}</p>
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
                                            <span className="text-muted-foreground w-12 text-right text-xs tabular-nums">
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

    const flpChartData = flpPerf.map((f) => ({
        nama: (f.nama ?? 'FLP ' + f.id_flp).length > 12 ? (f.nama ?? '').substring(0, 12) + '...' : f.nama ?? 'FLP ' + f.id_flp,
        Target: Number(f.total_target),
        Terjual: Number(f.total_terjual),
    }));

    const stockColors = stockData.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]);

    return (
        <div className="grid gap-4 lg:grid-cols-2">
            {/* FLP Performance */}
            <Card>
                <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                        <Users className="text-muted-foreground h-4 w-4" />
                        <CardTitle className="text-sm font-semibold">Performa FLP</CardTitle>
                    </div>
                    <p className="text-muted-foreground text-xs">Target vs terjual per FLP</p>
                </CardHeader>
                <CardContent>
                    {flpChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={Math.max(200, flpChartData.length * 40)}>
                            <BarChart data={flpChartData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                <XAxis type="number" tick={{ fontSize: 11 }} />
                                <YAxis type="category" dataKey="nama" width={100} tick={{ fontSize: 11 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', fontSize: 12 }}
                                    formatter={(value: number) => value.toLocaleString('id-ID')}
                                />
                                <Legend wrapperStyle={{ fontSize: 12 }} />
                                <Bar dataKey="Target" fill="#94a3b8" radius={[0, 4, 4, 0]} />
                                <Bar dataKey="Terjual" fill="#2563eb" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyState icon={Users} message="Belum ada data FLP" />
                    )}
                </CardContent>
            </Card>

            {/* Stock Unit */}
            <Card>
                <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                        <Package className="text-muted-foreground h-4 w-4" />
                        <CardTitle className="text-sm font-semibold">Stok Unit</CardTitle>
                    </div>
                    <p className="text-muted-foreground text-xs">Ketersediaan unit Ready for Sale</p>
                </CardHeader>
                <CardContent>
                    {stockData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie
                                    data={stockData}
                                    dataKey="jumlah"
                                    nameKey="tipe"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    label={({ tipe, jumlah }) => `${tipe}: ${jumlah}`}
                                >
                                    {stockData.map((_, i) => (
                                        <Cell key={i} fill={stockColors[i]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', fontSize: 12 }}
                                    formatter={(value: number) => [`${value} unit`, 'Jumlah']}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyState icon={PieChartIcon} message="Belum ada data stok" />
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
