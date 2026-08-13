import { useEffect, useReducer } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import DeleteConfirmDialog from "@/components/reusable/DeleteConfirmDialog";
import { useDeleteCompany } from "@/services/api/company/deleteCompany";
import { useGetAllCompanyList } from "@/services/api/company/getAllCompany";
import { useCreateCompany } from "@/services/api/company/postCreateCompany";
import { useUpdateCompany } from "@/services/api/company/putUpdateCompany";
import { useUiHeaderStore } from "@/store/uiHeaderStore";
import { useGetCompanyById } from "../../../../services/api/company/getCompanyById";
import type { CompanyInfoData } from "../../../../types/companyInfo.types";
import { getErrorMessage } from "../../../../utils/getErrorMessage";
import DatasetSource from "../../Dataset/organism/DatasetSource";
import DatasetImport from "../../Dataset/page/DatasetImport";
import { getCompanySchema } from "../Company.field";
import { CompanyStateInit, CompanyStateReducer } from "../Company.reducer";
import CompanyTable from "../molecules/CompanyTable";
import CompanyForm from "../organism/CompanyForm";
import ConnectionDialog from "../organism/ConnectionDialog";

const CompanyInfoMainComponent = () => {
  const { t } = useTranslation();
  const [state, dispatch] = useReducer(CompanyStateReducer, CompanyStateInit);

  const { setHeaderAction } = useUiHeaderStore();
  useEffect(() => {
    setHeaderAction({
      label: t("CompanyInfo.addNewTitle"),
      onClick: () => {
        dispatch({
          type: "show_company_form",
          payload: { show: true, mode: 1 },
        });
      },
      disabled: state.loading,
    });
    return () => setHeaderAction(null);
  }, [setHeaderAction, state.loading, t]);

  const { data: companyListAll, isLoading } = useGetAllCompanyList();

  const { mutate: createCompany, isPending: isCreating } = useCreateCompany();
  const { data: companyById, isLoading: isFetching } = useGetCompanyById(
    state.isDialogOpen.id ?? null,
  );
  const { mutate: deleteCompany, isPending: isDeleting } = useDeleteCompany();
  const { mutate: updateCompany, isPending: isUpdating } = useUpdateCompany();

  const _isDataAgentActive = true;

  const _resetForm = () => {
    dispatch({ type: "company_form_reset" });
    dispatch({
      type: "show_company_form",
      payload: { show: false, mode: 1, id: "" },
    });
  };

  const handleDeleteCompany = (row: CompanyInfoData) => {
    dispatch({
      type: "delete_company_confirmation",
      payload: { show: true, mode: 1, id: row.companyId },
    });
  };

  const handleEditCompany = (row: CompanyInfoData) => {
    dispatch({
      type: "show_company_form",
      payload: { show: true, mode: 2, id: row.companyId },
    });
  };

  const handleSubmitForm = async () => {
    const CompanyField = getCompanySchema(t);
    const result = CompanyField.safeParse(state.companyFormData);

    if (!result.success) {
      toast.error(t("CompanyInfo.error.validation"), {
        description: result.error.issues[0]?.message,
      });
      return;
    }

    const isEdit = state.isDialogOpen.mode !== 1;

    // 화면은 용도 6칸을 항상 그리지만, 모델을 고르지 않은 칸은 저장하지 않는다.
    // 빈 값을 그대로 보내면 DB 의 model_id NOT NULL 제약에 걸린다.
    const payload = {
      ...state.companyFormData,
      deployments: (state.companyFormData.deployments ?? []).filter((d) => !!d.modelId),
    };

    if (!isEdit) {
      createCompany(payload, {
        onSuccess: (res) => {
          if (res?.success) {
            toast.success(t("CompanyInfo.success.createdTitle"), {
              description: res.message || t("CompanyInfo.success.createdDesc"),
            });
            dispatch({
              type: "show_company_form",
              payload: { show: false, mode: 1 },
            });
          }
        },
        onError: (error) => {
          toast.error(t("CompanyInfo.error.create"), {
            description: getErrorMessage(error),
          });
        },
      });
    } else {
      updateCompany(payload, {
        onSuccess: (res) => {
          if (res?.success) {
            toast.success(t("CompanyInfo.success.updatedTitle"), {
              description: res.message || t("CompanyInfo.success.updatedDesc"),
            });
            dispatch({
              type: "show_company_form",
              payload: { show: false, mode: 1 },
            });
          }
        },
        onError: (error) => {
          toast.error(t("CompanyInfo.error.update"), {
            description: getErrorMessage(error),
          });
        },
      });
    }
  };

  const deleteCompanyById = async () => {
    const id = state.isDeleteDialogOpen.id;

    if (id)
      deleteCompany(id, {
        onSuccess: (res) => {
          if (res) {
            toast.success(t("CompanyInfo.success.deletedTitle"), {
              description: res.message || t("CompanyInfo.success.deletedDesc"),
            });
            dispatch({
              type: "delete_company_confirmation",
              payload: { show: false, mode: 1, id: "" },
            });
          }
        },
        onError: (error) => {
          toast.error(t("CompanyInfo.error.delete"), {
            description: getErrorMessage(error),
          });
        },
      });
  };

  useEffect(() => {
    if (companyById?.success) {
      const result = companyById.result;

      dispatch({ type: "company_form", payload: result });
    }
  }, [companyById]);
  //useEffect(() => {
  //    console.log("state.showConnection.data", state.showConnection.data)
  //}, [state.showConnection.show]);
  return (
    <div className="h-full flex flex-col bg-[#f2f5fa] px-1 md:px-2 lg:px-3 py-1 md:py-2 lg:py-3">
      {/* Company Table */}
      <CompanyTable
        data={companyListAll?.result || []}
        isLoading={isLoading}
        onDelete={handleDeleteCompany}
        onEdit={handleEditCompany}
        className="flex-1 min-h-0"
      />

      {/* Company Add New Dialog */}

      <CompanyForm
        open={state.isDialogOpen.show}
        onClose={() =>
          dispatch({
            type: "show_company_form",
            payload: { show: false, mode: 1 },
          })
        }
        isLoading={isCreating || isUpdating || isFetching}
        dispatch={dispatch}
        state={state}
        handleSubmitForm={handleSubmitForm}
      />
      {state.showDataset && (
        <DatasetSource
          onClose={() =>
            dispatch({
              type: "show_dataset",
              payload: {
                show: false,
                datasetType: "",
              },
            })
          }
          state={state}
          //dataset={companyById?.result?.datasetSource ?? []}
          dispatch={dispatch}
        />
      )}

      {state.showImport && (
        <DatasetImport
          connection={state.companyFormData?.connections || []}
          showForm={state.showImport}
          dispatchCompany={dispatch}
          company={state.companyFormData.companyId ?? ""}
        />
      )}
      {state.showConnection.show && (
        <ConnectionDialog
          open={state.showConnection.show}
          onClose={() =>
            dispatch({
              type: "show_connection",
              payload: { mode: 0, show: false },
            })
          }
          connectionList={state.companyFormData.connections ?? []}
          dispatch={dispatch}
          mode={state.showConnection.mode}
          data={state.showConnection.data}
        />
      )}

      <DeleteConfirmDialog
        open={state.isDeleteDialogOpen.show}
        onClose={() =>
          dispatch({
            type: "delete_company_confirmation",
            payload: { show: false, mode: 1, id: "" },
          })
        }
        onConfirm={deleteCompanyById}
        title={t("CompanyInfo.deleteTitle")}
        description={t("CompanyInfo.deleteConfirm", {
          name: state.companyFormData?.companyName,
        })}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default CompanyInfoMainComponent;
