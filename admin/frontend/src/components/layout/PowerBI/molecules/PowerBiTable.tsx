import type { ColumnDef } from "@tanstack/react-table";
import { ChartBar } from "lucide-react";
import DataTable from "@/components/reusable/DataTable";
import { cn } from "@/lib/utils";
import { useGetAllWorkspaces } from "../../../../services/api/workspace/getAllWorkspaces";
import type { PowerBIData } from "../../../../types/powerBi.types";
import type { WorkspaceData } from "../../../../types/workspace.types";

interface PowerBiTableProps {
  data: PowerBIData[];
  isLoading?: boolean;
  onDelete: (row: PowerBIData) => void;
  onEdit: (row: PowerBIData) => void;
  selectedBranchId: string;
  className?: string;
}

const PowerBiTable = ({
  data,
  isLoading,
  onDelete,
  onEdit,
  selectedBranchId,
  className,
}: PowerBiTableProps) => {
  const { data: workspacedataList } = useGetAllWorkspaces();
  const columns: ColumnDef<PowerBIData>[] = [
    {
      accessorKey: "agentName",
      header: "Name",
    },
    {
      accessorKey: "desc",
      header: "Description",
    },
    {
      accessorKey: "workspace",
      header: "Workspace",
      cell: ({ row }) => {
        const workspaceId = row.original.workspace;

        const workspaceName = workspacedataList?.workspaces
          ?.filter((data: WorkspaceData) => data.branchId === selectedBranchId)
          .find((data: WorkspaceData) => data.workspaceId === workspaceId)?.workspaceName;

        return workspaceName ?? "-";
      },
    },
    {
      accessorKey: "isActive",
      header: "Active",
      cell: ({ row }) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            row.original.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}
        >
          {row.original.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];

  return (
    <div
      className={cn(
        "w-full bg-white border border-[#e5e7eb] rounded-lg shadow-lg overflow-hidden flex flex-col",
        className,
      )}
    >
      <DataTable
        data={data}
        menuType="Power BI"
        columns={columns}
        onEdit={onEdit}
        onDelete={onDelete}
        showActions={true}
        initialPageSize={10}
        pageSizeOptions={[10, 25, 50]}
        searchPlaceholder="Search Power BI..."
        menuIcon={ChartBar}
        className="flex-1 h-full shadow-none border-none"
      />
    </div>
  );
};

export default PowerBiTable;
