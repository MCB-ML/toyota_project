import { useQueryClient } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import { useCallback, useEffect, useReducer } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import DeleteConfirmDialog from "@/components/reusable/DeleteConfirmDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useDeleteBranch } from "@/services/api/branch/deleteBranch";
import { useCreateBranch } from "@/services/api/branch/postCreateBranch";
import { useUpdateBranch } from "@/services/api/branch/putUpdateBranch";
import {
  type BranchUpdateAllowUserAccessRequest,
  useUpdateBranchAllowUserAccess,
} from "@/services/api/branch/putUpdateBranchAllowUserAccess";
import { useGetAllCompanyList } from "@/services/api/company/getAllCompany";
import { useUiHeaderStore } from "@/store/uiHeaderStore";
import type {
  BranchConfiguration,
  BranchData,
  BranchUpdateActiveRequest,
  CreateBranchRequest,
} from "@/types/branch.types";
import { TABS_BRANCH } from "@/types/branch.types";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { useGetBranchByCompanyId } from "../../../../services/api/branch/getBranchByCompanyId";
import { useGetBranchById } from "../../../../services/api/branch/getBranchById";
import { useUpdateActiveBranch } from "../../../../services/api/branch/puUpdateActiveBranch";
import FormDialog from "../../../reusable/FormDialog";
import { BranchFields } from "../Branch.field";
import { BranchStateInit, BranchStateReducer, initBranchData } from "../Branch.reducer";
import { branchSchema } from "../Branch.schema";
import { BranchAgentTabForm } from "../molecules/BranchAgentTabForm";
import BranchesTable from "../molecules/BranchesTable";
import { BranchTabForm } from "../molecules/BranchTabForm";

const BranchesMainComponent = () => {
  const { t } = useTranslation();
  const [state, dispatch] = useReducer(BranchStateReducer, BranchStateInit);

  const { data: companyData } = useGetAllCompanyList();
  const companies = companyData?.result || [];

  const {
    data: branchData,
    isLoading,
    isError,
    refetch,
  } = useGetBranchByCompanyId(state.selectedCompanyId ?? null);
  const { data: branchDataById } = useGetBranchById(state.selectedBranch.branchId ?? null);
  const { mutate: createBranch, isPending: isCreating } = useCreateBranch();
  const { mutate: updateBranch, isPending: isUpdating } = useUpdateBranch();
  const { mutate: updateActiveBranch } = useUpdateActiveBranch();
  const { mutate: updateBranchAllowUserAccess } = useUpdateBranchAllowUserAccess();
  const { mutate: deleteBranch, isPending: isDeleting } = useDeleteBranch();

  const { setHeaderAction } = useUiHeaderStore();

  useEffect(() => {
    setHeaderAction({
      label: t("Branch.addNewTitle"),
      onClick: () => dispatch({ type: "showForm", show: true, mode: 1 }),
      disabled: isLoading || !state.selectedCompanyId,
    });
    return () => setHeaderAction(null);
  }, [setHeaderAction, isLoading, state.selectedCompanyId, t]);

  useEffect(() => {
    if (companies.length > 0 && !state.selectedCompanyId) {
      dispatch({ type: "selectedCompanyId", payload: companies[0].companyId });
      // setSelectedCompanyId(companies[0].companyId);
    }
  }, [companies, state.selectedCompanyId]);
  // Define getBranchById before usage in useEffect
  const getBranchById = useCallback(() => {
    function setFormValue<K extends keyof BranchData>(
      obj: BranchData,
      key: K,
      value: BranchData[K],
    ) {
      obj[key] = value;
    }

    if (branchDataById) {
      const result = branchDataById.result;
      const populateFetch: BranchData = result;

      populateFetch.branchLogo = result.branchLogoImg;
      populateFetch.bgImg = result.bgImgStr;
      result.branchConfiguration?.forEach((data: BranchConfiguration) => {
        if (data.agentType) {
          Object.entries(data).forEach(([key, value]) => {
            const formKey = `${data.agentType}_${key}` as keyof BranchData;
            setFormValue(populateFetch, formKey, value as any);
          });
        }
      });

      dispatch({ type: "selectedBranch", payload: populateFetch });
    }
  }, [branchDataById]);

  useEffect(() => {
    if (branchDataById?.success) {
      getBranchById();
    }
  }, [branchDataById, state.selectedBranch.branchId, getBranchById]);

  useEffect(() => {
    if (isError) {
      toast.error(t("Branch.error.fetch"), {
        description: t("Branch.error.fetchDesc", {
          defaultValue: "Please try again later or refresh the page.",
        }),
        action: {
          label: t("common.retry"),
          onClick: () => refetch(),
        },
        classNames: {
          actionButton: "!bg-destructive !text-destructive-foreground hover:!bg-destructive/90",
        },
      });
    }
  }, [isError, refetch, t]);

  const handleCreate = (data: any) => {
    const isEdit = state.showFormMode === 2;
    const formData = new FormData();

    const payload: CreateBranchRequest = {
      branchName: data.branchName,
      branchType: data.branchType,
      branchLocation: data.branchLocation,
      companyId: state.selectedCompanyId,
      allowUserAccess: data.allowUserAccess,
      dataAgentBotName: data.dataAgentBotName,
      dataAgentWelcomeprompt: data.dataAgentWelcomeprompt,
      isDefault: data.isDefault,
      isActive: data.isActive,
    };

    const suffixToTypeMap: Record<string, string> = {
      sql_: "sql",
      rag_: "rag",
    };

    const getConfigTypeByTab = (suffix: string) => {
      if (state.tab === TABS_BRANCH.AI_AGENT && suffix === "sql_") {
        return "ai_agent";
      }
      return "data_agent";
    };

    const mapToBranchConfiguration = (suffix: string) => {
      const filteredObj = Object.fromEntries(
        Object.entries(data).filter(([key]) => key.startsWith(suffix)),
      ) as Record<string, any>;

      return {
        configType: getConfigTypeByTab(suffix),
        agentType: suffixToTypeMap[suffix],
        endpoint: filteredObj[`${suffix}endpoint`],
        db: filteredObj[`${suffix}db`],
        user: filteredObj[`${suffix}user`],
        password: filteredObj[`${suffix}password`],
        port: filteredObj[`${suffix}port`],
      } as BranchConfiguration;
    };

    const suffixes = Object.keys(suffixToTypeMap);

    payload.branchConfiguration = suffixes.map(mapToBranchConfiguration);

    if (data.branchLogo instanceof File) formData.append("branchLogo", data.branchLogo);
    else if (data.branchLogo) payload.branchLogo = "1";

    if (data.bgImg instanceof File) formData.append("bgImg", data.bgImg);
    else if (data.bgImg) payload.bgImg = "1";

    if (isEdit) {
      payload.branchId = state.selectedBranch.branchId || "";
      payload.companyId = state.selectedBranch.companyId || "";
    }
    console.log("formData", formData);
    formData.append("payload", JSON.stringify(payload));

    if (isEdit) {
      updateBranch(formData, {
        onSuccess: (res) => {
          if (res) {
            toast.success(t("Branch.success.updatedTitle"), {
              description: t("Branch.success.updatedDesc", {
                name: payload.branchName,
              }),
            });
            dispatch({ type: "showForm", show: false });
          }
        },
        onError: (error) => {
          toast.error(t("Branch.error.update"), {
            description: getErrorMessage(error),
          });
        },
      });
    } else {
      createBranch(formData, {
        onSuccess: (res) => {
          if (res) {
            toast.success(t("Branch.success.createdTitle"), {
              description: res.message || t("Branch.success.createdDesc"),
            });
            dispatch({ type: "showForm", show: false });
          }
        },
        onError: (error) => {
          toast.error(t("Branch.error.create"), {
            description: getErrorMessage(error),
          });
        },
      });
    }
  };

  const handleDelete = (row: BranchData) => {
    dispatch({ type: "selectedBranch", payload: row });
    dispatch({ type: "isDeleteOpen", payload: true });
    //   setSelectedBranch(row);
    //  setIsDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (!state.selectedBranch) return;

    deleteBranch(state.selectedBranch.branchId || "", {
      onSuccess: (res) => {
        if (res) {
          toast.success(t("Branch.success.deletedTitle"), {
            description: res.message || t("Branch.success.deletedDesc"),
          });
          dispatch({ type: "isDeleteOpen", payload: false });
          dispatch({ type: "selectedBranch", payload: initBranchData });
          // setIsDeleteOpen(false);
          //    setSelectedBranch(null);
        }
      },
      onError: (error) => {
        toast.error(t("Branch.error.delete"), {
          description: getErrorMessage(error),
        });
      },
    });
  };

  const handleEdit = (row: BranchData) => {
    dispatch({ type: "selectedBranch", payload: row });
    dispatch({ type: "showForm", show: true, mode: 2 });
  };

  const selectedCompany = companies.find((c) => c.companyId === state.selectedCompanyId);
  const onClickTab = (val: string) => dispatch({ type: "select_tab", payload: val });
  const _branchTabForm = () => {
    return (
      <>
        <BranchTabForm onClickTab={onClickTab} selectedTab={state.tab} />

        <BranchAgentTabForm onClickTab={onClickTab} selectedTab={state.tab} />
      </>
    );
  };

  const queryClient = useQueryClient();

  const handleToggleActive = async (branch: BranchData, value: boolean) => {
    if (branch.branchId) {
      queryClient.setQueryData(["branchByCompanyId", state.selectedCompanyId], (oldData: any) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          result: oldData.result.map((b: BranchData) =>
            b.branchId === branch.branchId ? { ...b, isActive: value } : b,
          ),
        };
      });

      const payload: BranchUpdateActiveRequest = {
        companyId: state.selectedCompanyId,
        branchId: branch.branchId,
        isActive: value,
      };
      updateActiveBranch(
        {
          endpoint: "updateActiveBranch",
          payload,
        },
        {
          onSuccess: (res) => {
            if (res) {
            }
          },
          onError: (error) => {
            toast.error(t("Branch.error.update"), {
              description: getErrorMessage(error),
            });
          },
        },
      );
    }
  };

  const handleToggleDefault = async (branch: BranchData, value: boolean) => {
    if (branch.branchId) {
      queryClient.setQueryData(["branchByCompanyId", state.selectedCompanyId], (oldData: any) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          result: oldData.result.map((b: BranchData) =>
            b.branchId === branch.branchId
              ? { ...b, isDefault: value }
              : value
                ? { ...b, isDefault: false }
                : b,
          ),
        };
      });
      const payload: BranchUpdateActiveRequest = {
        companyId: state.selectedCompanyId,
        branchId: branch.branchId,
        isActive: value,
      };
      updateActiveBranch(
        {
          endpoint: "updateDefaultBranch",
          payload,
        },
        {
          onSuccess: (res) => {
            if (res) {
            }
          },
          onError: (error) => {
            toast.error(t("Branch.error.update"), {
              description: getErrorMessage(error),
            });
          },
        },
      );
    }
  };

  const handleToggleAllowUserAccess = async (branch: BranchData, value: boolean) => {
    if (branch.branchId) {
      queryClient.setQueryData(["branchByCompanyId", state.selectedCompanyId], (oldData: any) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          result: oldData.result.map((b: BranchData) =>
            b.branchId === branch.branchId
              ? { ...b, branchAllowUserAccess: value, allowUserAccess: value }
              : b,
          ),
        };
      });

      const payload: BranchUpdateAllowUserAccessRequest = {
        companyId: state.selectedCompanyId,
        branchId: branch.branchId,
        allowUserAccess: value,
      };

      updateBranchAllowUserAccess(payload, {
        onSuccess: (res) => {
          if (res) {
            toast.success("Success", {
              description: t("Branch.success.guestAccessUpdated"),
            });
          }
        },
        onError: (error) => {
          toast.error(t("Branch.error.update"), {
            description: getErrorMessage(error),
          });
        },
      });
    }
  };
  return (
    <div className="h-full flex flex-col bg-[#f2f5fa] lg:pl-2 md:px-2 lg:px-1 py-1 md:py-2 lg:py-3">
      <div className="flex flex-col lg:flex-row gap-2 flex-1 h-full">
        {/* Mobile Company Select */}
        <div className="lg:hidden w-full">
          <Select
            value={state.selectedCompanyId}
            onValueChange={(id: string) => dispatch({ type: "selectedCompanyId", payload: id })}
          >
            <SelectTrigger className="w-full bg-white">
              <SelectValue placeholder={t("Branch.selectCompany")} />
            </SelectTrigger>
            <SelectContent>
              {companies.map((company) => (
                <SelectItem key={company.companyId} value={company.companyId}>
                  {company.companyName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Desktop Company Sidebar */}
        <div className="hidden lg:flex flex-col w-64 bg-white rounded-xl border border-[#e5e7eb] shrink-0">
          <div className="px-4 py-2.5 border-b border-[#f3f4f6] bg-[#f9fafb]/50">
            <h3 className="font-semibold text-[#101828]">{t("Branch.companies")}</h3>
            <p className="text-xs text-[#6a7282] mt-1">{t("Branch.selectCompanyDesc")}</p>
          </div>
          <div className="p-2 space-y-1">
            {companies.map((company) => (
              <button
                key={company.companyId}
                onClick={
                  () =>
                    dispatch({
                      type: "selectedCompanyId",
                      payload: company.companyId,
                    })
                  //setSelectedCompanyId(company.companyId)
                }
                className={cn(
                  "w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-3",
                  state.selectedCompanyId === company.companyId
                    ? "bg-[#1a73e8]/10 text-[#1a73e8]"
                    : "text-[#4a5565] hover:bg-[#f9fafb] hover:text-[#101828]",
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                    state.selectedCompanyId === company.companyId
                      ? "bg-[#1a73e8]/20"
                      : "bg-[#f3f4f6]",
                  )}
                >
                  <Building2
                    className={cn(
                      "w-4 h-4",
                      state.selectedCompanyId === company.companyId
                        ? "text-[#1a73e8]"
                        : "text-[#6a7282]",
                    )}
                  />
                </div>
                <span className="truncate">{company.companyName}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Branch Table */}
        <div className="flex-1 min-w-0 flex flex-col">
          {state.selectedCompanyId ? (
            <div className="flex-1 flex flex-col h-full">
              <div className="bg-white p-4 rounded-t-xl border-b border-[#f3f4f6] lg:hidden">
                <h2 className="font-semibold text-[#101828]">{selectedCompany?.companyName}</h2>
              </div>
              <BranchesTable
                data={branchData?.result ?? []}
                isLoading={isLoading}
                onDelete={handleDelete}
                onEdit={handleEdit}
                onToggleActive={handleToggleActive}
                onToggleDefault={handleToggleDefault}
                onToggleAllowUserAccess={handleToggleAllowUserAccess}
                className="flex-1 min-h-0"
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-white rounded-xl border border-dashed border-[#d1d5dc]">
              <div className="text-center p-6">
                <div className="w-12 h-12 bg-[#f3f4f6] rounded-full flex items-center justify-center mx-auto mb-3">
                  <Building2 className="w-6 h-6 text-[#99a1af]" />
                </div>
                <h3 className="text-lg font-medium text-[#101828]">
                  {t("Branch.noCompanySelected")}
                </h3>
                <p className="text-sm text-[#6a7282] mt-1">{t("Branch.selectCompanyToManage")}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <FormDialog<BranchData>
        open={state.showForm}
        onClose={() => dispatch({ type: "showForm", show: false })}
        onSubmit={handleCreate}
        title={state.showFormMode === 1 ? t("Branch.addNewTitle") : t("Branch.updateTitle")}
        submitButtonText={
          state.showFormMode === 1 ? t("Branch.addBranch") : t("Branch.updateBranch")
        }
        fields={BranchFields(t)}
        validationSchema={branchSchema}
        initialValues={state.selectedBranch}
        confirmationTitle={t("Branch.confirmAddition")}
        confirmationMessage={t("Branch.confirmAddDesc")}
        //  confirmationFields={visibleConfirmationFields}
        showConfirmation={false}
        isLoading={isCreating || isUpdating}
        dispatch={dispatch}
        dispatchKey="selectedBranchFields"
        // preventCloseOnOutsideClick={true}
      />

      {/*<BranchAddNew*/}
      {/*    open={state.showForm}*/}
      {/*    onClose={() => dispatch({ type: "isAddOpen", payload: false })}*/}
      {/*    onSubmit={handleCreate}*/}
      {/*    isLoading={isCreating}*/}
      {/*    selectedCompanyId={state.selectedCompanyId}*/}
      {/*    tab={{*/}
      {/*        useTab: true,*/}
      {/*        content: branchTabForm(),*/}
      {/*        selectedTabId: state.tab,*/}
      {/*    }}*/}
      {/*/>*/}

      {/*<BranchEdit*/}
      {/*    open={state.isEditOpen}*/}
      {/*    onClose={() => dispatch({ type: "isEditOpen", payload: false })}*/}
      {/*    onSubmit={handleUpdate}*/}
      {/*    branchData={state.selectedBranch}*/}
      {/*    isLoading={isUpdating}*/}
      {/*/>*/}

      <DeleteConfirmDialog
        open={state.isDeleteOpen}
        onClose={() => dispatch({ type: "isDeleteOpen", payload: false })}
        onConfirm={confirmDelete}
        title="Delete Branch"
        description={`Are you sure you want to delete ${state.selectedBranch?.branchName}? This action cannot be undone.`}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default BranchesMainComponent;
