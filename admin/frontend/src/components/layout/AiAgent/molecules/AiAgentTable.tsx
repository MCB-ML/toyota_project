import type { ColumnDef } from "@tanstack/react-table";
import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import DataTable from "@/components/reusable/DataTable";
import TableSkeleton from "@/components/reusable/TableSkeleton";
import { cn } from "@/lib/utils";
import type { AiAgent, AiAgentWithWorkspace } from "@/types/aiAgent.types";

interface AiAgentTableProps {
  data: AiAgentWithWorkspace[];
  isLoading?: boolean;
  onDelete?: (row: AiAgent) => void;
  onEdit?: (row: AiAgent) => void;
  className?: string;
}

const AiAgentTable = ({ data, isLoading, onDelete, onEdit, className }: AiAgentTableProps) => {
  const { t } = useTranslation();

  const columns: ColumnDef<AiAgentWithWorkspace>[] = [
    {
      accessorKey: "agentName",
      header: t("AiAgent.agentName"),
    },
    {
      accessorKey: "category",
      header: t("AiAgent.category"),
    },
    {
      accessorKey: "description",
      header: t("AiAgent.description"),
      cell: ({ row }) => (
        <div className="flex items-center max-w-[150px]">
          <span className="truncate" title={row.original.description}>
            {row.original.description}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "workspaceName",
      header: t("AiAgent.workspace"),
    },

    {
      accessorKey: "isActive",
      header: t("common.active"),
      cell: ({ row }) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            row.original.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}
        >
          {row.original.isActive ? t("common.active") : t("common.inactive")}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: t("common.createdAt"),
      cell: ({ row }) => {
        if (!row.original.createdAt) return "-";
        return new Date(row.original.createdAt).toLocaleString();
      },
    },
  ];

  if (isLoading) {
    return <TableSkeleton columnCount={6} rowCount={10} />;
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
        menuType="AI Agent"
        columns={columns}
        onEdit={onEdit}
        onDelete={onDelete}
        showActions={!!(onEdit || onDelete)}
        initialPageSize={10}
        pageSizeOptions={[10, 25, 50]}
        searchPlaceholder={t("AiAgent.searchPlaceholder")}
        menuIcon={Sparkles}
        className="flex-1 h-full shadow-none border-none"
      />
    </div>
  );
};

export default AiAgentTable;
