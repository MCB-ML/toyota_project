import { Database, MessageSquareText, Settings } from "lucide-react";
import type { CompanyTabProps } from "@/types/companyInfo.types";
import { TABS_POWERBI } from "../../../../types/powerBi.types";
import { TabGroup } from "../../CompanyInfo/molecules/CompanyTabGroup";

export const PowerBiTabForm = ({ onClickTab, selectedTab }: CompanyTabProps) => {
  const childTabClass =
    "w-40  flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-md transition";
  const childselectedTabClass = "bg-blue-100 text-blue-700";
  const unSelectedchildTabClass = "text-gray-600 hover:bg-gray-100";

  return (
    <div className="flex items-center  px-3 py-2 bg-gray-50 border-b overflow-hidden">
      <TabGroup
        items={[
          {
            key: 1,
            label: "General",
            icon: <Settings size={16} />,
            activeTab: selectedTab === TABS_POWERBI.GENERAL,
            activeClass: childselectedTabClass,
            unActiveClass: unSelectedchildTabClass,
            className: childTabClass,
            onClick: () => onClickTab(TABS_POWERBI.GENERAL),
          },
          {
            key: 2,
            label: "BI report",
            icon: <Database size={16} />,
            activeTab: selectedTab === TABS_POWERBI.REPORT,
            activeClass: childselectedTabClass,
            unActiveClass: unSelectedchildTabClass,
            className: childTabClass,
            onClick: () => onClickTab(TABS_POWERBI.REPORT),
          },
          {
            key: 2,
            label: "Suggestion",
            icon: <MessageSquareText size={16} />,
            activeTab: selectedTab === TABS_POWERBI.SUGGESTION,
            activeClass: childselectedTabClass,
            unActiveClass: unSelectedchildTabClass,
            className: childTabClass,
            onClick: () => onClickTab(TABS_POWERBI.SUGGESTION),
          },
        ]}
      />
    </div>
  );
};
