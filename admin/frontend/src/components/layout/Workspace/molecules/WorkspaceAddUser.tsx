import { toast } from "sonner";
import { useGetAllCompanyList } from "../../../../services/api/company/getAllCompany";
import { useCreateUser } from "../../../../services/api/users/postCreateUser";
import type { CompanyInfoData } from "../../../../types/companyInfo.types";
import UsersAddNewAD from "../../Users/molecules/UsersAddNewAD";
import WorkspaceAddUserCreden from "./WorkspaceAddUserCreden";

type WorkspaceAddUserProps = {
  show: boolean;
  onClose: () => void;
  form: string;
  selectedCompanyId: string;
  selectedBranchId: string;
  selectedWorkspace: string;
};
const WorkspaceAddUser = ({
  show,
  onClose,
  form,
  selectedCompanyId,
  selectedBranchId,
  selectedWorkspace,
}: WorkspaceAddUserProps) => {
  const { data: companyListAll, isLoading } = useGetAllCompanyList();
  const createUserMutation = useCreateUser();

  const handleAddNewUser = (data: any) => {
    if (form === "credentials") {
      createUserMutation.mutate(data, {
        onSuccess: () => {
          toast.success("User added successfully");
          onClose();
        },
        onError: () => {
          toast.error("Failed to add user");
        },
      });
    } else {
      onClose();
    }
  };

  return (
    <>
      {form === "ad" && (
        <UsersAddNewAD
          open={show}
          onClose={onClose}
          onSubmit={handleAddNewUser}
          companyList={
            companyListAll?.result.filter(
              (e: CompanyInfoData) => e.companyId === selectedCompanyId,
            ) || []
          }
          companyId={selectedCompanyId}
          workspaceId={selectedWorkspace}
          branchId={selectedBranchId}
        />
      )}
      {form === "credentials" && (
        <WorkspaceAddUserCreden
          open={show}
          onClose={onClose}
          onSubmit={handleAddNewUser}
          isLoading={createUserMutation.isPending}
          companyList={
            companyListAll?.result.filter(
              (e: CompanyInfoData) => e.companyId === selectedCompanyId,
            ) || []
          }
          companyId={selectedCompanyId}
          workspaceId={selectedWorkspace}
          branchId={selectedBranchId}
        />
      )}
    </>
  );
};
export default WorkspaceAddUser;
