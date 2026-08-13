import { Rocket } from "lucide-react";
import { useTranslation } from "react-i18next";
import { type CompanyTabProps, TABS_COMPANY } from "@/types/companyInfo.types";
import { TabGroup } from "../molecules/CompanyTabGroup";

/**
 * AI 에이전트 파라미터의 하위 탭.
 *
 * 남은 것은 배포 에이전트 하나뿐이다.
 *   - System Prompt  -> 전 딜러사 공용이라 Prompt Settings 메뉴로 이동
 *   - Dataset Config -> 데이터 소스 연결은 에이전트 백엔드 담당이라 제거
 */
export const CompanyDataAgentTabForm = ({ onClickTab, selectedTab }: CompanyTabProps) => {
  const { t } = useTranslation();
  const childTabClass =
    "w-40 flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-md transition";
  const childselectedTabClass = "bg-blue-100 text-blue-700";
  const unSelectedchildTabClass = "text-gray-600 hover:bg-gray-100";

  if (selectedTab !== TABS_COMPANY.AI_AGENT) return null;

  return (
    <div className="flex items-center  gap-4 px-6 py-2 bg-gray-50 border-b w-full">
      <TabGroup
        items={[
          {
            key: 1,
            label: t("CompanyInfo.deploymentAgent"),
            icon: <Rocket size={16} />,
            activeTab: true,
            activeClass: childselectedTabClass,
            unActiveClass: unSelectedchildTabClass,
            className: childTabClass,
            onClick: () => onClickTab(TABS_COMPANY.AI_AGENT),
          },
        ]}
      />
    </div>
  );
};
