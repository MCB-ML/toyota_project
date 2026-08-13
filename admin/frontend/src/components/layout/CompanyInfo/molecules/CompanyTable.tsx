import type { ColumnDef } from "@tanstack/react-table";
import { Building2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import DataTable from "@/components/reusable/DataTable";
import TableSkeleton from "@/components/reusable/TableSkeleton";
import { cn } from "@/lib/utils";
import type { CompanyInfoData } from "@/types/companyInfo.types";

interface CompanyTableProps {
  data: CompanyInfoData[];
  isLoading?: boolean;
  onDelete: (row: CompanyInfoData) => void;
  onEdit: (row: CompanyInfoData) => void;
  className?: string;
}

const CompanyTable = ({ data, isLoading, onDelete, onEdit, className }: CompanyTableProps) => {
  const { t } = useTranslation();

  const columns: ColumnDef<CompanyInfoData>[] = [
    {
      accessorKey: "companyName",
      header: t("CompanyInfo.companyName"),
    },
    {
      accessorKey: "description",
      header: t("CompanyInfo.description"),
    },
    {
      accessorKey: "isActive",
      header: t("CompanyInfo.isActive"),
      cell: ({ row }) => (row.original.isActive ? t("common.active") : t("common.inactive")),
    },
  ];

  if (isLoading) {
    return <TableSkeleton columnCount={3} />;
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
        menuType="Company"
        columns={columns}
        onEdit={onEdit}
        onDelete={onDelete}
        showActions={true}
        initialPageSize={10}
        pageSizeOptions={[10, 25, 50]}
        searchPlaceholder={t("CompanyInfo.placeholders.search")}
        menuIcon={Building2}
        className="flex-1 h-full shadow-none border-none"
      />
    </div>
  );
};

export default CompanyTable;
