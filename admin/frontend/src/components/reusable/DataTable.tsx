import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import type React from "react";
import { useEffect, useState } from "react";
import { BiEditAlt } from "react-icons/bi";
import { FaRegTrashCan } from "react-icons/fa6";
import {
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
  FiChevronUp,
  FiSearch,
} from "react-icons/fi";
import { LuChevronsUpDown } from "react-icons/lu";
import { PiEmpty, PiEmptyBold } from "react-icons/pi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface DataTableProps<TData> {
  data: TData[];
  menuType: string;
  columns: ColumnDef<TData>[];
  onEdit?: (row: TData) => void;
  onDelete?: (row: TData) => void;
  onRowClick?: (row: TData) => void;
  showActions?: boolean;
  initialPageSize?: number;
  pageSizeOptions?: number[];
  searchPlaceholder?: string;
  menuIcon?: React.ElementType;
  className?: string;
  autoSelect?: boolean;
  filter?: { label: string; key: keyof TData; data: { value: string; label: string }[] } | null;
}

const DataTable = <TData,>({
  data,
  menuType,
  columns,
  onEdit,
  onDelete,
  onRowClick,
  showActions = true,
  initialPageSize = 10,
  pageSizeOptions = [10, 25, 50],
  searchPlaceholder = "Search...",
  menuIcon,
  className,
  autoSelect = false,
  filter = null,
}: DataTableProps<TData>) => {
  const Icon = menuIcon ?? PiEmptyBold;
  const [selectRow, setSelectRow] = useState<string>("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const [pageSize, setPageSize] = useState<number>(initialPageSize);
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [hoveredColumn, setHoveredColumn] = useState<string | null>(null);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      globalFilter,
      pagination: {
        pageIndex,
        pageSize,
      },
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: (updater) => {
      if (typeof updater === "function") {
        const newPagination = updater({ pageIndex, pageSize });
        setPageIndex(newPagination.pageIndex);
        setPageSize(newPagination.pageSize);
      }
    },
  });

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPageIndex(0);
    table.setPageSize(size);
  };

  const currentPage = pageIndex + 1;
  const totalPages = table.getPageCount();
  const totalRecords = data.length;
  const hasData = data.length > 0;
  const hasResults = table.getRowModel().rows.length > 0;

  useEffect(() => {
    if (hasResults && autoSelect) {
      setSelectRow(table.getRowModel().rows[0].id);
    }
  }, [hasResults]);

  return (
    <div
      className={cn(
        "bg-white rounded-lg shadow w-full max-w-352 flex flex-col",
        !className?.includes("h-") &&
          "h-[calc(100vh-6rem)] md:h-[calc(100vh-7.5rem)] lg:h-[calc(100vh-5.5rem)]",
        className,
      )}
    >
      {!hasData ? (
        <div className="w-full h-full flex flex-col items-center justify-center gap-y-3">
          <Icon size={125} color="#1a73e8" />
          <div className="text-center text-2xl text-[#6a7282]">No {menuType} found</div>
          <div className="text-center text-lg text-[#555555]">Please add a new {menuType}</div>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="p-4 border-b border-[#e5e7eb] shrink-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center  gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm whitespace-nowrap">Show</span>
                <Select
                  value={`${pageSize}`}
                  onValueChange={(value) => handlePageSizeChange(Number(value))}
                >
                  <SelectTrigger className="w-20" id="detail-rows-per-page">
                    <SelectValue placeholder={pageSize} />
                  </SelectTrigger>
                  <SelectContent side="bottom">
                    {pageSizeOptions.map((size) => (
                      <SelectItem key={size} value={`${size}`}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-sm whitespace-nowrap">entries</span>
              </div>

              <div className="ml-auto flex gap-2">
                {filter && (
                  <div className="flex items-center gap-2 ">
                    <span className="text-sm whitespace-nowrap">{filter.label}</span>
                    <Select
                      defaultValue="All"
                      onValueChange={(value) => {
                        setPageIndex(0);

                        if (value === "All") {
                          table.setColumnFilters([]);
                        } else {
                          table.setColumnFilters([{ id: String(filter.key), value }]);
                        }
                      }}
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value="All">All</SelectItem>

                        {filter.data.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="w-full sm:w-auto relative ml-auto">
                  <Input
                    placeholder={searchPlaceholder}
                    value={globalFilter ?? ""}
                    onChange={(e: any) => setGlobalFilter(e.target.value)}
                    className="w-full sm:w-64 pr-10"
                  />
                  <FiSearch
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6a7282]"
                    size={20}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            {/* Desktop Table */}
            <div className="h-full overflow-y-auto hidden lg:block overflow-x-auto">
              {!hasResults ? (
                <div className="h-full flex flex-col items-center justify-center gap-y-3">
                  <PiEmpty size={125} color="#6a7282" />
                  <div className="text-center text-2xl text-[#6a7282]">No results found</div>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-[#f9fafb] sticky top-0 z-10 ">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <th
                            key={header.id}
                            className="px-4 py-3 text-left text-xs font-medium text-[#364153] uppercase tracking-wider border-b border-[#e5e7eb]"
                            onMouseEnter={() => setHoveredColumn(header.id)}
                            onMouseLeave={() => setHoveredColumn(null)}
                          >
                            {header.isPlaceholder ? null : (
                              <div
                                className="flex items-center gap-2 cursor-pointer select-none text-[11.5px]"
                                onClick={header.column.getToggleSortingHandler()}
                              >
                                {flexRender(header.column.columnDef.header, header.getContext())}
                                <span className="text-[#99a1af] w-4 flex items-center justify-center">
                                  {header.column.getIsSorted() === "asc" ? (
                                    <FiChevronUp className="h-4 w-4" />
                                  ) : header.column.getIsSorted() === "desc" ? (
                                    <FiChevronDown className="h-4 w-4" />
                                  ) : hoveredColumn === header.id ? (
                                    <LuChevronsUpDown className="h-4 w-4" />
                                  ) : (
                                    <span className="h-4 w-4" />
                                  )}
                                </span>
                              </div>
                            )}
                          </th>
                        ))}
                        {showActions && (
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#364153] uppercase tracking-wider border-b border-[#e5e7eb]">
                            Actions
                          </th>
                        )}
                      </tr>
                    ))}
                  </thead>
                  <tbody className="bg-white divide-y divide-[#e5e7eb]">
                    {table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        className={cn(
                          "hover:bg-[#f9fafb]",
                          onRowClick && "cursor-pointer",
                          row?.id === selectRow && "!text-[#155dfc] bg-[#f9fafb]",
                        )}
                        onClick={() => {
                          setSelectRow(row?.id);
                          onRowClick?.(row.original);
                        }}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            className={`px-4 py-3  text-[12px] text-[#101828] whitespace-nowrap  ${row?.id === selectRow ? "!text-[#155dfc] bg-[#f9fafb]" : ""}`}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                        {showActions && (
                          <td className="px-4 py-3 text-sm">
                            <div className="flex gap-2">
                              {onEdit && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="cursor-pointer text-[#1a73e8] hover:text-[#1557b0] hover:border-[#1a73e8]"
                                  onClick={() => onEdit(row.original)}
                                >
                                  <BiEditAlt />
                                </Button>
                              )}
                              {onDelete && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="cursor-pointer text-[#E30018] hover:text-[#f80019] hover:border-[#E30018]"
                                  onClick={() => onDelete(row.original)}
                                >
                                  <FaRegTrashCan />
                                </Button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Mobile Card */}
            <div className="h-full overflow-y-auto lg:hidden">
              {!hasData ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-[#6a7282]">No Data</div>
                </div>
              ) : !hasResults ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-[#6a7282]">No results found</div>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  {table.getRowModel().rows.map((row) => (
                    <div
                      key={row.id}
                      className={cn(
                        "border border-[#e5e7eb] rounded-lg p-4 space-y-3",
                        onRowClick && "cursor-pointer",
                      )}
                      onClick={() => onRowClick?.(row.original)}
                    >
                      {row.getVisibleCells().map((cell) => {
                        const headerContent = cell.column.columnDef.header;
                        const headerLabel =
                          typeof headerContent === "string" ? headerContent : cell.column.id;

                        return (
                          <div key={cell.id} className="flex justify-between items-start">
                            <span className="text-sm font-medium text-[#6a7282]">
                              {headerLabel}:
                            </span>
                            <span className="text-sm text-[#101828] text-right">
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </span>
                          </div>
                        );
                      })}
                      {showActions && (onEdit || onDelete) && (
                        <div className="flex gap-2 pt-2 border-t border-[#e5e7eb]">
                          {onEdit && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 text-[#1a73e8]"
                              onClick={() => onEdit(row.original)}
                            >
                              <BiEditAlt />
                            </Button>
                          )}
                          {onDelete && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 text-[#E30018]"
                              onClick={() => onDelete(row.original)}
                            >
                              <FaRegTrashCan />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Pagination */}
          {hasResults && (
            <div className="p-3 border-t border-[#e5e7eb] shrink-0">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="text-sm text-[#364153]">
                  Showing {pageIndex * pageSize + 1} to{" "}
                  {Math.min((pageIndex + 1) * pageSize, totalRecords)} of {totalRecords} entries
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPageIndex(0)}
                    disabled={!table.getCanPreviousPage()}
                    className="hidden sm:flex h-8 w-8"
                  >
                    <FiChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className="h-8 w-8"
                  >
                    <FiChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium px-2">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className="h-8 w-8"
                  >
                    <FiChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPageIndex(totalPages - 1)}
                    disabled={!table.getCanNextPage()}
                    className="hidden sm:flex h-8 w-8"
                  >
                    <FiChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DataTable;
