"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react";

// Types
export interface Column<T> {
  key: keyof T | string;
  header: string;
  width?: string;
  align?: "left" | "center" | "right";
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
}

export interface FilterOption {
  value: string;
  label: string;
}

export interface DataTableCardProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T) => string;
  title?: string;
  subtitle?: string;
  searchPlaceholder?: string;
  searchable?: boolean;
  searchKeys?: (keyof T)[];
  filterable?: boolean;
  filterKey?: keyof T;
  filterOptions?: FilterOption[];
  pagination?: boolean;
  pageSizeOptions?: number[];
  defaultPageSize?: number;
  actions?: (row: T) => React.ReactNode;
  emptyState?: React.ReactNode;
  headerActions?: React.ReactNode;
  className?: string;
  tableClassName?: string;
  headerClassName?: string;
  rowClassName?: (row: T) => string;
}

export function DataTableCard<T>({
  data,
  columns,
  keyExtractor,
  title = "Data Table",
  subtitle,
  searchPlaceholder = "Search...",
  searchable = true,
  searchKeys = [],
  filterable = false,
  filterKey,
  filterOptions = [],
  pagination = true,
  pageSizeOptions = [5, 10, 20, 50],
  defaultPageSize = 10,
  actions,
  emptyState,
  headerActions,
  className = "",
  tableClassName = "",
  headerClassName = "",
  rowClassName,
}: DataTableCardProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterValue, setFilterValue] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T | string;
    direction: "asc" | "desc";
  } | null>(null);

  // Filter and search data
  const filteredData = data.filter((row) => {
    const matchesSearch =
      !searchable ||
      !searchQuery ||
      searchKeys.some((key) => {
        const value = row[key];
        return String(value).toLowerCase().includes(searchQuery.toLowerCase());
      });

    const matchesFilter =
      !filterable ||
      filterValue === "all" ||
      (filterKey &&
        String(row[filterKey]).toLowerCase() === filterValue.toLowerCase());

    return matchesSearch && matchesFilter;
  });

  // Sort data
  const sortedData = sortConfig
    ? [...filteredData].sort((a, b) => {
        const aValue = a[sortConfig.key as keyof T];
        const bValue = b[sortConfig.key as keyof T];
        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      })
    : filteredData.reverse();

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = pagination
    ? sortedData.slice(startIndex, endIndex)
    : sortedData;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterValue, pageSize]);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= 3) {
      for (let i = 1; i <= 4; i++) pages.push(i);
      pages.push("...");
      pages.push(totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1);
      pages.push("...");
      for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push("...");
      for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
      pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  const handleSort = (key: keyof T | string) => {
    if (!columns.find((c) => c.key === key)?.sortable) return;
    setSortConfig((current) => ({
      key,
      direction:
        current?.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  return (
    <Card className={`border-0 shadow-sm bg-white ${className}`}>
      <CardHeader className="border-b border-slate-100 pb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-xl font-semibold text-slate-900">
              {title}
            </CardTitle>
            {subtitle && (
              <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {searchable && (
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-slate-200 focus:border-[#2B3A9F] focus:ring-[#2B3A9F]/20"
                />
              </div>
            )}

            {filterable && filterOptions.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-[#2B3A9F]"
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    {filterValue === "all"
                      ? "Filter"
                      : filterOptions.find((o) => o.value === filterValue)
                          ?.label || "Filter"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => setFilterValue("all")}
                  >
                    All
                  </DropdownMenuItem>
                  {filterOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      className="cursor-pointer"
                      onClick={() => setFilterValue(option.value)}
                    >
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {headerActions}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className={tableClassName}>
            <TableHeader>
              <TableRow
                className={`border-slate-100 hover:bg-transparent bg-slate-50/50 ${headerClassName}`}
              >
                {columns.map((column) => (
                  <TableHead
                    key={String(column.key)}
                    className={`text-slate-500 font-medium ${column.width || ""} ${
                      column.align === "center" ? "text-center" : ""
                    } ${column.align === "right" ? "text-right" : ""} ${column.sortable ? "cursor-pointer" : ""}`}
                    onClick={() => handleSort(column.key)}
                  >
                    <div className="flex items-center gap-1">
                      {column.header}
                      {column.sortable && sortConfig?.key === column.key && (
                        <span className="text-xs">
                          {sortConfig.direction === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </TableHead>
                ))}
                {actions && (
                  <TableHead className="text-slate-500 font-medium text-center w-60">
                    Actions
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length > 0 ? (
                paginatedData.map((row) => (
                  <TableRow
                    key={keyExtractor(row)}
                    className={`border-slate-100 hover:bg-slate-50/50 ${rowClassName?.(row) || ""}`}
                  >
                    {columns.map((column) => (
                      <TableCell
                        key={`${keyExtractor(row)}-${String(column.key)}`}
                        className={`align-middle ${column.align === "center" ? "text-center" : ""} ${
                          column.align === "right" ? "text-right" : ""
                        }`}
                      >
                        {column.render
                          ? column.render(row)
                          : String(row[column.key as keyof T] || "-")}
                      </TableCell>
                    ))}
                    {actions && (
                      <TableCell className="text-right align-middle">
                        <div className="flex items-center justify-end gap-2">
                          {actions(row)}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + (actions ? 1 : 0)}
                    className="h-64 text-center"
                  >
                    {emptyState || (
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <FileText className="h-12 w-12 mb-4 opacity-50" />
                        <p className="text-lg font-medium text-slate-600 mb-1">
                          No data found
                        </p>
                        <p className="text-sm">
                          Try adjusting your search or filter criteria
                        </p>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {pagination && sortedData.length > 0 && (
          <div className="border-t border-slate-100 px-6 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-slate-500">
                Showing{" "}
                <span className="font-medium text-slate-900">
                  {startIndex + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium text-slate-900">
                  {Math.min(endIndex, sortedData.length)}
                </span>{" "}
                of{" "}
                <span className="font-medium text-slate-900">
                  {sortedData.length}
                </span>{" "}
                results
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-1">
                  {getPageNumbers().map((page, idx) =>
                    page === "..." ? (
                      <span key={idx} className="px-2 text-sm text-slate-400">
                        ...
                      </span>
                    ) : (
                      <Button
                        key={idx}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page as number)}
                        className={`h-8 w-8 p-0 text-sm font-medium ${
                          currentPage === page ? "bg-[#2B3A9F] text-white" : ""
                        }`}
                      >
                        {page}
                      </Button>
                    ),
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">Rows per page</span>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(value) => {
                    setPageSize(Number(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-8 w-17.5">
                    <SelectValue placeholder={pageSize} />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {pageSizeOptions.map((size) => (
                      <SelectItem key={size} value={`${size}`}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
