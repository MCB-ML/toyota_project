import { useEffect, useState } from "react";
import z from "zod";
import EditFormDialog from "@/components/reusable/EditFormDialog";
import { useGetCopilotAgentById } from "@/services/api/copilot/getCopilotAgentById";
import type { CopilotAgent, CopilotAgentWorkspace } from "@/types/copilot.types";
import type { DialogFieldConfig } from "@/types/dialog.types";

const copilotSchema = z.object({
  copilotAgentName: z.string().min(1, "Name is required"),
  copilotAgentDescription: z.string().min(1, "Description is required"),
  copilotAgentWebchatSecret: z.string().min(1, "Webchat Secret is required"),
  copilotAgentIsActive: z.boolean(),
  copilotAgentGreetings: z.string().min(1, "Greetings is required"),
  copilotAgentWorkspaceId: z.string().min(1, "Workspace is required"),
  seq: z.coerce.number().min(1, "Sequence is required , Min value : 1"),
});

type UpdateFormData = {
  copilotAgentName: string;
  copilotAgentDescription: string;
  copilotAgentWebchatSecret: string;
  copilotAgentIsActive: boolean;
  copilotAgentGreetings: string;
  copilotAgentWorkspaceId: string;
  seq: number;
};

type CopilotEditProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  copilotData: CopilotAgent | null;
  isLoading?: boolean;
  workspaces: CopilotAgentWorkspace[];
};

const CopilotEdit = ({
  open,
  onClose,
  onSubmit,
  copilotData,
  isLoading,
  workspaces,
}: CopilotEditProps) => {
  // Fetch latest copilot data
  const { data: fetchedData, isLoading: isFetching } = useGetCopilotAgentById(
    open && copilotData ? copilotData.copilotAgentId : "",
  );

  const [initialValues, setInitialValues] = useState<UpdateFormData>({
    copilotAgentName: "",
    copilotAgentDescription: "",
    copilotAgentWebchatSecret: "",
    copilotAgentIsActive: true,
    copilotAgentGreetings: "",
    copilotAgentWorkspaceId: "",
    seq: 1,
  });

  useEffect(() => {
    const dataToUse = fetchedData || copilotData;

    if (dataToUse) {
      setInitialValues({
        copilotAgentName: dataToUse.copilotAgentName || "",
        copilotAgentDescription: dataToUse.copilotAgentDescription || "",
        copilotAgentWebchatSecret: dataToUse.copilotAgentWebchatSecret || "",
        copilotAgentIsActive: !!dataToUse.copilotAgentIsActive,
        copilotAgentGreetings: dataToUse.copilotAgentGreetings || "",
        copilotAgentWorkspaceId: dataToUse.copilotAgentWorkspaceId || "",
        seq: dataToUse.seq || 1,
      });
    }
  }, [copilotData, fetchedData]);

  const fields: DialogFieldConfig[] = [
    {
      name: "copilotAgentName",
      label: "Agent Name",
      type: "text",
      placeholder: "Enter agent name",
      gridSpan: 2,
    },
    {
      name: "copilotAgentDescription",
      label: "Description",
      type: "text",
      placeholder: "Enter description",
      gridSpan: 2,
    },
    {
      name: "copilotAgentWorkspaceId",
      label: "Workspace",
      type: "select",
      options: workspaces.map((w) => ({
        value: w.workspaceId,
        label: w.workspaceName,
      })),
      placeholder: "Select Workspace",
      gridSpan: 2,
    },
    {
      name: "copilotAgentGreetings",
      label: "Greetings",
      type: "text",
      placeholder: "Enter greetings",
      gridSpan: 2,
    },
    {
      name: "copilotAgentWebchatSecret",
      label: "Webchat Secret",
      type: "text",
      placeholder: "Enter webchat secret",
      gridSpan: 2,
    },
    {
      name: "seq",
      label: "Sequence",
      type: "number",
      description: "Enter Sequence",
      gridSpan: 2,
    },
    {
      name: "copilotAgentIsActive",
      label: "Active Status",
      type: "switch",
      description: "Toggle this if agent should be active immediately",
      gridSpan: 2,
    },
  ];

  const confirmationFields = [
    { name: "copilotAgentName", label: "Agent Name" },
    { name: "copilotAgentDescription", label: "Description" },
    { name: "copilotAgentWebchatSecret", label: "Webchat Secret" },
    { name: "copilotAgentGreetings", label: "Greetings" },
    {
      name: "copilotAgentWorkspaceId",
      label: "Workspace",
      format: (val: any) => workspaces.find((w) => w.workspaceId === val)?.workspaceName || val,
    },
    {
      name: "copilotAgentIsActive",
      label: "Active Status",
      format: (val: any) => (val ? "Active" : "Inactive"),
    },
    { name: "seq", label: "Sequence" },
  ];

  const handleFormSubmit = (data: UpdateFormData) => {
    onSubmit(data);
  };

  return (
    <EditFormDialog
      open={open}
      onClose={onClose}
      onSubmit={handleFormSubmit}
      title="Edit Copilot Agent"
      submitButtonText="Save Changes"
      fields={fields}
      validationSchema={copilotSchema}
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

export default CopilotEdit;
