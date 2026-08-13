import { Bot, ChartBar } from "lucide-react";

import type { CompanyTabProps } from "@/types/companyInfo.types";
import { TABS_DATAAGENT } from "../../../../../types/dataAgent.types";
import { TabGroup } from "../../../CompanyInfo/molecules/CompanyTabGroup";

interface DataAgentGroupTabsProps extends CompanyTabProps {
  onAddDataAgent: () => void;
  onAddDataset: () => void;
}

export const DataAgentGroupTabs = ({
  onClickTab,
  selectedTab,
  onAddDataAgent,
  onAddDataset,
}: DataAgentGroupTabsProps) => {
  const parentTabClass = "flex items-center gap-2 text-sm font-medium transition ";
  const parentselectedTabClass = " bg-white p-2 rounded-xl shadow  px-5 border ";
  const unparentselectedTabClass = "text-gray-500 hover:text-gray-700";

  return (
    <div className="flex items-center gap-6 px-6 py-3 border-b border-[#f3f4f6] bg-[#f9fafb]/50 sticky top-0 z-10">
      <TabGroup
        items={[
          {
            key: 1,
            label: "Data Agent List",
            icon: <Bot size={16} />,
            activeTab: selectedTab === TABS_DATAAGENT.AGENT,
            activeClass: parentselectedTabClass,
            unActiveClass: unparentselectedTabClass,
            className: parentTabClass,
            onClick: () => onClickTab(TABS_DATAAGENT.AGENT),
          },
          {
            key: 2,
            label: "Power BI List",
            icon: <ChartBar size={16} />,
            activeTab: selectedTab === TABS_DATAAGENT.POWER_BI,
            activeClass: parentselectedTabClass,
            unActiveClass: unparentselectedTabClass,
            className: parentTabClass,
            onClick: () => onClickTab(TABS_DATAAGENT.POWER_BI),
          },
          //{
          //  key: 3,
          //  label: "Index List",
          //  icon: <FileText size={16} />,
          //  activeTab: selectedTab === TABS_DATAAGENT.INDEX,
          //  activeClass: parentselectedTabClass,
          //  unActiveClass: unparentselectedTabClass,
          //  className: parentTabClass,
          //  onClick: () => onClickTab(TABS_DATAAGENT.INDEX),
          //},
        ]}
        className="px-6 py-3 border-b bg-white"
      />

      {/*<AddButton*/}
      {/*  selectedTab={selectedTab}*/}
      {/*  onAddDataAgent={onAddDataAgent}*/}
      {/*  onAddDataset={onAddDataset}*/}
      {/*/>*/}
    </div>
  );
};
