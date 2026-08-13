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
import {
  type DataAgentInstructionForm,
  type DataAgentReducerState,
  type DataAgentSuggestionForm,
  TABS_DATAAGENT,
} from "../../../../types/dataAgent.types";
import type { WorkspaceData } from "../../../../types/workspace.types";
import FloatingInputField from "../../../reusable/FloatingInputField";
import FloatingSelectField from "../../../reusable/FloatingSelectField";
import LoadingPage from "../../../reusable/loadingPage";
import { InstructionField } from "../atoms/InstructionField";
import SourceForm from "./form/SourceForm";
import { DataAgentGroupTabsForm } from "./tab/DataAgentGroupTabsForm";

export interface DataAgentFormCrudProps {
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
  state: DataAgentReducerState;
  dispatch?: React.Dispatch<any>;
  dispatchKey?: string;
  selectedTabForm: string;
  onSelectTabform: (value: string) => void;
  addInputField: (operation: number, index: string, data: any) => void;
  handleSubmitForm: () => void;
}

const DataAgentFormCrud = ({
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
}: DataAgentFormCrudProps) => {
  const { data: workspacedataList, isLoading: loadingWorkspace } = useGetAllWorkspaces();

  const [errors, setErrors] = useState<Record<string, string>>({});

  const normalizeValue = (value: unknown) => {
    if (value === "") return null;
    return value;
  };

  const handleInputChange =
    (fieldName: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      dispatch?.({
        type: "selectedDataAgentFields",
        field: fieldName,
        value: normalizeValue(e.target.value),
      });
      if (errors[fieldName]) {
        setErrors((prev) => ({ ...prev, [fieldName]: "" }));
      }
    };

  const handleSelectChange = (fieldName: string) => (value: string) => {
    dispatch?.({
      type: "selectedDataAgentFields",
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
  const selectedSqlSources = state.dataAgentForm?.source?.filter((s) => s.type === "sql") || [];
  const selectedRagSources = state.dataAgentForm?.source?.filter((s) => s.type === "rag") || [];

  const hiddenTabs = [
    TABS_DATAAGENT.GENERAL_FORM,
    TABS_DATAAGENT.SQL_FORM,
    TABS_DATAAGENT.RAG_FORM,
  ] as const;
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
            <div className="px-6 py-4 overflow-y-auto overflow-x-visible flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1  gap-y-5">
                <div className="md:col-span-2 items-center ">
                  <div className="flex items-center justify-between w-full">
                    <DataAgentGroupTabsForm
                      onClickTab={onSelectTabform}
                      selectedTab={selectedTabForm}
                    />
                    {!hiddenTabs.includes(selectedTabForm as (typeof hiddenTabs)[number]) && (
                      <button
                        title="Add"
                        onClick={() => addInputField(1, "", "")}
                        className="mb-6 flex items-center justify-center cursor-pointer bg-blue-600 text-white rounded-xl"
                      >
                        <Plus size={16} />
                      </button>
                    )}
                  </div>
                </div>
                <div
                  className={`md:col-span-2  space-y-4 ${
                    selectedTabForm === TABS_DATAAGENT.GENERAL_FORM ? "" : "hidden"
                  }`}
                >
                  <div className="md:col-span-2">
                    <FloatingInputField
                      id="agentName"
                      label="Agent Name"
                      value={state.dataAgentForm.agentName}
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
                      value={state.dataAgentForm.desc}
                      type="text"
                      onChange={handleInputChange("desc")}
                      placeholder="Enter dataAgent"
                      error={false}
                    />
                  </div>
                  <div className={`${state.showFormMode === 1 ? "hidden" : ""} md:col-span-2`}>
                    <FloatingSelectField
                      id="workspaceId"
                      label="Workspace"
                      value={state.dataAgentForm.workspaceId}
                      onChange={handleSelectChange("workspaceId")}
                      error={!!errors.workspaceID}
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
                  <div className="md:col-span-2">
                    <FloatingInputField
                      id="seq"
                      label="Sequence"
                      value={state.dataAgentForm.seq}
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
                      checked={state.dataAgentForm.isActive}
                      onCheckedChange={(checked) => {
                        dispatch?.({
                          type: "selectedDataAgentFields",
                          field: "isActive",
                          value: checked,
                        });
                      }}
                    />
                    {/*<FloatingCheckBox*/}
                    {/*  id="isActive"*/}
                    {/*  label={"is Active"}*/}
                    {/*  value={state.dataAgentForm.isActive}*/}
                    {/*  onChangeField={onToggleActive("isActive")}*/}
                    {/*  error={false}*/}
                    {/*/>*/}
                  </div>
                </div>

                <div
                  className={`md:col-span-2  ${
                    selectedTabForm === TABS_DATAAGENT.INSTRUCTION_FORM ? "" : "hidden"
                  }`}
                >
                  {state.dataAgentForm?.instruction?.map(
                    (data: DataAgentInstructionForm, _index: number) => (
                      <div className="py-2" key={data.id ?? _index}>
                        <InstructionField
                          id={data.id ?? ""}
                          label={""}
                          value={data.text}
                          fileName={data.fileName}
                          onChangeField={(text: string, fileName: string) =>
                            addInputField(2, data.id ?? "", {
                              text,
                              fileName: fileName,
                            })
                          }
                          onRemoveField={() => addInputField(3, data.id ?? "", "")}
                        />
                      </div>
                    ),
                  )}
                </div>
                <div
                  className={`md:col-span-2 ${
                    selectedTabForm === TABS_DATAAGENT.SQL_FORM ? "" : "hidden"
                  }`}
                >
                  <SourceForm
                    key="sql"
                    selectedCompany={state.selectedCompany}
                    dataAgentForm={selectedSqlSources}
                    addInputField={addInputField}
                    sourceType={"sql"}
                  />
                </div>
                <div
                  className={`md:col-span-2 ${
                    selectedTabForm === TABS_DATAAGENT.RAG_FORM ? "" : "hidden"
                  }`}
                >
                  <SourceForm
                    key="rag"
                    selectedCompany={state.selectedCompany}
                    dataAgentForm={selectedRagSources}
                    addInputField={addInputField}
                    sourceType={"rag"}
                  />
                </div>
                <div
                  className={`md:col-span-2 space-y-5 ${
                    selectedTabForm === TABS_DATAAGENT.SUGGESTION ? "" : "hidden"
                  }`}
                >
                  {state.dataAgentForm?.suggestion?.map(
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

export default DataAgentFormCrud;
