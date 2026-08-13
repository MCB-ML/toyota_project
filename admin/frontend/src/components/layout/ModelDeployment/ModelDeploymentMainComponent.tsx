import { useEffect, useReducer } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  useCreateModel,
  useDeleteModel,
  useGetAllModels,
  useUpdateModel,
} from "../../../services/api/model/model.api";
import { useUiHeaderStore } from "../../../store/uiHeaderStore";
import { getErrorMessage } from "../../../utils/getErrorMessage";
import DeleteConfirmDialog from "../../reusable/DeleteConfirmDialog";
import { ModelDeploymentField } from "./ModelDeployment.field";
import {
  ModelDeploymentStateInit,
  ModelDeploymentStateStateReducer,
} from "./ModelDeployment.reducer";
import ModelDeploymentTable from "./molecules/ModelDeploymentTable";
import ModelDeploymentForm from "./organism/ModelDeploymentForm";

const ModelDeploymentMainComponent = () => {
  const { t } = useTranslation();

  const [state, dispatch] = useReducer(ModelDeploymentStateStateReducer, ModelDeploymentStateInit);

  const { data: modelList, isLoading: modelLoading } = useGetAllModels();
  const { mutate: createModel, isPending: isCreating } = useCreateModel();
  const { mutate: deleteModel, isPending: isDeleting } = useDeleteModel();
  const { mutate: updateModel, isPending: isUpdating } = useUpdateModel();

  const { setHeaderAction } = useUiHeaderStore();

  useEffect(() => {
    setHeaderAction({
      label: t("ModelDeployment.addModel"),
      onClick: () => {
        dispatch({
          type: "showForm",
          payload: { show: true, mode: 1 },
        });
      },
      disabled: false,
    });
    return () => setHeaderAction(null);
  }, [setHeaderAction]);

  const handleSubmitForm = () => {
    const result = ModelDeploymentField.safeParse(state.form);

    if (!result.success) {
      toast.error("Validation failed", {
        description: result.error.issues[0]?.message,
      });
      return;
    }

    const isEdit = state.showForm.mode !== 1;

    if (!isEdit) {
      createModel(state.form, {
        onSuccess: (res: any) => {
          if (res?.success) {
            toast.success(" Created", {
              description: res.message || "Added successfully.",
            });
            dispatch({
              type: "showForm",
              payload: { show: false, mode: 0 },
            });
          }
        },
        onError: (error: unknown) => {
          toast.error("Failed to create branch", {
            description: getErrorMessage(error),
          });
        },
      });
    } else {
      updateModel(state.form, {
        onSuccess: (res: any) => {
          if (res?.success) {
            toast.success(" Update", {
              description: res.message || "Update successfully.",
            });
            dispatch({
              type: "showForm",
              payload: { show: false, mode: 0 },
            });
          }
        },
        onError: (error: unknown) => {
          toast.error("Failed to update", {
            description: getErrorMessage(error),
          });
        },
      });
    }
  };

  const deleteAzureById = async () => {
    const id = state.form.id;

    if (id)
      deleteModel(id, {
        onSuccess: (res: any) => {
          if (res) {
            toast.success("Azure Deleted", {
              description: res.message || "Azure deleted successfully.",
            });
            dispatch({
              type: "showForm",
              payload: { show: false, mode: 0 },
            });
          }
        },
        onError: (error: unknown) => {
          toast.error("Failed to delete branch", {
            description: getErrorMessage(error),
          });
        },
      });
  };
  return (
    <div className="h-full flex flex-col bg-[#f2f5fa] px-1 md:px-2 lg:px-3 py-1 md:py-2 lg:py-3">
      <ModelDeploymentTable
        data={modelList?.result ?? []}
        isLoading={modelLoading}
        onDelete={(row) => {
          dispatch({
            type: "setForm",
            payload: row,
          });
          dispatch({
            type: "showForm",
            payload: { show: false, mode: 3 },
          });
        }}
        onEdit={(row) => {
          dispatch({
            type: "setForm",
            payload: row,
          });
          dispatch({
            type: "showForm",
            payload: { show: true, mode: 2 },
          });
        }}
        className="flex-1 min-h-0"
      />

      <ModelDeploymentForm
        open={state.showForm.show}
        onClose={() =>
          dispatch({
            type: "showForm",
            payload: { show: false, mode: 0 },
          })
        }
        isLoading={isCreating || isUpdating}
        state={state}
        dispatch={dispatch}
        handleSubmitForm={handleSubmitForm}
      />

      <DeleteConfirmDialog
        open={state.showForm.mode === 3}
        onClose={() =>
          dispatch({
            type: "showForm",
            payload: { show: false, mode: 0 },
          })
        }
        onConfirm={deleteAzureById}
        title="Delete Company"
        description={`Are you sure you want to delete ${state.form?.displayName}? This action cannot be undone.`}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default ModelDeploymentMainComponent;
