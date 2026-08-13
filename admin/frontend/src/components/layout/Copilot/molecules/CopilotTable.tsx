// Revert to original
import type { ColumnDef } from "@tanstack/react-table";
import DataTable from "@/components/reusable/DataTable";
import TableSkeleton from "@/components/reusable/TableSkeleton";
import { cn } from "@/lib/utils";
import type { CopilotAgent, CopilotAgentWithWorkspace } from "@/types/copilot.types";

interface CopilotTableProps {
  data: CopilotAgentWithWorkspace[];
  isLoading?: boolean;
  onDelete: (row: CopilotAgent) => void;
  onEdit: (row: CopilotAgent) => void;
  className?: string;
}

const CopilotTable = ({ data, isLoading, onDelete, onEdit, className }: CopilotTableProps) => {
  const columns: ColumnDef<CopilotAgentWithWorkspace>[] = [
    {
      accessorKey: "copilotAgentName",
      header: () => <span className="whitespace-nowrap">Agent Name</span>,
    },
    {
      accessorKey: "copilotAgentDescription",
      header: "Description",
      cell: ({ row }) => (
        <div className="flex items-center max-w-[150px]">
          <span className="truncate" title={row.original.copilotAgentDescription}>
            {row.original.copilotAgentDescription}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "workspaceName",
      header: "Workspace",
    },
    // Remove for now
    // {
    //   accessorKey: "copilotAgentGreetings",
    //   header: "Greetings",
    // },
    {
      accessorKey: "copilotAgentIsActive",
      header: "Active",
      cell: ({ row }) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            row.original.copilotAgentIsActive
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {row.original.copilotAgentIsActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Created At",
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
        menuType="Copilot Agent"
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

export default CopilotTable;
