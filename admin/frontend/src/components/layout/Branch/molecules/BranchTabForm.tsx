import { Database, Settings } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { CompanyTabProps } from "@/types/companyInfo.types";
import { TABS_BRANCH } from "../../../../types/branch.types";
import { TabGroup } from "../../CompanyInfo/molecules/CompanyTabGroup";

export const BranchTabForm = ({ onClickTab, selectedTab }: CompanyTabProps) => {
  const { t } = useTranslation();
  const parentTabClass = "flex items-center gap-2 text-sm font-medium transition pb-2.5";
  const parentselectedTabClass = "text-blue-600 border-b-2 border-blue-600 pb-2";
  const unparentselectedTabClass = "text-gray-500 hover:text-gray-700";

  return (
    <div className="flex items-center gap-6 px-6 py-3 border-b bg-white">
      <TabGroup
        items={[
          {
            key: 1,
            label: t("Branch.general"),
            icon: <Settings size={16} />,
            activeTab: selectedTab === TABS_BRANCH.GENERAL,
            activeClass: parentselectedTabClass,
            unActiveClass: unparentselectedTabClass,
            className: parentTabClass,
            onClick: () => onClickTab(TABS_BRANCH.GENERAL),
          },
          {
            key: 2,
            label: t("Branch.dataAgent"),
            icon: <Database size={16} />,
            activeTab: selectedTab.startsWith("agent"),
            activeClass: parentselectedTabClass,
            unActiveClass: unparentselectedTabClass,
            className: parentTabClass,
            onClick: () => onClickTab(TABS_BRANCH.DATA_AGENT),
          },
        ]}
        className="px-6 py-3 border-b bg-white"
      />
    </div>
  );
};
