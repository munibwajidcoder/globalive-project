import React, { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Table, TableBody } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { CardHeader, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type FilterField = {
  key: string;
  label: string;
  placeholder?: string;
  type?: "text" | "number" | "select";
  options?: { label: string; value: string }[];
};

type EnhancedTableProps<T> = {
  data: T[];
  columns: React.ReactNode; 
  renderRow: (item: T) => React.ReactNode; 
  pageSize?: number;
  searchKeys?: (keyof T)[] | string[];
  filterSchema?: FilterField[]; 
  className?: string;
  hideSearch?: boolean;
};

export function EnhancedTable<T>({
  data,
  columns,
  renderRow,
  pageSize = 10,
  searchKeys,
  filterSchema,
  className,
  hideSearch = false,
}: EnhancedTableProps<T>) {
  const [query, setQuery] = useState("");
  const [fieldFilters, setFieldFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let result = data;

    // Global Search
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter((item) => {
        if (searchKeys && searchKeys.length) {
          return (searchKeys as string[]).some((k) => {
            const val = (item as any)[k];
            return val !== undefined && String(val).toLowerCase().includes(q);
          });
        }
        return Object.values(item as any).some((v) => String(v).toLowerCase().includes(q));
      });
    }

    // Field-specific Filters
    Object.entries(fieldFilters).forEach(([key, value]) => {
      if (!value) return;
      const v = value.toLowerCase();
      result = result.filter((item) => {
        const val = (item as any)[key];
        return val !== undefined && String(val).toLowerCase().includes(v);
      });
    });

    return result;
  }, [data, query, searchKeys, fieldFilters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  React.useEffect(() => {
    setPage(1);
  }, [query, fieldFilters]);

  React.useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  const handleFieldFilterChange = (key: string, value: string) => {
    setFieldFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className={cn("w-full", className)}>
      <CardHeader className="space-y-4">
        {!hideSearch && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input 
              placeholder="Global Search..." 
              className="pl-10 h-10" 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
            />
          </div>
        )}

        {filterSchema && filterSchema.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-muted/30 p-4 rounded-lg border border-border/50">
            {filterSchema.map((filter) => (
              <div key={filter.key} className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">
                  {filter.label}
                </label>
                <Input
                  className="h-9 bg-background"
                  placeholder={filter.placeholder || `Filter by ${filter.label}...`}
                  value={fieldFilters[filter.key] || ""}
                  onChange={(e) => handleFieldFilterChange(filter.key, e.target.value)}
                />
              </div>
            ))}
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-auto h-9" 
              onClick={() => setFieldFilters({})}
            >
              Reset Filters
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className="rounded-md border overflow-hidden">
          <Table>
            {columns}
            <TableBody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={100} className="text-center text-muted-foreground py-12 bg-muted/10">
                    <div className="flex flex-col items-center gap-2">
                       <Search className="h-8 w-8 opacity-20" />
                       <p>No results match your filters.</p>
                       <Button variant="link" size="sm" onClick={() => {setQuery(""); setFieldFilters({});}}>
                         Clear all filters
                       </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((row) => renderRow(row))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground font-medium">
            Showing <span className="text-foreground">{paginated.length}</span> of <span className="text-foreground">{filtered.length}</span> results
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Pagination className="w-auto mx-0">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    className={cn(page === 1 && "pointer-events-none opacity-50")}
                    onClick={(e) => { e.preventDefault(); setPage((p) => Math.max(1, p - 1)); }} 
                  />
                </PaginationItem>

                <PaginationItem>
                  <PaginationNext 
                    className={cn(page === totalPages && "pointer-events-none opacity-50")}
                    onClick={(e) => { e.preventDefault(); setPage((p) => Math.min(totalPages, p + 1)); }} 
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </CardContent>
    </div>
  );
}

export default EnhancedTable;
