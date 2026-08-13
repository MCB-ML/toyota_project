import { BarChart, Bot, Check, Database, Search, X } from "lucide-react";
import type React from "react";
import type { JSX } from "react/jsx-runtime";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGetAllModels } from "../../../../services/api/model/model.api";
import {
  type CompanyReducerState,
  type DeploymentAgents,
  TABS_COMPANY,
} from "../../../../types/companyInfo.types";
import FloatingInputField from "../../../reusable/FloatingInputField";
import LoadingPage from "../../../reusable/loadingPage";
import type { CompanyAction } from "../Company.reducer";
import { DeploymentAgentSelect } from "../molecules/DeploymentAgentSelect";
import { CompanyDataAgentTabForm } from "./CompanyDataAgentTabForm";
import { CompanyTabForm } from "./CompanyTabForm";

export interface CompanyFormProps {
  open: boolean;
  onClose: () => void;
  isLoading: boolean;
  preventCloseOnOutsideClick?: boolean;
  layOutSizeConfirmation?: string;
  state: CompanyReducerState;
  dispatch: React.Dispatch<CompanyAction>;
  handleSubmitForm: () => void;
}

const CompanyForm = ({
  open,
  onClose,
  isLoading,
  dispatch,
  preventCloseOnOutsideClick,
  state,
  handleSubmitForm,
}: CompanyFormProps) => {
  const { t } = useTranslation();
  const { data: modelList } = useGetAllModels();

  const _deploymentIcon = (value: string): JSX.Element | null => {
    let icon: JSX.Element | null = null;

    switch (value) {
      case "main":
        icon = <Bot size={18} className="text-blue-500" />;
        break;

      case "sql":
        icon = <Database size={18} className="text-green-500" />;
        break;

      case "rag":
        icon = <Search size={18} className="text-purple-500" />;
        break;

      case "powerbi":
        icon = <BarChart size={18} className="text-orange-500" />;
        break;

      default:
        icon = null;
    }

    return icon;
  };
  const deploymentTitle = (value: string): string => {
    let title: string = "";

    switch (value) {
      case "main":
        title = t("CompanyInfo.main", "Main");
        break;

      case "sql":
        title = "Text2SQL ";
        break;

      case "sql_2":
        title = "Text2SQL Only";
        break;
      case "rag":
        title = "RAG";
        break;

      case "powerbi":
        title = "Power BI";
        break;
      case "chart":
        title = "Chart";
        break;
      default:
    }

    return title;
  };
  return (
    <>
      {/* Main Form Dialog */}
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent
          className={`w-[62%]! max-w-[900px]! h-145 p-0! gap-0 overflow-visible flex flex-col`}
          preventCloseOnOutsideClick={preventCloseOnOutsideClick}
        >
          <DialogHeader className="px-6 py-4 border-b border-[#e5e7eb]">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-semibold text-[#101828]">
                {state.isDialogOpen.mode === 1
                  ? t("CompanyInfo.addNewTitle")
                  : t("CompanyInfo.updateTitle")}
              </DialogTitle>
            </div>
          </DialogHeader>

          <LoadingPage isLoading={isLoading} />

          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="overflow-y-auto overflow-x-visible flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1  gap-y-5">
                <div className="md:col-span-2 items-center ">
                  <div className="flex items-center justify-between w-full">
                    <CompanyTabForm
                      onClickTab={(e) => dispatch({ type: "select_tab", payload: e })}
                      selectedTab={state.tab}
                    />
                  </div>

                  <div className={`  flex items-center justify-between w-full  `}>
                    <CompanyDataAgentTabForm
                      onClickTab={(e) => dispatch({ type: "select_tab", payload: e })}
                      selectedTab={state.tab}
                    />
                  </div>
                </div>

                <div
                  className={`md:col-span-2 px-6 text-sm space-y-4 ${
                    state.tab === TABS_COMPANY.GENERAL ? "" : "hidden"
                  }`}
                >
                  <div className="md:col-span-2">
                    <FloatingInputField
                      id="companyName"
                      label={t("CompanyInfo.companyName")}
                      value={state.companyFormData.companyName}
                      type="text"
                      onChange={(e) =>
                        dispatch({
                          type: "company_form_field",
                          field: "companyName",
                          value: e.target.value,
                        })
                      }
                      placeholder={t("CompanyInfo.placeholders.enterCompanyName")}
                      error={false}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <FloatingInputField
                      id="description"
                      label={t("CompanyInfo.description")}
                      value={state.companyFormData.description}
                      type="text"
                      onChange={(e) =>
                        dispatch({
                          type: "company_form_field",
                          field: "description",
                          value: e.target.value,
                        })
                      }
                      placeholder={t("CompanyInfo.placeholders.enterDescription")}
                      error={false}
                    />
                  </div>

                  <label className="md:col-span-2 flex items-center gap-2 pt-1">
                    <input
                      id="isActive"
                      type="checkbox"
                      checked={state.companyFormData.isActive}
                      onChange={(e) =>
                        dispatch({
                          type: "company_form_field",
                          field: "isActive",
                          value: e.target.checked,
                        })
                      }
                      className="h-4 w-4 accent-[#1a73e8]"
                    />
                    <span className="text-sm text-[#101828]">{t("CompanyInfo.isActive")}</span>
                  </label>
                </div>
                {/*
                  데이터 에이전트 파라미터 블록 제거: 파라미터는 AI 에이전트 한 갈래만 쓴다.
                  deploymentType 으로 나누던 구분이 사라져 모든 용도를 한 목록에 그린다.
                */}
                <div
                  className={`md:col-span-2 space-y-6 px-6 text-sm  ${
                    state.tab.startsWith("aiagent_deployment") ? "" : "hidden"
                  }`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {state.companyFormData?.deployments?.map(
                      (data: DeploymentAgents, index: number) => {
                        return (
                          <div
                            key={`${data.agentType}-${index}`}
                            className="rounded-xl border bg-white shadow-sm flex gap-2 items-center p-2"
                          >
                            {/* 라벨은 내용 길이에 맞춰 고정. 남는 공간은 전부 선택칸이 쓴다 */}
                            <div className="w-[86px] shrink-0 text-xs">
                              {deploymentTitle(data.agentType)}
                            </div>
                            <div className="flex-1 min-w-0 text-xs">
                              <DeploymentAgentSelect
                                label=""
                                data={modelList?.result || []}
                                value={data.modelId || ""}
                                onSelectAzure={(id) =>
                                  dispatch({
                                    type: "company_form_deployment_field",
                                    index,
                                    field: "modelId",
                                    value: id,
                                  })
                                }
                              />
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>

                  {/*
                    접속 키 섹션 제거: 딜러사마다 키를 발급해도 청구서가 갈라지지 않는다.
                    사용량은 TokenUsage_log 에 쌓고 사용량 메뉴(/usage)에서 본다.
                  */}
                </div>
                {/*
                  System Prompt 블록 제거: 프롬프트는 전 딜러사 공용이 되어
                  Prompt Settings 메뉴(/promptSettings)로 이동했다.
                */}

                {/*
                  Dataset Config 블록 제거: 데이터 소스 연결·테이블 임포트는
                  어드민이 아니라 에이전트 백엔드가 담당한다.
                  (이 블록이 유일한 ODBC/Fabric 의존이었다)
                */}
              </div>
            </div>

            <DialogFooter className="px-6 py-4 border-t border-[#e5e7eb] gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="w-full md:w-auto cursor-pointer"
                disabled={isLoading}
              >
                <X size={18} />
                {t("CompanyInfo.close", "Close")}
              </Button>

              <Button
                type="button"
                onClick={handleSubmitForm}
                className="w-full md:w-auto bg-[#1a73e8] hover:bg-[#1557b0] cursor-pointer"
                disabled={isLoading}
              >
                <Check size={18} />
                {state.isDialogOpen.mode === 1 ? t("CompanyInfo.add") : t("CompanyInfo.update")}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CompanyForm;
