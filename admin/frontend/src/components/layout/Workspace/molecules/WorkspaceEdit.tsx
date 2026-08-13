import { useEffect, useState } from "react";
import z from "zod";
import EditFormDialog from "@/components/reusable/EditFormDialog";
import { useGetWorkspaceById } from "@/services/api/workspace/getWorkspaceById";
import type { BranchData } from "@/types/branch.types";
import type { DialogFieldConfig } from "@/types/dialog.types";
import type { WorkspaceData } from "@/types/workspace.types";
import { getWorkspaceTypeLabel } from "@/types/workspace.types";

const workspaceSchema = z.object({
  workspaceName: z.string().min(1, "Workspace name is required"),
  workspaceDepartment: z.string().min(1, "Department is required"),
  workspaceType: z.string().optional(),
  branchId: z.string().min(1, "Branch is required"),
  seq: z.coerce.number().min(1, "Sequence is required , Min value : 1"),
});

type UpdateFormData = {
  workspaceName: string;
  workspaceDepartment: string;
  workspaceType?: string;
  branchId: string;
  seq?: number;
};

type WorkspaceEditProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: UpdateFormData) => void;
  workspaceData: WorkspaceData | null;
  isLoading?: boolean;
  branches: BranchData[];
};

const WorkspaceEdit = ({
  open,
  onClose,
  onSubmit,
  workspaceData,
  isLoading,
  branches,
}: WorkspaceEditProps) => {
  // Fetch branches for the dropdown
  const branchOptions =
    branches.map((b) => ({
      value: b.branchId || "",
      label: b.branchName || "",
    })) || [];

  // Fetch fresh workspace data
  const { data: fetchedWorkspaceData, isLoading: isFetching } = useGetWorkspaceById(
    open && workspaceData ? workspaceData.workspaceId : null,
  );

  const [initialValues, setInitialValues] = useState<UpdateFormData>({
    workspaceName: "",
    workspaceDepartment: "",
    workspaceType: "",
    branchId: "",
    seq: 1,
  });

  useEffect(() => {
    const dataToUse = fetchedWorkspaceData || workspaceData;

    if (dataToUse) {
      setInitialValues({
        workspaceName: dataToUse.workspaceName,
        workspaceDepartment: dataToUse.workspaceDepartment,
        workspaceType: getWorkspaceTypeLabel(dataToUse.workspaceType || ""),
        branchId: dataToUse.branchId,
        seq: dataToUse.seq,
      });
    }
  }, [workspaceData, fetchedWorkspaceData]);

  const fields: DialogFieldConfig[] = [
    {
      name: "workspaceName",
      label: "Workspace Name",
      type: "text",
      placeholder: "Enter workspace name",
      gridSpan: 2,
    },
    {
      name: "workspaceDepartment",
      label: "Department",
      type: "text",
      placeholder: "Enter department",
      gridSpan: 2,
    },
    {
      name: "workspaceType",
      label: "Workspace Type",
      type: "text",
      placeholder: "Workspace Type",
      gridSpan: 2,
      disabled: true,
    },
    {
      name: "branchId",
      label: "Branch",
      type: "select",
      options: branchOptions,
      placeholder: "Select Branch",
      gridSpan: 2,
    },
    {
      name: "seq",
      label: "Sequence",
      type: "number",
      placeholder: "Enter sequence",
      gridSpan: 2,
    },
  ];

  const confirmationFields = [
    { name: "workspaceName", label: "Workspace Name" },
    { name: "workspaceDepartment", label: "Department" },
    {
      name: "workspaceType",
      label: "Workspace Type",
      format: (val: any) => getWorkspaceTypeLabel(val),
    },
    {
      name: "branchId",
      label: "Branch",
      format: (val: any) => branchOptions.find((b) => b.value === val)?.label || val,
    },
  ];

  return (
    <EditFormDialog
      open={open}
      onClose={onClose}
      onSubmit={onSubmit}
      title="Edit Workspace"
      submitButtonText="Save Changes"
      fields={fields}
      validationSchema={workspaceSchema}
      initialValues={initialValues}
      confirmationTitle="Confirm Changes"
      confirmationMessage="Are you sure you want to save these changes?"
      confirmationFields={confirmationFields}
      showConfirmation={true}
      isLoading={isLoading}
      isFetching={isFetching}
    />
  );
};

export default WorkspaceEdit;
