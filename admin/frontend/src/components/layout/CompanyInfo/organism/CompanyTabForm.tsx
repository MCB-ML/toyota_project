import { Database, Settings } from "lucide-react";
import { useTranslation } from "react-i18next";
import { type CompanyTabProps, TABS_COMPANY } from "@/types/companyInfo.types";
import { TabGroup } from "../molecules/CompanyTabGroup";

export const CompanyTabForm = ({ onClickTab, selectedTab }: CompanyTabProps) => {
  const { t } = useTranslation();
  const parentTabClass = "flex items-center gap-2 text-sm font-medium transition pb-2.5";
  const parentselectedTabClass = "text-blue-600 border-b-2 border-blue-600 pb-2";
  const unparentselectedTabClass = "text-gray-500 hover:text-gray-700";

  return (
    <div className="flex items-center gap-6 px-6 py-3 border-b bg-white w-full">
      <TabGroup
        items={[
          {
            key: 1,
            label: t("CompanyInfo.general"),
            icon: <Settings size={16} />,
            activeTab: selectedTab === TABS_COMPANY.GENERAL,
            activeClass: parentselectedTabClass,
            unActiveClass: unparentselectedTabClass,
            className: parentTabClass,
            onClick: () => onClickTab(TABS_COMPANY.GENERAL),
          },
          // 데이터 에이전트 파라미터 탭 제거:
          // 파라미터는 AI 에이전트 한 갈래만 쓴다. Dataset Config 도 함께 사라진다.
          {
            key: 3,
            label: t("CompanyInfo.aiAgentParameter"),
            icon: <Database size={16} />,
            activeTab: selectedTab === TABS_COMPANY.AI_AGENT,
            activeClass: parentselectedTabClass,
            unActiveClass: unparentselectedTabClass,
            className: parentTabClass,
            onClick: () => onClickTab(TABS_COMPANY.AI_AGENT),
          },
        ]}
        className="px-6 py-3 border-b bg-white"
      />
    </div>
  );
};
