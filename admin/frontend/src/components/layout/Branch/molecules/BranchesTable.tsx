import type { ColumnDef } from "@tanstack/react-table";
import { useTranslation } from "react-i18next";
import DataTable from "@/components/reusable/DataTable";
import TableSkeleton from "@/components/reusable/TableSkeleton";
import { cn } from "@/lib/utils";

import type { BranchData } from "@/types/branch.types";

interface BranchesTableProps {
  data: BranchData[];
  isLoading?: boolean;
  onDelete: (row: BranchData) => void;
  onEdit: (row: BranchData) => void;
  onToggleActive: (row: BranchData, value: boolean) => void;
  onToggleDefault: (row: BranchData, value: boolean) => void;
  onToggleAllowUserAccess: (row: BranchData, value: boolean) => void;
  className?: string;
}

const BranchesTable = ({
  data,
  isLoading,
  onDelete,
  onEdit,
  onToggleActive,

  onToggleDefault,
  onToggleAllowUserAccess,
  className,
}: BranchesTableProps) => {
  const { t } = useTranslation();
  const columns: ColumnDef<BranchData>[] = [
    {
      accessorKey: "branchName",
      header: t("Branch.branchName"),
    },
    {
      accessorKey: "branchType",
      header: t("Branch.type"),
    },
    {
      accessorKey: "branchLocation",
      header: t("Branch.location"),
    },
    {
      accessorKey: "isActive",
      header: t("common.active"),
      cell: ({ row }) => {
        const isActive = row.original.isActive ?? false;

        return (
          <input
            type="checkbox"
            checked={isActive}
            className="w-4 h-4 accent-[#5f368d]"
            onChange={(e) => onToggleActive(row.original, e.target.checked)}
          />
        );
      },
    },
    {
      accessorKey: "isDefault",
      header: t("Branch.default"),
      cell: ({ row }) => {
        const isDefault = row.original.isDefault ?? false;

        return (
          <input
            type="checkbox"
            checked={isDefault}
            className="w-4 h-4 accent-[#5f368d]"
            onChange={(e) => onToggleDefault(row.original, e.target.checked)}
          />
        );
      },
    },
    //{
    //  accessorKey: "companyName",
    //  header: "Company Name",
    //},
    {
      accessorKey: "allowUserAccess",
      header: t("Branch.allowGuestAccess"),
      cell: ({ row }) => {
        const allowUserAccess =
          row.original.branchAllowUserAccess ?? row.original.allowUserAccess ?? false;

        return (
          <input
            type="checkbox"
            checked={allowUserAccess}
            className="w-4 h-4 accent-[#5f368d]"
            onChange={(e) => onToggleAllowUserAccess(row.original, e.target.checked)}
          />
        );
      },
    },
  ];

  if (isLoading) {
    return <TableSkeleton columnCount={4} rowCount={10} />;
  }

  return (
    <div
      className={cn(
        "w-full bg-white border border-[#e5e7eb] rounded-lg shadow-lg overflow-hidden flex flex-col",
        className,
      )}
    >
      <DataTable
        data={data}
        menuType="Branch"
        columns={columns}
        onEdit={onEdit}
        onDelete={onDelete}
        showActions={true}
        initialPageSize={10}
        className="flex-1 h-full shadow-none border-none"
      />
    </div>
  );
};

export default BranchesTable;
