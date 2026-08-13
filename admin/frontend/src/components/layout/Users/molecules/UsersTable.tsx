import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { BiEditAlt } from "react-icons/bi";
import { FaRegTrashCan } from "react-icons/fa6";
import { FiUsers } from "react-icons/fi";
import { toast } from "sonner";
import DataTable from "@/components/reusable/DataTable";
import TableSkeleton from "@/components/reusable/TableSkeleton";
import { cn } from "@/lib/utils";
import { type User, UserRoleOptions } from "@/types/user.types";
import { useUpdateUser } from "../../../../services/api/users/putUpdateUser";
import type { CompanyInfoData } from "../../../../types/companyInfo.types";
import { Button } from "../../../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../ui/select";

interface UsersTableProps {
  data: User[];
  companyList: CompanyInfoData[];
  isLoading?: boolean;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onRowClick: (row: User) => void;
  className?: string;
}

const UsersTable = ({
  data,
  companyList,
  isLoading,
  onEdit,
  onDelete,
  onRowClick,
  className,
}: UsersTableProps) => {
  // 사용자 행에는 딜러사 ID 만 들어 있으므로 이름을 붙이려면 조회표가 필요하다
  const companyNameById = new Map(companyList?.map((c) => [c.companyId, c.companyName]));

  const [pendingChanges, setPendingChanges] = useState<Record<string, Partial<User>>>({});
  const updateUserMutation = useUpdateUser();
  const [_editingUser, _setEditingUser] = useState<User | null>(null);
  const handleRoleChange = (userId: string, newRole: string) => {
    setPendingChanges((prev) => ({
      ...prev,
      [userId]: { ...prev[userId], userRole: newRole },
    }));
  };
  const handleSave = (row: User) => {
    const changes = pendingChanges[row.userId];
    if (!changes) return;

    updateUserMutation.mutate(
      {
        userId: row.userId,
        payload: {
          userRole: changes.userRole!,
        },
      },
      {
        onSuccess: () => {
          toast.success("User role updated successfully");
          setPendingChanges((prev) => {
            const newState = { ...prev };
            delete newState[row.userId];
            return newState;
          });
        },
        onError: () => {
          toast.error("Failed to update user role");
        },
      },
    );
  };
  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "userName",
      header: "Name",
      cell: ({ row }) => {
        const userAvatar = row.original.userAvatar;
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-[#f3f4f6] flex items-center justify-center shrink-0">
              {userAvatar ? (
                <img
                  src={
                    userAvatar.startsWith("data:")
                      ? userAvatar
                      : `data:image/jpeg;base64,${userAvatar}`
                  }
                  alt={row.original.userName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs font-medium text-[#4a5565]">
                  {row.original.userName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <span className="font-medium text-[#111827]">{row.original.userName}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "userEmail",
      header: "Email",
    },
    {
      accessorKey: "defaultCompany",
      header: "Company",
      cell: ({ row }) => {
        const companyId = row.original.defaultCompany;
        const name = companyId ? companyNameById.get(companyId) : undefined;

        // 딜러사가 지워졌거나 미지정이면 ID 를 그대로 보여주지 않고 표시를 흐린다
        return name ? (
          <span className="text-[#111827]">{name}</span>
        ) : (
          <span className="text-[#98a2b3]">—</span>
        );
      },
    },
    {
      accessorKey: "userDepartment",
      header: "Department",
    },
    {
      accessorKey: "userRole",
      header: "Role",
      cell: ({ row }) => {
        const userId = row.original.userId;
        const currentRole = pendingChanges[userId]?.userRole || row.original.userRole || "user"; // Default to user if null

        return (
          <div className="flex justify-end lg:justify-start">
            <Select value={currentRole} onValueChange={(val) => handleRoleChange(userId, val)}>
              <SelectTrigger className="w-[100px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {/* 권한 목록은 UserRoleOptions 한 곳에서만 관리한다 */}
                {UserRoleOptions.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      },
    },
    //{
    //  accessorKey: "workspaces",
    //  header: "Workspaces",
    //  cell: ({ row }) => {
    //    const workspaces = row.original.workspaces || [];
    //    const names = workspaces.map((w) => w.workspaceName);
    //    return <TagList items={names} label="Workspaces" />;
    //  },
    //},
    {
      accessorKey: "createdAt",
      header: "Created At",
      cell: ({ row }) => {
        const date = new Date(row.original.createdAt);
        return date.toLocaleDateString();
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const isDirty = !!pendingChanges[row.original.userId];

        if (isDirty) {
          return (
            <div className="flex justify-end lg:justify-start">
              <Button
                size="sm"
                className="bg-[#00a63e] hover:bg-[#008236] text-white h-8 text-xs"
                onClick={() => handleSave(row.original)}
                disabled={updateUserMutation.isPending}
              >
                {updateUserMutation.isPending ? "Saving..." : "Save Edit"}
              </Button>
            </div>
          );
        }

        return (
          <div className="flex gap-2 justify-end lg:justify-start">
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer text-[#1a73e8] hover:text-[#1557b0] hover:border-[#1a73e8] h-8 w-8 p-0"
              onClick={() => onEdit(row.original)}
            >
              <BiEditAlt />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer text-[#E30018] hover:text-[#f80019] hover:border-[#E30018] h-8 w-8 p-0"
              onClick={() => onDelete(row.original)}
            >
              <FaRegTrashCan />
            </Button>
          </div>
        );
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
        columns={columns}
        menuType="User"
        menuIcon={FiUsers}
        searchPlaceholder="Search users..."
        onEdit={onEdit}
        onDelete={onDelete}
        onRowClick={onRowClick}
        showActions={false}
        initialPageSize={10}
        className="flex-1 h-full shadow-none border-none"
        autoSelect={true}
      />
    </div>
  );
};

export default UsersTable;
