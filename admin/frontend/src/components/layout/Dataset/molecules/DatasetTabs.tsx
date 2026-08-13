import { Database, Settings } from "lucide-react";

import type { CompanyTabProps } from "@/types/companyInfo.types";
import { TABS_DATAAGENT } from "../../../../types/dataAgent.types";
import { TabGroup } from "../../CompanyInfo/molecules/CompanyTabGroup";

export const DatasetTabs = ({ onClickTab, selectedTab }: CompanyTabProps) => {
  const parentTabClass = "flex items-center gap-2 text-sm font-medium transition ";
  const parentselectedTabClass = " bg-white p-2 rounded-xl shadow  px-5 border";
  const unparentselectedTabClass = "text-gray-500 hover:text-gray-700";

  return (
    <div className="flex items-center gap-6 px-6 py-3 border-b">
      <TabGroup
        items={[
          {
            key: 1,
            label: "Preview Data",
            icon: <Settings size={16} />,
            activeTab: selectedTab === TABS_DATAAGENT.DATASET_DATA,
            activeClass: parentselectedTabClass,
            unActiveClass: unparentselectedTabClass,
            className: parentTabClass,
            onClick: () => onClickTab(TABS_DATAAGENT.DATASET_DATA),
          },
          {
            key: 2,
            label: "Schema Table",
            icon: <Database size={16} />,
            activeTab: selectedTab === TABS_DATAAGENT.DATASET_SCHEMA,
            activeClass: parentselectedTabClass,
            unActiveClass: unparentselectedTabClass,
            className: parentTabClass,
            onClick: () => onClickTab(TABS_DATAAGENT.DATASET_SCHEMA),
          },
        ]}
        className="px-6 py-3 border-b bg-white"
      />
    </div>
  );
};
