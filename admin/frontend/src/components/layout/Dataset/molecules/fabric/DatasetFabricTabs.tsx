import { Database, FileText, Share2 } from "lucide-react";
import { TABS_FABRIC } from "../../../../../types/datasetFabric.types";
import { TabGroup } from "../../../CompanyInfo/molecules/CompanyTabGroup";
import type { DatasetFabricAction } from "../../DatasetFabric.reducer";

interface DatasetFabricTabsProps {
  selectedTab: string;
  dispatch: React.Dispatch<DatasetFabricAction>;
}

export const DatasetFabricTabs = ({ selectedTab, dispatch }: DatasetFabricTabsProps) => {
  const parentTabClass = "flex items-center gap-2 text-sm font-medium transition ";
  const parentselectedTabClass = " bg-white p-2 rounded-xl shadow  px-5 border ";
  const unparentselectedTabClass = "text-gray-500 hover:text-gray-700";

  return (
    <div className="flex items-center gap-6 px-6 py-3 sticky top-0 z-10">
      <TabGroup
        items={[
          {
            key: 1,
            label: "Relationship Canvas",
            icon: <Share2 size={16} />,
            activeTab: selectedTab === TABS_FABRIC.RELATION_TABLE,
            activeClass: parentselectedTabClass,
            unActiveClass: unparentselectedTabClass,
            className: parentTabClass,
            onClick: () => dispatch({ type: "selectedTab", payload: TABS_FABRIC.RELATION_TABLE }),
          },
          {
            key: 2,
            label: "Generated SQL",
            icon: <Database size={16} />,
            activeTab: selectedTab === TABS_FABRIC.GENERATE_SQL,
            activeClass: parentselectedTabClass,
            unActiveClass: unparentselectedTabClass,
            className: parentTabClass,
            onClick: () => dispatch({ type: "selectedTab", payload: TABS_FABRIC.GENERATE_SQL }),
          },
          {
            key: 3,
            label: "Preview Data",
            icon: <FileText size={16} />,
            activeTab: selectedTab === TABS_FABRIC.PREVIEW,
            activeClass: parentselectedTabClass,
            unActiveClass: unparentselectedTabClass,
            className: parentTabClass,
            onClick: () => dispatch({ type: "selectedTab", payload: TABS_FABRIC.PREVIEW }),
          },
        ]}
        className="px-6 py-3 border-b bg-white"
      />
    </div>
  );
};
