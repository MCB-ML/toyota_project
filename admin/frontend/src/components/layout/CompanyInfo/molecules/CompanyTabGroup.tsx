import type { TabButtonProps, TabGroupProps } from "@/types/companyInfo.types";
import { TabButton } from "../atoms/CompanyTab";

export const TabGroup = ({ items }: TabGroupProps) => {
  return items.map((item: TabButtonProps, _index: number) => (
    <TabButton
      key={item.key}
      label={item.label}
      icon={item.icon}
      onClick={item.onClick}
      activeClass={item.activeClass}
      activeTab={item.activeTab}
      unActiveClass={item.unActiveClass}
      className={item.className}
    />
  ));
};
