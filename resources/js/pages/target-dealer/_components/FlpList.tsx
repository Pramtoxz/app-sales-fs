import { Input } from '@/components/ui/input';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import { Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import type { FlpData, TargetItem } from '../types';
import { FlpCard } from './FlpCard';

const FLP_PER_PAGE = 10;

interface FlpListProps {
    data: FlpData[];
    isKacab: boolean;
    onEdit: (item: TargetItem, idFlp: string) => void;
    onDelete: (id: number) => void;
}

export function FlpList({ data, isKacab, onEdit, onDelete }: FlpListProps) {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [openFlps, setOpenFlps] = useState<Record<string, boolean>>({});

    const toggleFlp = (id: string) => {
        setOpenFlps((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const filteredFlps = useMemo(() => {
        let result = data;
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(
                (f) =>
                    f.nama_flp.toLowerCase().includes(q) ||
                    f.id_flp.toLowerCase().includes(q),
            );
        }
        result.sort((a, b) => b.total_target - a.total_target);
        return result;
    }, [data, search]);

    const totalPages = Math.max(1, Math.ceil(filteredFlps.length / FLP_PER_PAGE));
    const paginatedFlps = useMemo(() => {
        const start = (page - 1) * FLP_PER_PAGE;
        return filteredFlps.slice(start, start + FLP_PER_PAGE);
    }, [filteredFlps, page]);

    return (
        <>
            <div className="flex items-center justify-between gap-3">
                <div className="relative max-w-xs flex-1">
                    <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                    <Input
                        placeholder="Cari nama / ID FLP..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        className="pl-9 pr-8"
                    />
                    {search && (
                        <button
                            onClick={() => {
                                setSearch('');
                                setPage(1);
                            }}
                            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
                <span className="text-muted-foreground text-sm">
                    {filteredFlps.length} FLP
                </span>
            </div>

            <div className="space-y-2">
                {paginatedFlps.length === 0 ? (
                    <div className="text-muted-foreground py-8 text-center text-sm">
                        FLP tidak ditemukan
                    </div>
                ) : (
                    paginatedFlps.map((flp) => (
                        <FlpCard
                            key={flp.id_flp}
                            flp={flp}
                            isOpen={!!openFlps[flp.id_flp]}
                            isKacab={isKacab}
                            onToggle={() => toggleFlp(flp.id_flp)}
                            onEdit={(item) => onEdit(item, flp.id_flp)}
                            onDelete={onDelete}
                        />
                    ))
                )}
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-muted-foreground text-xs">
                        Halaman {page} dari {totalPages}
                    </p>
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    href="#"
                                    className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (page > 1) setPage(page - 1);
                                    }}
                                />
                            </PaginationItem>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                <PaginationItem key={p} className="hidden sm:inline-block">
                                    <PaginationLink
                                        href="#"
                                        isActive={p === page}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setPage(p);
                                        }}
                                    >
                                        {p}
                                    </PaginationLink>
                                </PaginationItem>
                            ))}
                            <PaginationItem>
                                <PaginationNext
                                    href="#"
                                    className={page >= totalPages ? 'pointer-events-none opacity-50' : ''}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (page < totalPages) setPage(page + 1);
                                    }}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}
        </>
    );
}
