import type { ColumnDef } from "@tanstack/react-table";
import { Bot } from "lucide-react";
import { useGetAllWorkspaces } from "../../../../../services/api/workspace/getAllWorkspaces";
import type { DataAgentForm } from "../../../../../types/dataAgent.types";
import type { WorkspaceData } from "../../../../../types/workspace.types";
import DataTable from "../../../../reusable/DataTable";

interface DataAgentTableProps {
  data: DataAgentForm[];
  isLoading?: boolean;
  onDelete: (row: DataAgentForm) => void;
  onEdit: (row: DataAgentForm) => void;
}

const DataAgentTable = ({ data, isLoading, onDelete, onEdit }: DataAgentTableProps) => {
  const { data: workspacedataList } = useGetAllWorkspaces();
  const columns: ColumnDef<DataAgentForm>[] = [
    {
      accessorKey: "agentName",
      header: "Name",
    },
    {
      accessorKey: "desc",
      header: "Desc",
    },
    {
      accessorKey: "workspaceId",
      header: "Workspace",
      cell: ({ row }) => {
        const workspaceId = row.original.workspaceId;

        const workspaceName = workspacedataList?.workspaces.find(
          (data: WorkspaceData) => data.workspaceId === workspaceId,
        )?.workspaceName;

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
    <div className=" overflow-hidden border-t ">
      <DataTable
        data={data}
        menuType="Data Agent"
        columns={columns}
        onEdit={onEdit}
        onDelete={onDelete}
        showActions={true}
        initialPageSize={10}
        pageSizeOptions={[10, 25, 50]}
        searchPlaceholder="Search Data Agent..."
        menuIcon={Bot}
        className="!h-[calc(100vh-12rem)]"
      />
    </div>
  );
};

export default DataAgentTable;
