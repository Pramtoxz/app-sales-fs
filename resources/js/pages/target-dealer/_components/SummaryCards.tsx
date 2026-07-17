import { BarChart3 } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import type { ShowData } from '../types';

interface SummaryCardsProps {
    data: ShowData;
}

export function SummaryCards({ data }: SummaryCardsProps) {
    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Card>
                <CardContent className="flex items-center gap-3 pt-4">
                    <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                        <BarChart3 className="text-primary h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold">
                            {data.total_target_dealer.toLocaleString('id-ID')}
                        </p>
                        <p className="text-muted-foreground text-xs">Target Dealer</p>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="flex items-center gap-3 pt-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
                        <BarChart3 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold">
                            {data.total_target_flp.toLocaleString('id-ID')}
                        </p>
                        <p className="text-muted-foreground text-xs">Total ke FLP</p>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="flex items-center gap-3 pt-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50">
                        <BarChart3 className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                        <p
                            className={`text-2xl font-bold ${data.sisa <= 0 ? 'text-red-600' : ''}`}
                        >
                            {data.sisa.toLocaleString('id-ID')}
                        </p>
                        <p className="text-muted-foreground text-xs">Sisa</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
