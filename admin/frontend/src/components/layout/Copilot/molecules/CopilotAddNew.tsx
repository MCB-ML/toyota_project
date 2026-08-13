import z from "zod";
import AddNewFormDialog from "@/components/reusable/AddNewFormDialog";
import type { DialogFieldConfig } from "@/types/dialog.types";

const copilotSchema = z.object({
  copilotAgentName: z.string().min(1, "Name is required"),
  copilotAgentDescription: z.string().min(1, "Description is required"),
  copilotAgentWebchatSecret: z.string().min(1, "Webchat Secret is required"),
  copilotAgentIsActive: z.boolean(),
  copilotAgentGreetings: z.string().min(1, "Greetings is required"),
  seq: z.coerce.number().min(1, "Sequence is required , Min value : 1"),
  // Workspace ID is now handled by the parent component context
});

type CopilotFormData = z.infer<typeof copilotSchema>;

type CopilotAddNewProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
};

const CopilotAddNew = ({ open, onClose, onSubmit, isLoading }: CopilotAddNewProps) => {
  const initialValues: CopilotFormData = {
    copilotAgentName: "",
    copilotAgentDescription: "",
    copilotAgentWebchatSecret: "",
    copilotAgentIsActive: true,
    copilotAgentGreetings: "",
    seq: 1,
  };

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
      name: "copilotAgentIsActive",
      label: "Active Status",
      format: (val: any) => (val ? "Active" : "Inactive"),
    },
    { name: "seq", label: "Sequence" },
  ];

  const handleFormSubmit = (data: CopilotFormData) => {
    onSubmit(data);
  };

  return (
    <AddNewFormDialog
      open={open}
      onClose={onClose}
      onSubmit={handleFormSubmit}
      title="Add New Copilot Agent"
      submitButtonText="Add Agent"
      fields={fields}
      validationSchema={copilotSchema}
      initialValues={initialValues}
      confirmationTitle="Confirm Addition"
      confirmationMessage="Are you sure you want to add this copilot agent?"
      confirmationFields={confirmationFields}
      showConfirmation={true}
      isLoading={isLoading}
    />
  );
};

export default CopilotAddNew;
