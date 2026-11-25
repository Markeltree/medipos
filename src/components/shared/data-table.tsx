"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/primitives";
import { EmptyState } from "@/components/shared/misc";
import { cn } from "@/lib/utils";

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  searchPlaceholder?: string;
  searchable?: boolean;
  toolbar?: React.ReactNode;
  pageSize?: number;
  onRowClick?: (row: T) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  initialSort?: SortingState;
  initialQuery?: string;
  className?: string;
}

/**
 * Reusable table: global search, column sorting and pagination.
 * Columns are defined per module; this component owns no business logic.
 */
export function DataTable<T>({
  data,
  columns,
  searchPlaceholder = "Search…",
  searchable = true,
  toolbar,
  pageSize = 10,
  onRowClick,
  emptyTitle = "Nothing here yet",
  emptyDescription,
  emptyAction,
  initialSort = [],
  initialQuery = "",
  className,
}: DataTableProps<T>) {
  const [sorting, setSorting] = React.useState<SortingState>(initialSort);
  const [globalFilter, setGlobalFilter] = React.useState(initialQuery);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  });

  const { pageIndex, pageSize: size } = table.getState().pagination;
  const filteredCount = table.getFilteredRowModel().rows.length;
  const from = filteredCount === 0 ? 0 : pageIndex * size + 1;
  const to = Math.min(filteredCount, (pageIndex + 1) * size);

  return (
    <div className={cn("flex min-w-0 flex-col", className)}>
      {(searchable || toolbar) && (
        <div className="flex flex-col gap-2 border-b border-border p-3 sm:flex-row sm:items-center sm:justify-between">
          {searchable ? (
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <Input
                value={globalFilter}
                onChange={(e) => {
                  setGlobalFilter(e.target.value);
                  table.setPageIndex(0);
                }}
                placeholder={searchPlaceholder}
                className="pl-8"
                aria-label="Search table"
              />
            </div>
          ) : (
            <span />
          )}
          {toolbar && <div className="flex flex-wrap items-center gap-2">{toolbar}</div>}
        </div>
      )}

      <div className="thin-scroll overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead className="bg-surface-muted/60 text-xs text-muted">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  return (
                    <th key={header.id} className="whitespace-nowrap px-4 py-2.5 font-medium">
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="inline-flex cursor-pointer items-center gap-1 hover:text-foreground"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {sorted === "asc" ? (
                            <ArrowUp className="size-3" />
                          ) : sorted === "desc" ? (
                            <ArrowDown className="size-3" />
                          ) : (
                            <ArrowUpDown className="size-3 opacity-40" />
                          )}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                className={cn(
                  "border-t border-border transition-colors hover:bg-surface-muted/70",
                  onRowClick && "cursor-pointer",
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 align-middle">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {table.getRowModel().rows.length === 0 && (
          <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} compact />
        )}
      </div>

      {filteredCount > 0 && (
        <div className="flex flex-col gap-2 border-t border-border px-4 py-2.5 text-[13px] text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>
            Showing {from}–{to} of {filteredCount}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon-sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} aria-label="Previous page">
              <ChevronLeft />
            </Button>
            <span className="min-w-20 text-center tabular-nums">
              Page {pageIndex + 1} of {Math.max(1, table.getPageCount())}
            </span>
            <Button variant="outline" size="icon-sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} aria-label="Next page">
              <ChevronRight />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
