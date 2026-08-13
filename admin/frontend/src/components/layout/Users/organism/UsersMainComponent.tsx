import { useEffect, useState } from "react";
import { toast } from "sonner";
import TabSwitcher from "@/components/reusable/TabSwitcher";
import { useDeleteUser } from "@/services/api/users/deleteUser";
import { useGetAllUsers } from "@/services/api/users/getAllUser";
import { useCreateUser } from "@/services/api/users/postCreateUser";
import { useUpdateUser } from "@/services/api/users/putUpdateUser";
import { useUiHeaderStore } from "@/store/uiHeaderStore";
import { endUserTabs } from "@/types/menuTab.types";
import type { ADUser, User } from "@/types/user.types";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { useGetAllCompanyList } from "../../../../services/api/company/getAllCompany";
import UsersAddNew from "../molecules/UsersAddNew";
import UsersAddNewAD from "../molecules/UsersAddNewAD";
import UsersDelete from "../molecules/UsersDelete";
import UsersEdit from "../molecules/UsersEdit";
import UsersTable from "../molecules/UsersTable";
import UsersTableAD from "../molecules/UsersTableAD";

const UsersMainComponent = () => {
  const [activeTab, setActiveTab] = useState<string>("credentials");
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [clickedRow, setClickRow] = useState<User | ADUser>();
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const { setHeaderAction } = useUiHeaderStore();

  // Hooks
  const { data: companyListAll, isLoading } = useGetAllCompanyList();
  const { data: usersData, isLoading: isUsersLoading } = useGetAllUsers();
  const createUserMutation = useCreateUser();
  const deleteUserMutation = useDeleteUser();
  const updateUserMutation = useUpdateUser();

  useEffect(() => {
    if (activeTab === "credentials") {
      setHeaderAction({
        label: "Add Credential User",
        onClick: () => setIsDialogOpen(true),
        disabled: isUsersLoading,
      });
    } else if (activeTab === "ad") {
      setHeaderAction({
        label: "Add AD User",
        onClick: () => setIsDialogOpen(true),
      });
    } else {
      setHeaderAction(null);
    }

    return () => setHeaderAction(null);
  }, [activeTab, setHeaderAction, isUsersLoading]);

  const handleAddNewUser = (data: any) => {
    if (activeTab === "credentials") {
      // confirmPassword 는 화면 검증용이라 서버로 보내지 않는다.
      // 워크스페이스 개념이 제거되어 workspaceIds 는 항상 빈 배열이다.
      const { confirmPassword: _confirmPassword, ...payload } = data;

      createUserMutation.mutate(
        { ...payload, workspaceIds: [] },
        {
          onSuccess: () => {
            toast.success("User added successfully");
            setIsDialogOpen(false);
          },
          onError: (error) => {
            toast.error(getErrorMessage(error));
          },
        },
      );
    } else {
      setIsDialogOpen(false);
    }
  };

  const handleUpdateUser = (data: any) => {
    if (!editingUser) return;

    if (data.userChangePassword && data.userChangePassword.trim().length < 6) {
      toast.error("Change Password must be at least 6 characters");
      return;
    }

    updateUserMutation.mutate(
      {
        userId: editingUser.userId,
        payload: data,
      },
      {
        onSuccess: () => {
          toast.success("User updated successfully");
          setEditingUser(null);
        },
        onError: () => {
          toast.error("Failed to update user");
        },
      },
    );
  };

  const handleConfirmDelete = () => {
    if (!deletingUser) return;
    deleteUserMutation.mutate(deletingUser.userId, {
      onSuccess: () => {
        toast.success("User deleted successfully");
        setDeletingUser(null);
      },
      onError: () => {
        toast.error("Failed to delete user");
      },
    });
  };

  const userTableClassname = `flex-1 min-h-0`;

  useEffect(() => {
    if (activeTab === "credentials" && usersData?.users && usersData?.users?.length > 0) {
      setClickRow(usersData.users[0]);
    }
  }, [activeTab, usersData]);

  // 사이드바를 강제로 접던 코드 제거.
  // 우측 User Workspace List 패널 자리를 만들려던 것인데 그 패널이 사라졌다.
  // 사용자 메뉴만 사이드바가 접히는 이유였다.

  return (
    <div className="h-full flex flex-col bg-[#f2f5fa] px-1 md:px-2 lg:px-3 py-1 md:py-2 lg:py-3">
      <div className="w-full flex flex-col gap-y-2 mb-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-y-2 md:flex-row md:items-center md:gap-x-4">
          <TabSwitcher tabs={endUserTabs} activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </div>

      <div className="flex gap-2 h-full">
        {activeTab === "credentials" ? (
          <UsersTable
            data={usersData?.users || []}
            companyList={companyListAll?.result || []}
            isLoading={isUsersLoading}
            onEdit={(user) => setEditingUser(user)}
            onDelete={(user) => setDeletingUser(user)}
            className={userTableClassname}
            onRowClick={(user: User) => {
              setClickRow(user);
            }}
          />
        ) : (
          <UsersTableAD
            className={userTableClassname}
            companyList={companyListAll?.result || []}
            onRowClick={(user: ADUser) => {
              setClickRow(user);
            }}
          />
        )}

        {/* User Workspace List 패널 제거: 워크스페이스 개념이 없어졌다. */}
      </div>

      {/* Add New User Dialogs */}
      {activeTab === "credentials" && (
        <UsersAddNew
          open={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onSubmit={handleAddNewUser}
          isLoading={createUserMutation.isPending}
          companyList={companyListAll?.result || []}
        />
      )}

      {/* Edit User Dialog */}
      <UsersEdit
        open={!!editingUser}
        onClose={() => setEditingUser(null)}
        onSubmit={handleUpdateUser}
        isLoading={updateUserMutation.isPending}
        user={editingUser}
        companyList={companyListAll?.result || []}
      />

      {/* Delete User Dialog */}
      <UsersDelete
        open={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        onConfirm={handleConfirmDelete}
        isLoading={deleteUserMutation.isPending}
        user={deletingUser}
      />

      {/* Add New AD User Dialogs */}
      {activeTab === "ad" && (
        <UsersAddNewAD
          open={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onSubmit={handleAddNewUser}
          companyList={companyListAll?.result || []}
        />
      )}
    </div>
  );
};

export default UsersMainComponent;
