import { Database, Settings } from "lucide-react";

import type { CompanyTabProps } from "@/types/companyInfo.types";
import { TABS_DATASET_IMPORT } from "../../../../types/dataset.types";
import { TabGroup } from "../../CompanyInfo/molecules/CompanyTabGroup";

interface DatasetTabImportProps extends CompanyTabProps {
  title: string;
}

export const DatasetTabImport = ({ onClickTab, selectedTab, title }: DatasetTabImportProps) => {
  const parentTabClass = "flex items-center gap-2 text-sm font-medium transition ";
  const parentselectedTabClass = "  p-2 rounded-xl   px-5  bg-blue-100 text-blue-700";
  const unparentselectedTabClass = "text-gray-500 hover:text-gray-700";

  return (
    <div className="flex items-center gap-6 ">
      <TabGroup
        items={[
          {
            key: 1,
            label: `New ${title}`,
            icon: <Settings size={16} />,
            activeTab: selectedTab === TABS_DATASET_IMPORT.NEW,
            activeClass: parentselectedTabClass,
            unActiveClass: unparentselectedTabClass,
            className: parentTabClass,
            onClick: () => onClickTab(TABS_DATASET_IMPORT.NEW),
          },
          {
            key: 2,
            label: `Existing ${title}`,
            icon: <Database size={16} />,
            activeTab: selectedTab === TABS_DATASET_IMPORT.EXISTING,
            activeClass: parentselectedTabClass,
            unActiveClass: unparentselectedTabClass,
            className: parentTabClass,
            onClick: () => onClickTab(TABS_DATASET_IMPORT.EXISTING),
          },
        ]}
        className="px-6 py-3 border-b bg-white"
      />
    </div>
  );
};
