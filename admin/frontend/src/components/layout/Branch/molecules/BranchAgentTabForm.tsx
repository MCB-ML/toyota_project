import { BookOpen, Plug, Settings } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { CompanyTabProps } from "@/types/companyInfo.types";
import { TABS_BRANCH } from "../../../../types/branch.types";
import { TabGroup } from "../../CompanyInfo/molecules/CompanyTabGroup";

export const BranchAgentTabForm = ({ onClickTab, selectedTab }: CompanyTabProps) => {
  const { t } = useTranslation();
  const childTabClass =
    "w-40 flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-md transition";
  const childselectedTabClass = "bg-blue-100 text-blue-700";
  const unSelectedchildTabClass = "text-gray-600 hover:bg-gray-100";

  const isDataAgent = selectedTab.startsWith("agent");
  const isAIAgent = selectedTab === TABS_BRANCH.AI_AGENT;

  if (!isDataAgent && !isAIAgent) return null;

  const items = [
    {
      key: 2,
      label: t("Branch.sqlConnection"),
      icon: <Plug size={16} />,
      activeTab: selectedTab === TABS_BRANCH.AGENT_SQL,
      activeClass: childselectedTabClass,
      unActiveClass: unSelectedchildTabClass,
      className: childTabClass,
      onClick: () => onClickTab(TABS_BRANCH.AGENT_SQL),
    },

    ...(isDataAgent
      ? [
          {
            key: 1,
            label: t("Branch.general"),
            icon: <Settings size={16} />,
            activeTab: selectedTab === TABS_BRANCH.DATA_AGENT,
            activeClass: childselectedTabClass,
            unActiveClass: unSelectedchildTabClass,
            className: childTabClass,
            onClick: () => onClickTab(TABS_BRANCH.DATA_AGENT),
          },
          {
            key: 3,
            label: t("Branch.ragConnection"),
            icon: <BookOpen size={16} />,
            activeTab: selectedTab === TABS_BRANCH.AGENT_RAG,
            activeClass: childselectedTabClass,
            unActiveClass: unSelectedchildTabClass,
            className: childTabClass,
            onClick: () => onClickTab(TABS_BRANCH.AGENT_RAG),
          },
        ]
      : []),
  ];

  return (
    <div className="flex items-center justify-center gap-4 px-6 py-2 bg-gray-50 border-b">
      <TabGroup items={items} />
    </div>
  );
};
