import { Plus } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { FaTrash } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { DialogConfirmationField } from "@/types/dialog.types";
import { useGetAllWorkspaces } from "../../../../services/api/workspace/getAllWorkspaces";
import type { DataAgentSuggestionForm } from "../../../../types/dataAgent.types";
import { type PowerBIReducerState, TABS_POWERBI } from "../../../../types/powerBi.types";
import type { WorkspaceData } from "../../../../types/workspace.types";
import { FloatingCheckBox } from "../../../reusable/FloatingCheckBoxProps";
import FloatingInputField from "../../../reusable/FloatingInputField";
import FloatingSelectField from "../../../reusable/FloatingSelectField";
import LoadingPage from "../../../reusable/loadingPage";
import { PowerBiTabForm } from "./PowerBiTabForm";

export interface PowerBiFormProps {
  open: boolean;
  onClose: () => void;
  confirmationTitle?: string;
  confirmationMessage?: string;
  confirmationFields?: DialogConfirmationField[];
  showConfirmation?: boolean;
  isLoading: boolean;
  layOutSize?: string;
  preventCloseOnOutsideClick?: boolean;
  layOutSizeConfirmation?: string;
  state: PowerBIReducerState;
  dispatch?: React.Dispatch<any>;
  dispatchKey?: string;
  selectedTabForm: string;
  onSelectTabform: (value: string) => void;
  addInputField: (operation: number, index: string, data: any) => void;
  handleSubmitForm: () => void;
}

const PowerBiForm = ({
  open,
  onClose,
  isLoading,
  layOutSize = "max-h-[90vh] min-h-[500px] w-160 h-[670px]",
  dispatch,
  preventCloseOnOutsideClick,
  selectedTabForm,
  onSelectTabform,
  addInputField,
  state,
  handleSubmitForm,
}: PowerBiFormProps) => {
  const { data: workspacedataList, isLoading: loadingWorkspace } = useGetAllWorkspaces();

  const [errors, setErrors] = useState<Record<string, string>>({});

  const normalizeValue = (value: unknown) => {
    if (value === "") return null;
    return value;
  };

  const handleInputChange =
    (fieldName: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      dispatch?.({
        type: "selectedPowerBIFields",
        field: fieldName,
        value: normalizeValue(e.target.value),
      });
      if (errors[fieldName]) {
        setErrors((prev) => ({ ...prev, [fieldName]: "" }));
      }
    };

  const handleSelectChange = (fieldName: string) => (value: string) => {
    dispatch?.({
      type: "selectedPowerBIFields",
      field: fieldName,
      value: normalizeValue(value),
    });
    if (errors[fieldName]) {
      setErrors((prev) => ({ ...prev, [fieldName]: "" }));
    }
  };

  const handleCancelForm = () => {
    setErrors({});
    onClose();
  };

  return (
    <>
      {/* Main Form Dialog */}
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent
          className={` ${layOutSize}  max-w-3xl p-0 gap-0 overflow-visible flex flex-col`}
          preventCloseOnOutsideClick={true}
        >
          <DialogHeader className="px-6 py-4 border-b border-[#e5e7eb]">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-semibold text-[#101828]">
                {state.showFormMode === 1 ? "Add Data Agent" : "Update Data Agent"}
              </DialogTitle>
            </div>
          </DialogHeader>

          <LoadingPage isLoading={isLoading} />
          {/*    {tabContent?.useTab && (tabContent.content)}*/}

          <div className="flex flex-col flex-1 overflow-hidden">
            <div className=" overflow-y-auto overflow-x-visible flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1  gap-y-5">
                <div className="md:col-span-2 items-center ">
                  <div className="flex items-center justify-between w-full">
                    <PowerBiTabForm onClickTab={onSelectTabform} selectedTab={selectedTabForm} />
                  </div>
                </div>
                <div
                  className={`md:col-span-2 px-3 pb-5 space-y-4 ${
                    selectedTabForm === TABS_POWERBI.GENERAL ? "" : "hidden"
                  }`}
                >
                  <div className="md:col-span-2">
                    <FloatingInputField
                      id="agentName"
                      label="Agent Name"
                      value={state.selectedPowerBI.agentName}
                      type="text"
                      onChange={handleInputChange("agentName")}
                      placeholder="Enter dataAgent"
                      error={false}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <FloatingInputField
                      id="desc"
                      label="Description"
                      value={state.selectedPowerBI.desc}
                      type="text"
                      onChange={handleInputChange("desc")}
                      placeholder="Enter dataAgent"
                      error={false}
                    />
                  </div>
                  <div className={`${state.showFormMode === 1 ? "hidden" : ""} md:col-span-2`}>
                    <FloatingSelectField
                      id="workspace"
                      label="Workspace"
                      value={state.selectedPowerBI?.workspace ?? ""}
                      onChange={handleSelectChange("workspace")}
                      error={!!errors.workspace}
                      placeholder="Select Workspace"
                      options={
                        workspacedataList?.workspaces
                          ?.filter(
                            (data: WorkspaceData) => data.branchId === state.selectedBranchId,
                          )
                          .map((data: WorkspaceData) => ({
                            value: data.workspaceId,
                            label: data.workspaceName,
                          })) ?? []
                      }
                    />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <FloatingCheckBox
                        id="isReport"
                        label="Report"
                        value={state.selectedPowerBI.isReport}
                        onChangeField={(checked) => {
                          dispatch?.({
                            type: "selectedPowerBIFields",
                            field: "isReport",
                            value: checked,
                          });
                        }}
                        error={false}
                      />
                    </div>

                    <div className="flex-1">
                      <FloatingCheckBox
                        id="isChatAgent"
                        label="Chat Agent"
                        value={state.selectedPowerBI.isChatAgent}
                        onChangeField={(checked) => {
                          dispatch?.({
                            type: "selectedPowerBIFields",
                            field: "isChatAgent",
                            value: checked,
                          });
                        }}
                        error={false}
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <FloatingInputField
                      id="seq"
                      label="Sequence"
                      value={state.selectedPowerBI.seq}
                      type="number"
                      onChange={handleInputChange("seq")}
                      placeholder="Enter Sequence"
                      error={false}
                    />
                  </div>
                  <div className="md:col-span-2 flex items-center justify-between p-4 bg-white rounded-lg border border-[#e5e7eb]`">
                    <div className="space-y-0.5">
                      <Label className="text-base font-medium text-[#101828]">Active Status</Label>
                      <div className="text-sm text-[#a4a4a4]">
                        Toggle this if should be active immediately
                      </div>
                    </div>
                    <Switch
                      id="isActive"
                      checked={state.selectedPowerBI.isActive}
                      onCheckedChange={(checked) => {
                        dispatch?.({
                          type: "selectedPowerBIFields",
                          field: "isActive",
                          value: checked,
                        });
                      }}
                    />
                  </div>
                </div>

                <div
                  className={`md:col-span-2 px-3  ${
                    selectedTabForm === TABS_POWERBI.REPORT ? "" : "hidden"
                  }`}
                >
                  <FloatingInputField
                    id="tenantID"
                    label="Tenant ID"
                    value={state.selectedPowerBI.tenantID}
                    type="text"
                    onChange={handleInputChange("tenantID")}
                    placeholder="Enter Azure Tenant ID"
                    error={false}
                  />
                  <FloatingInputField
                    id="clientID"
                    label="Client ID"
                    value={state.selectedPowerBI.clientID}
                    type="text"
                    onChange={handleInputChange("clientID")}
                    placeholder="Enter Azure Client ID"
                    error={false}
                  />
                  <FloatingInputField
                    id="clientSecret"
                    label="Client Secret"
                    value={state.selectedPowerBI.clientSecret}
                    type="password"
                    onChange={handleInputChange("clientSecret")}
                    placeholder="Enter Azure Client Secret"
                    error={false}
                  />
                  <FloatingInputField
                    id="workspaceID"
                    label="Workspace ID"
                    value={state.selectedPowerBI.workspaceID}
                    type="text"
                    onChange={handleInputChange("workspaceID")}
                    placeholder="Enter Power BI Workspace ID"
                    error={false}
                  />
                  <FloatingInputField
                    id="reportID"
                    label="Report ID"
                    value={state.selectedPowerBI.reportID}
                    type="text"
                    onChange={handleInputChange("reportID")}
                    placeholder="Enter Power BI Report ID"
                    error={false}
                  />
                  <FloatingInputField
                    id="pageID"
                    label="Page ID"
                    value={state.selectedPowerBI.pageID ?? ""}
                    type="text"
                    onChange={handleInputChange("pageID")}
                    placeholder="Enter Power BI Page ID"
                    error={false}
                  />
                </div>

                <div
                  className={`md:col-span-2 space-y-5 px-3  ${
                    selectedTabForm === TABS_POWERBI.SUGGESTION ? "" : "hidden"
                  }`}
                >
                  {" "}
                  <button
                    title="Add"
                    onClick={() => addInputField(1, "", "")}
                    className="mb-6 flex items-center justify-center cursor-pointer bg-blue-600 text-white rounded-xl ml-auto mr-5"
                  >
                    <Plus size={16} />
                  </button>
                  {state.selectedPowerBI?.suggestion?.map(
                    (data: DataAgentSuggestionForm, _index: number) => (
                      <div
                        className="border-b pb-5 last:border-b-0 relative"
                        key={data.id ?? ""}
                        id={data.id ?? ""}
                      >
                        <button
                          className="absolute text-[#E30018] hover:text-[#f80019] right-5 top-2 z-50"
                          type="button"
                          onClick={() => addInputField(3, data.id ?? "", "")}
                          title="Remove"
                        >
                          <FaTrash size={14} />
                        </button>
                        <FloatingInputField
                          id={`Keyword${data.id}`}
                          label="Keyword"
                          value={data.keyword}
                          type="text"
                          onChange={(e) =>
                            addInputField(2, data.id ?? "", { keyword: e.target.value })
                          }
                          placeholder="Enter Keyword"
                          error={false}
                        />
                        <FloatingInputField
                          id={`Prompt${data.id}`}
                          label="Prompt"
                          value={data.prompt}
                          type="text"
                          onChange={(e) =>
                            addInputField(2, data.id ?? "", { prompt: e.target.value })
                          }
                          placeholder="Enter Prompt"
                          error={false}
                        />
                      </div>
                    ),
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="px-6 py-4 border-t border-[#e5e7eb] gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelForm}
                className="w-full md:w-auto cursor-pointer"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSubmitForm}
                className="w-full md:w-auto bg-[#1a73e8] hover:bg-[#1557b0] cursor-pointer"
                disabled={isLoading}
              >
                {state.showFormMode === 1 ? "Add" : "Update"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PowerBiForm;
