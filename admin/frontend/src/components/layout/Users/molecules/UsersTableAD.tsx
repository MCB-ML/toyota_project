import type { ColumnDef } from "@tanstack/react-table";
import { useEffect, useState } from "react";
import { BiEditAlt } from "react-icons/bi";
import { FaRegTrashCan } from "react-icons/fa6";
import { FiUsers } from "react-icons/fi";
import { toast } from "sonner";
import DataTable from "@/components/reusable/DataTable";
import TableSkeleton from "@/components/reusable/TableSkeleton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useDeleteADUser } from "@/services/api/usersAD/deleteADUser";
import { useGetAllUserAD } from "@/services/api/usersAD/getAllUserAD";
import { useUpdateADUser } from "@/services/api/usersAD/putUpdateADUser";
import { type ADUser, type UpdateADUserRequest, UserRoleOptions } from "@/types/user.types";
import type { CompanyInfoData } from "../../../../types/companyInfo.types";
import UsersDeleteAD from "./UsersDeleteAD";
import UsersEditAD from "./UsersEditAD";

interface UsersTableADProps {
  className?: string;
  companyList: CompanyInfoData[];
  onRowClick: (row: ADUser) => void;
}

const UsersTableAD = ({ className, companyList, onRowClick }: UsersTableADProps) => {
  // 사용자 행에는 딜러사 ID 만 들어 있으므로 이름을 붙이려면 조회표가 필요하다
  const companyNameById = new Map(companyList?.map((c) => [c.companyId, c.companyName]));

  const { data: adUsersData, isLoading } = useGetAllUserAD();
  const updateADUserMutation = useUpdateADUser();
  const deleteADUserMutation = useDeleteADUser();

  const [pendingChanges, setPendingChanges] = useState<Record<string, Partial<ADUser>>>({});
  const [editingUser, setEditingUser] = useState<ADUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<ADUser | null>(null);
  useEffect(() => {
    if (adUsersData?.users && adUsersData?.users?.length > 0) {
      onRowClick(adUsersData.users[0]);
    }
  }, [adUsersData]);
  const handleRoleChange = (userId: string, newRole: string) => {
    setPendingChanges((prev) => ({
      ...prev,
      [userId]: { ...prev[userId], userRole: newRole },
    }));
  };

  const handleSave = (row: ADUser) => {
    const changes = pendingChanges[row.userId];
    if (!changes) return;

    updateADUserMutation.mutate(
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

  // Dialog Edit Save
  const handleEditSubmit = (data: any) => {
    if (!editingUser) return;

    const payload: UpdateADUserRequest = {
      userRole: data.userRole || editingUser.userRole || "user",
      userDepartment: data.userDepartment || editingUser.userDepartment || undefined,
      workspaceIds: data.workspaceIds,
      defaultCompany: data.defaultCompany,
    };

    updateADUserMutation.mutate(
      { userId: editingUser.userId, payload },
      {
        onSuccess: () => {
          toast.success("AD User updated successfully");
          setEditingUser(null);
        },
        onError: () => {
          toast.error("Failed to update AD User");
        },
      },
    );
  };

  // Dialog Delete Confirm
  const handleDeleteConfirm = () => {
    if (!deletingUser) return;
    deleteADUserMutation.mutate(deletingUser.userId, {
      onSuccess: () => {
        toast.success("AD User deleted successfully");
        setDeletingUser(null);
      },
      onError: () => {
        toast.error("Failed to delete AD User");
      },
    });
  };

  const columns: ColumnDef<ADUser>[] = [
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
      cell: ({ row }) => <div title={row.original.userEmail}>{row.original.userEmail}</div>,
    },
    {
      accessorKey: "defaultCompany",
      header: "Company",
      cell: ({ row }) => {
        const companyId = row.original.defaultCompany;
        const name = companyId ? companyNameById.get(companyId) : undefined;

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
      cell: ({ row }) => row.original.userDepartment || "-",
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
                disabled={updateADUserMutation.isPending}
              >
                {updateADUserMutation.isPending ? "Saving..." : "Save Edit"}
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
              onClick={() => setEditingUser(row.original)}
            >
              <BiEditAlt />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer text-[#E30018] hover:text-[#f80019] hover:border-[#E30018] h-8 w-8 p-0"
              onClick={() => setDeletingUser(row.original)}
            >
              <FaRegTrashCan />
            </Button>
          </div>
        );
      },
    },
  ];

  if (isLoading) {
    return (
      <div
        className={cn(
          "w-full bg-white border border-[#e5e7eb] rounded-lg shadow-lg overflow-hidden flex flex-col",
          className,
        )}
      >
        <TableSkeleton columnCount={7} rowCount={10} className="flex-1" />
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          "w-full bg-white border border-[#e5e7eb] rounded-lg shadow-lg overflow-hidden flex flex-col",
          className,
        )}
      >
        <DataTable
          data={adUsersData?.users || []}
          columns={columns}
          menuType="AD User"
          menuIcon={FiUsers}
          searchPlaceholder="Search AD users..."
          showActions={false}
          initialPageSize={10}
          className="flex-1 h-full shadow-none border-none"
          onRowClick={onRowClick}
          autoSelect={true}
        />
      </div>

      <UsersEditAD
        open={!!editingUser}
        onClose={() => setEditingUser(null)}
        onSubmit={handleEditSubmit}
        isLoading={updateADUserMutation.isPending}
        user={editingUser}
        companyList={companyList}
      />

      <UsersDeleteAD
        open={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={deleteADUserMutation.isPending}
        user={deletingUser}
      />
    </>
  );
};

export default UsersTableAD;
