import { useEffect, useReducer, useState } from "react";
import { toast } from "sonner";
import { useUiHeaderStore } from "@/store/uiHeaderStore";
import { useDeletePowerBI } from "../../../../services/api/powerBI/deletePowerBI";
import { useGetPowerBIById } from "../../../../services/api/powerBI/getPowerBIbyId";
import { useGetPowerBiByWorkspace } from "../../../../services/api/powerBI/getPowerBiByWorkspace";
import { useGetPowerBiSource } from "../../../../services/api/powerBI/getPowerBiSource";
import { useCreatePowerBI } from "../../../../services/api/powerBI/postCreatePowerBI";
import { useUpdatePowerBI } from "../../../../services/api/powerBI/putUpdatePowerBI";
import type {
  CreatePowerBiRequest,
  CreatePowerBiUpdateRequest,
  PowerBIData,
} from "../../../../types/powerBi.types";
import { getErrorMessage } from "../../../../utils/getErrorMessage";
import Button from "../../../reusable/Button";
import DeleteConfirmDialog from "../../../reusable/DeleteConfirmDialog";
import PowerBiForm from "../molecules/PowerBiForm";
import { PowerBiTabForm } from "../molecules/PowerBiTabForm";
import PowerBiTable from "../molecules/PowerBiTable";
import { initPowerBIData, PowerBIStateInit, PowerBIStateReducer } from "../PowerBI.reducer";
export interface PowerBiMainComponentProps {
  workspaceId: string;
  branchId: string;
}

const PowerBiMainComponent = ({ workspaceId, branchId }: PowerBiMainComponentProps) => {
  const [state, dispatch] = useReducer(PowerBIStateReducer, PowerBIStateInit);
  const [_isDialogOpen, _setIsDialogOpen] = useState(false);
  const { setHeaderAction } = useUiHeaderStore();
  const { data: powerBIdataById, isLoading: getById } = useGetPowerBIById(
    state.selectedPowerBI.Id ?? null,
  );
  const { mutate: createPowerBI, isPending: isCreating } = useCreatePowerBI();
  const { mutate: updatePowerBI, isPending: isUpdating } = useUpdatePowerBI();

  const { data: powerBIdataByWorkspace, isLoading: loadingData } = useGetPowerBiByWorkspace(
    workspaceId ?? null,
  );
  const { mutate: deletePowerBI, isPending: isDeleting } = useDeletePowerBI();

  //useEffect(() => {
  //  setHeaderAction({
  //    label: "Add Power BI",
  //    onClick: () => dispatch({ type: "showForm", show: true, mode: 1 }),
  //  });
  //  return () => setHeaderAction(null);
  //}, [setHeaderAction]);

  const getPowerBIById = () => {
    if (powerBIdataById) {
      const result = powerBIdataById.result;
      result.seq = result.seq || 1;
      dispatch({ type: "selectedPowerBI", payload: result });
    }
  };

  useEffect(() => {
    if (powerBIdataById?.success) {
      getPowerBIById();
    }
  }, [powerBIdataById, state.selectedPowerBI.Id]);

  const normalizeDataAgentForm = (form: CreatePowerBiUpdateRequest): CreatePowerBiUpdateRequest => {
    return {
      ...form,
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
    const data = state.selectedPowerBI;
    const isEdit = state.showFormMode === 2;
    data.branchId = branchId;

    if (isEdit) {
      const updatepayload: CreatePowerBiUpdateRequest = normalizeDataAgentForm(data);

      updatePowerBI(updatepayload, {
        onSuccess: (res) => {
          if (res) {
            toast.success("Power BI  Updated", {
              description: `Power BI ${data.agentName} updated successfully.`,
            });
            dispatch({ type: "showForm", show: false });
          }
        },
        onError: (error) => {
          toast.error("Failed to update Power BI ", {
            description: getErrorMessage(error),
          });
        },
      });
    } else {
      const payload: CreatePowerBiRequest = normalizeDataAgentForm(data);
      payload.workspace = workspaceId;
      createPowerBI(payload, {
        onSuccess: (res) => {
          if (res) {
            toast.success("Power BI  Created", {
              description: res.message || "New Power BI  added successfully.",
            });
            dispatch({ type: "showForm", show: false });
          }
        },
        onError: (error) => {
          toast.error("Failed to create Power BI ", {
            description: getErrorMessage(error),
          });
        },
      });
    }
  };

  const handleDelete = (row: PowerBIData) => {
    dispatch({ type: "selectedPowerBI", payload: row });
    dispatch({ type: "isDeleteOpen", payload: true });
    //   setSelectedBranch(row);
    //  setIsDeleteOpen(true);
  };

  const handleEdit = (row: PowerBIData) => {
    dispatch({ type: "selectedPowerBI", payload: row });
    dispatch({ type: "showForm", show: true, mode: 2 });
  };

  const confirmDelete = () => {
    //if (!state.selectedBranch) return;

    deletePowerBI(state.selectedPowerBI.Id, {
      onSuccess: (res) => {
        if (res) {
          toast.success("Branch Deleted", {
            description: res.message || "Branch deleted successfully.",
          });
          dispatch({ type: "isDeleteOpen", payload: false });
          dispatch({ type: "selectedPowerBI", payload: initPowerBIData });
          // setIsDeleteOpen(false);
          //    setSelectedBranch(null);
        }
      },
      onError: (error) => {
        toast.error("Failed to delete branch", {
          description: getErrorMessage(error),
        });
      },
    });
  };
  const onClickTabForm = (val: string) => dispatch({ type: "selectedTabForm", payload: val });

  const _onRenderTab = () => {
    return <PowerBiTabForm onClickTab={onClickTabForm} selectedTab={state.selectedTabForm} />;
  };
  const { data: powerBiHierarchy } = useGetPowerBiSource();

  const onSelectTabform = (tab: string) => dispatch({ type: "selectedTabForm", payload: tab });

  const addInputField = (operation: number, index: string, data: any) => {
    dispatch({
      type: "handleCrudField",
      operation: operation,
      index: index,
      sourceType: state.selectedTabForm,
      source: data,
    });
  };

  return (
    <>
      {/*<DataAgentCompanySelector*/}
      {/*          hierarchyData={powerBiHierarchy?.result ?? []}*/}
      {/*          cat="powerbi"*/}
      {/*          selectedCompany={state.selectedCompany}*/}
      {/*          selectedBranchId={state.selectedBranchId}*/}
      {/*          //  expandedCompanies={state.expandedCompanies}*/}
      {/*          dispatch={dispatch}         // selectedWorkspace={state.selectedWorkspace}*/}
      {/*/>*/}
      <div className="h-full flex flex-col pt-2">
        <Button
          className="mx-4  ml-auto h-7 mb-2 text-sm"
          onClick={() => dispatch({ type: "showForm", show: true, mode: 1 })}
        >
          + Add Power Bi
        </Button>
        <PowerBiTable
          data={powerBIdataByWorkspace?.result ?? []}
          isLoading={loadingData}
          onDelete={handleDelete}
          onEdit={handleEdit}
          selectedBranchId={branchId}
          className="flex-1 min-h-0"
        />
      </div>

      <PowerBiForm
        onSelectTabform={onSelectTabform}
        selectedTabForm={state.selectedTabForm}
        open={state.showForm}
        onClose={() => dispatch({ type: "showForm", show: false })}
        confirmationTitle="Confirm Addition"
        confirmationMessage="Are you sure you want to add this branch? Please review the information before confirming."
        //  confirmationFields={visibleConfirmationFields}
        showConfirmation={false}
        isLoading={isCreating || isUpdating}
        dispatch={dispatch}
        state={state}
        handleSubmitForm={handleCreateUpdate}
        addInputField={addInputField}
      />

      <DeleteConfirmDialog
        open={state.isDeleteOpen}
        onClose={() => dispatch({ type: "isDeleteOpen", payload: false })}
        onConfirm={confirmDelete}
        title="Delete Branch"
        description={`Are you sure you want to delete ${state.selectedPowerBI?.agentName}? This action cannot be undone.`}
        isLoading={isDeleting}
      />
    </>
  );
};

export default PowerBiMainComponent;
