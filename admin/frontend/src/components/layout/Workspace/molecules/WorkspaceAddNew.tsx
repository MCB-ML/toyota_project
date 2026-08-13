import z from "zod";
import AddNewFormDialog from "@/components/reusable/AddNewFormDialog";
import type { BranchData } from "@/types/branch.types";
import type { DialogFieldConfig } from "@/types/dialog.types";
import { getWorkspaceTypeLabel, WORKSPACE_TYPE_LABELS } from "@/types/workspace.types";

const workspaceSchema = z.object({
  workspaceName: z.string().min(1, "Workspace name is required"),
  workspaceDepartment: z.string().min(1, "Department is required"),
  workspaceType: z.string().min(1, "Workspace type is required"),
  branchId: z.string().min(1, "Branch is required"),
  seq: z.coerce.number().min(1, "Sequence is required , Min value : 1"),
});

type WorkspaceFormData = z.infer<typeof workspaceSchema>;

type WorkspaceAddNewProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: WorkspaceFormData) => void;
  isLoading?: boolean;
  selectedBranchId?: string;
  branches: BranchData[];
};

const WorkspaceAddNew = ({
  open,
  onClose,
  onSubmit,
  isLoading,
  selectedBranchId,
  branches,
}: WorkspaceAddNewProps) => {
  // Fetch branches for the dropdown
  const branchOptions =
    branches.map((b) => ({
      value: b.branchId || "",
      label: b.branchName || "",
    })) || [];

  const initialValues: WorkspaceFormData = {
    workspaceName: "",
    workspaceDepartment: "",
    workspaceType: "",
    branchId: selectedBranchId || "",
    seq: 1,
  };

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
      type: "select",
      options: [
        /*    { label: WORKSPACE_TYPE_LABELS.powerBI, value: "powerBI" },*/
        { label: WORKSPACE_TYPE_LABELS.dataAgent, value: "dataAgent" },
        { label: WORKSPACE_TYPE_LABELS.aiAgent, value: "aiAgent" },
        { label: WORKSPACE_TYPE_LABELS.copilotAgent, value: "copilotAgent" },
      ],
      placeholder: "Select workspace type",
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

  const visibleConfirmationFields = selectedBranchId
    ? confirmationFields.filter((f) => f.name !== "branchId")
    : confirmationFields;

  return (
    <AddNewFormDialog
      open={open}
      onClose={onClose}
      onSubmit={onSubmit}
      title="Add New Workspace"
      submitButtonText="Add Workspace"
      fields={fields}
      validationSchema={workspaceSchema}
      initialValues={initialValues}
      confirmationTitle="Confirm Addition"
      confirmationMessage="Are you sure you want to add this workspace? Please review the information before confirming."
      confirmationFields={visibleConfirmationFields}
      showConfirmation={true}
      isLoading={isLoading}
    />
  );
};

export default WorkspaceAddNew;
