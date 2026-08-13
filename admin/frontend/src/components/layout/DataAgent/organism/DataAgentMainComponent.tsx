import { useReducer } from "react";
import { toast } from "sonner";
import { useCreateDataAgent } from "../../../../services/api/dataAgent/createDataAgent";
import { useDeleteDataAgent } from "../../../../services/api/dataAgent/deleteDataAgent";
import { useGetDataAgentById } from "../../../../services/api/dataAgent/getDataAgentById";
import { useGetDataAgentByWorkspace } from "../../../../services/api/dataAgent/getDataAgentByWorkspace";
import { useGetDataAgentSource } from "../../../../services/api/dataAgent/getDataAgentSource";
import { useUpdateDataAgent } from "../../../../services/api/dataAgent/updateDataAgent";
import { type DataAgentForm, TABS_DATAAGENT } from "../../../../types/dataAgent.types";
import { getErrorMessage } from "../../../../utils/getErrorMessage";
import Button from "../../../reusable/Button";
import DeleteConfirmDialog from "../../../reusable/DeleteConfirmDialog";
import PowerBiMainComponent from "../../PowerBI/organism/PowerBiMainComponent";
import { DataAgentBaseSchema } from "../DataAgent.Field";
import { DataAgenStateInit, DataAgenStateReducer, initDataAGentForm } from "../DataAgent.reducer";
import DataAgentCompanySelector from "../molecules/DataAgentCompanySelector";
import DataAgentFormCrud from "../molecules/DataAgentFormCrud";
import { DataAgentGroupTabs } from "../molecules/tab/DataAgentGroupTabs";
import DataAgentTable from "../molecules/table/DataAgentTable";

const DataAgentMainComponent = () => {
  const [state, dispatch] = useReducer(DataAgenStateReducer, DataAgenStateInit);

  //const { data: DataAgentById, isLoading: isGetById } = useGetDataAgentById(
  //    state.dataAgentForm.dataAgentId ?? null,
  //);
  const { mutateAsync, isPending: isGetById } = useGetDataAgentById();

  const { data: DataAgentByBranch } = useGetDataAgentByWorkspace(state.selectedWorkspace ?? null);
  const { mutate: createDataAGent, isPending: isCreating } = useCreateDataAgent();
  const { mutate: deleteDataAGent, isPending: isDelete } = useDeleteDataAgent();
  const { mutate: updateDataAGent, isPending: isUpdating } = useUpdateDataAgent();

  //const getDataAgenthById = () => {

  //    if (DataAgentById) {
  //        const result = DataAgentById.result;

  //        dispatch({ type: "selectedDataAgent", payload: result });
  //    }
  //};

  const normalizeDataAgentForm = (form: DataAgentForm): DataAgentForm => {
    return {
      ...form,
      instruction: form.instruction?.map((item) => {
        if (typeof item.id === "string") {
          const { id, ...rest } = item;
          return rest;
        }
        return item;
      }),
      source: form.source?.map((item) => {
        if (typeof item.id === "string") {
          const { id, ...rest } = item;
          return rest;
        }
        return item;
      }),
      suggestion: form.suggestion?.map((item) => {
        if (typeof item.id === "string") {
          const { id, ...rest } = item;
          return rest;
        }
        return item;
      }),
    };
  };

  const handleCreateUpdate = () => {
    const isEdit = state.showFormMode === 2;

    if (!state.dataAgentForm.seq) state.dataAgentForm.seq = 1;
    const result = DataAgentBaseSchema.safeParse(state.dataAgentForm);

    if (!result.success) {
      toast.error("Validation failed", {
        description: result.error.issues[0]?.message,
      });

      return;
    }

    const normalizedForm = normalizeDataAgentForm(state.dataAgentForm);

    normalizedForm.branchId = state.selectedBranchId;

    normalizedForm.instruction = normalizedForm.instruction?.filter(
      (item: any) => item.fileName?.trim() || item.text?.trim(),
    );

    normalizedForm.source = normalizedForm.source?.filter((item: any) => item.source?.trim());

    normalizedForm.suggestion = normalizedForm.suggestion?.filter(
      (item: any) => item.keyword?.trim() || item.prompt?.trim(),
    );

    if (isEdit) {
      updateDataAGent(normalizedForm, {
        onSuccess: (res) => {
          if (res) {
            toast.success("Data Agent Updated", {
              description: `Data Agent  ${state.dataAgentForm.agentName} updated successfully.`,
            });
            dispatch({ type: "showForm", show: false });
          }
        },
        onError: (error) => {
          toast.error("Failed to update Data Agent  ", {
            description: getErrorMessage(error),
          });
        },
      });
    } else {
      normalizedForm.workspaceId = state.selectedWorkspace;
      createDataAGent(normalizedForm, {
        onSuccess: (res) => {
          if (res) {
            toast.success("Data Agent   Created", {
              description: res.message || "New Data Agent  added successfully.",
            });
            dispatch({ type: "showForm", show: false });
          }
        },
        onError: (error) => {
          toast.error("Failed to create Data Agent  ", {
            description: getErrorMessage(error),
          });
        },
      });
    }
  };

  //useEffect(() => {
  //    if (
  //        state.selectedTab === TABS_DATAAGENT.AGENT &&
  //        state.showFormMode === 2 &&
  //        DataAgentById?.success
  //    ) {
  //        getDataAgenthById();
  //    }
  //}, [DataAgentById, state.dataAgentForm.dataAgentId]);

  const onSelectTabform = (tab: string) => dispatch({ type: "selectedTabForm", payload: tab });

  const onSelectTab = (tab: string) => dispatch({ type: "selectedTab", payload: tab });

  const addInputField = (operation: number, index: string, data: any) => {
    dispatch({
      type: "handleCrudField",
      operation: operation,
      index: index,
      sourceType: state.selectedTabForm,
      source: data,
    });
  };

  const onEditTable = async (row: DataAgentForm) => {
    dispatch({ type: "showForm", show: true, mode: 2 });

    const result = await mutateAsync(row.dataAgentId ?? "");
    if (result?.result) dispatch({ type: "selectedDataAgent", payload: result?.result ?? {} });
  };

  const onDeletetRow = (row: DataAgentForm) => {
    dispatch({ type: "selectedDataAgent", payload: row });
    dispatch({ type: "isDeleteOpen", payload: true });
  };

  const confirmDelete = () => {
    if (!state.dataAgentForm.dataAgentId) return;

    deleteDataAGent(state.dataAgentForm.dataAgentId ?? "", {
      onSuccess: (res) => {
        if (res) {
          toast.success("Data Agent Deleted", {
            description: res.message || "Data Agent  deleted successfully.",
          });
          dispatch({ type: "isDeleteOpen", payload: false });
          dispatch({ type: "selectedDataAgent", payload: initDataAGentForm });
        }
      },
      onError: (error) => {
        toast.error("Failed to delete Data Agent ", {
          description: getErrorMessage(error),
        });
      },
    });
  };

  const { data: dataAgentHierarchy } = useGetDataAgentSource();

  return (
    <div className="h-full flex flex-col bg-[#f2f5fa] lg:pl-2 md:px-2 lg:px-1 py-1 md:py-2 lg:py-3">
      <div className="flex flex-col lg:flex-row gap-2 flex-1 h-full ">
        <DataAgentCompanySelector
          hierarchyData={dataAgentHierarchy?.result ?? []}
          cat={"dataagent"}
          selectedCompany={state.selectedCompany}
          selectedBranchId={state.selectedBranchId}
          //expandedCompanies={state.expandedCompanies}
          dispatch={dispatch}
        />

        <div className="flex-1 flex flex-col bg-white rounded-xl border border-[#e5e7eb] shadow min-w-0 overflow-hidden">
          <DataAgentGroupTabs
            onAddDataAgent={() => dispatch({ type: "showForm", show: true, mode: 1 })}
            onAddDataset={() =>
              dispatch({
                type: "showDatasetDialog",
                payload: {
                  show: true,
                  type: state.selectedTab === TABS_DATAAGENT.TABLE ? 1 : 2,
                },
              })
            }
            onClickTab={onSelectTab}
            selectedTab={state.selectedTab}
          />

          {state.selectedTab === TABS_DATAAGENT.AGENT && (
            <div className="pt-2">
              <Button
                className="mx-4  ml-auto h-7 mb-2 text-sm"
                onClick={() => dispatch({ type: "showForm", show: true, mode: 1 })}
              >
                + Add Data Agent
              </Button>
              <DataAgentTable
                data={DataAgentByBranch?.result ?? []}
                onDelete={onDeletetRow}
                onEdit={onEditTable}
              />
            </div>
          )}
          {state.selectedTab === TABS_DATAAGENT.POWER_BI && (
            <PowerBiMainComponent
              workspaceId={state.selectedWorkspace}
              branchId={state.selectedBranchId}
            />
          )}
        </div>
      </div>

      <DataAgentFormCrud
        onSelectTabform={onSelectTabform}
        selectedTabForm={state.selectedTabForm}
        open={state.showForm}
        onClose={() => dispatch({ type: "showForm", show: false })}
        confirmationTitle="Confirm Addition"
        confirmationMessage="Are you sure you want to add this branch? Please review the information before confirming."
        //  confirmationFields={visibleConfirmationFields}
        showConfirmation={false}
        isLoading={isGetById || isCreating || isUpdating}
        dispatch={dispatch}
        state={state}
        addInputField={addInputField}
        handleSubmitForm={handleCreateUpdate}
        // preventCloseOnOutsideClick={true}
      />

      <DeleteConfirmDialog
        open={state.isDeleteOpen}
        onClose={() => dispatch({ type: "isDeleteOpen", payload: false })}
        onConfirm={confirmDelete}
        title="Delete Branch"
        description={`Are you sure you want to delete ${state.dataAgentForm?.agentName}? This action cannot be undone.`}
        isLoading={isDelete}
      />
    </div>
  );
};

export default DataAgentMainComponent;
