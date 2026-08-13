import type { ColumnDef } from "@tanstack/react-table";
import DataTable from "@/components/reusable/DataTable";
import TableSkeleton from "@/components/reusable/TableSkeleton";
import { cn } from "@/lib/utils";
import type { WorkspaceData } from "@/types/workspace.types";
import { getWorkspaceTypeLabel } from "@/types/workspace.types";

interface WorkspaceTableProps {
  data: WorkspaceData[];
  isLoading?: boolean;
  onRowClick: (row: WorkspaceData) => void;
  onDelete: (row: WorkspaceData) => void;
  onEdit: (row: WorkspaceData) => void;
  className?: string;
  autoSelect?: boolean;
}

const WorkspaceTable = ({
  data,
  isLoading,
  onDelete,
  onEdit,
  onRowClick,
  className,
  autoSelect,
}: WorkspaceTableProps) => {
  const columns: ColumnDef<WorkspaceData>[] = [
    {
      accessorKey: "workspaceName",
      header: "Workspace Name",
    },
    {
      accessorKey: "workspaceDepartment",
      header: "Department",
    },
    {
      accessorKey: "workspaceType",
      header: "Workspace Type",
      cell: ({ row }) => getWorkspaceTypeLabel(row.getValue("workspaceType")),
    },
    {
      accessorKey: "branchName",
      header: "Branch",
    },
    //{
    //  accessorKey: "userAccess",
    //  header: "User Access",
    //  cell: ({ row }) => (
    //    <Button
    //      variant="outline"
    //      size="sm"
    //      className="cursor-pointer ]"
    //      onClick={() => showUserAccess(row.original)}
    //    >
    //      <User />
    //    </Button>
    //  ),
    //},
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
        menuType="Workspace"
        columns={columns}
        onEdit={onEdit}
        onDelete={onDelete}
        onRowClick={onRowClick}
        showActions={true}
        initialPageSize={10}
        className="flex-1 h-full shadow-none border-none"
        autoSelect={autoSelect}
        filter={{
          key: "workspaceType",
          label: "Workspace Type",
          data: [...new Set(data.map((d: any) => d.workspaceType))].map((val) => ({
            value: val,
            label: getWorkspaceTypeLabel(val),
          })),
        }}
      />
    </div>
  );
};

export default WorkspaceTable;
