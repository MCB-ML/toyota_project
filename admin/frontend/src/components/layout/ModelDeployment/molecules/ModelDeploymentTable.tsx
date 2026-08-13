import type { ColumnDef } from "@tanstack/react-table";
import { Building2 } from "lucide-react";
import DataTable from "@/components/reusable/DataTable";
import TableSkeleton from "@/components/reusable/TableSkeleton";
import { cn } from "@/lib/utils";
import type { ModelSpec } from "../../../../types/model.types";

interface ModelDeploymentTableProps {
  data: ModelSpec[];
  isLoading?: boolean;
  onDelete: (row: ModelSpec) => void;
  onEdit: (row: ModelSpec) => void;
  className?: string;
}

const ModelDeploymentTable = ({
  data,
  isLoading,
  onDelete,
  onEdit,
  className,
}: ModelDeploymentTableProps) => {
  const columns: ColumnDef<ModelSpec>[] = [
    {
      accessorKey: "displayName",
      header: "표시 이름",
    },
    {
      accessorKey: "modelId",
      header: "모델 식별자",
    },
    {
      accessorKey: "provider",
      header: "Provider",
    },
    {
      accessorKey: "modelKind",
      header: "종류",
    },
    {
      accessorKey: "maxToken",
      header: "Max Token",
    },
    {
      accessorKey: "isActive",
      header: "활성",
      cell: ({ row }) => {
        const active = row.original.isActive !== false;
        return (
          <span
            className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${
              active ? "bg-[#E6F4EC] text-[#12805c]" : "bg-[#FDECEA] text-[#C0392B]"
            }`}
          >
            {active ? "활성화" : "비활성화"}
          </span>
        );
      },
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
        searchPlaceholder="Search model..."
        menuIcon={Building2}
        className="flex-1 h-full shadow-none border-none"
      />
    </div>
  );
};

export default ModelDeploymentTable;
