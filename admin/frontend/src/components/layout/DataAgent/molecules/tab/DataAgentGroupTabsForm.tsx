import { Database, FileText, MessageSquareText, Settings, Table } from "lucide-react";

import type { CompanyTabProps } from "@/types/companyInfo.types";
import { TABS_DATAAGENT } from "../../../../../types/dataAgent.types";
import { TabGroup } from "../../../CompanyInfo/molecules/CompanyTabGroup";

export const DataAgentGroupTabsForm = ({ onClickTab, selectedTab }: CompanyTabProps) => {
  const parentTabClass =
    "flex items-center gap-2 text-sm font-medium transition pb-2.5 min-w-[90px]";
  const parentselectedTabClass = "text-blue-600 border-b-2 border-blue-600 pb-2";
  const unparentselectedTabClass = "text-gray-500 hover:text-gray-700";

  return (
    <div className="flex items-center gap-3  py-3   overflow-x-auto max-w-[1200px]">
      <TabGroup
        items={[
          {
            key: 1,
            label: "General",
            icon: <Settings size={16} />,
            activeTab: selectedTab === TABS_DATAAGENT.GENERAL_FORM,
            activeClass: parentselectedTabClass,
            unActiveClass: unparentselectedTabClass,
            className: parentTabClass,
            onClick: () => onClickTab(TABS_DATAAGENT.GENERAL_FORM),
          },
          {
            key: 2,
            label: "Prompt",
            icon: <FileText size={16} />,
            activeTab: selectedTab === TABS_DATAAGENT.INSTRUCTION_FORM,
            activeClass: parentselectedTabClass,
            unActiveClass: unparentselectedTabClass,
            className: parentTabClass,
            onClick: () => onClickTab(TABS_DATAAGENT.INSTRUCTION_FORM),
          },
          {
            key: 3,
            label: "Table List",
            icon: <Table size={16} />,
            activeTab: selectedTab === TABS_DATAAGENT.SQL_FORM,
            activeClass: parentselectedTabClass,
            unActiveClass: unparentselectedTabClass,
            className: parentTabClass,
            onClick: () => onClickTab(TABS_DATAAGENT.SQL_FORM),
          },
          {
            key: 4,
            label: "Index List",
            icon: <Database size={16} />,
            activeTab: selectedTab === TABS_DATAAGENT.RAG_FORM,
            activeClass: parentselectedTabClass,
            unActiveClass: unparentselectedTabClass,
            className: parentTabClass,
            onClick: () => onClickTab(TABS_DATAAGENT.RAG_FORM),
          },
          {
            key: 5,
            label: "Suggestion List",
            icon: <MessageSquareText size={16} />,
            activeTab: selectedTab === TABS_DATAAGENT.SUGGESTION,
            activeClass: parentselectedTabClass,
            unActiveClass: unparentselectedTabClass,
            className: `${parentTabClass} !min-w-[130px]`,
            onClick: () => onClickTab(TABS_DATAAGENT.SUGGESTION),
          },
        ]}
        className="px-6 py-3 border-b bg-white"
      />
    </div>
  );
};
