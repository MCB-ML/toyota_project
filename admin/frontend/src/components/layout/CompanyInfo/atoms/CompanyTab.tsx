import type { TabButtonProps } from "@/types/companyInfo.types";

export const TabButton = ({
  label,
  icon,
  activeTab = false,
  onClick,
  className,
  activeClass,
  unActiveClass,
}: TabButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={`${className}  ${activeTab ? activeClass : unActiveClass}`}
    >
      {icon}
      {label}
    </button>
  );
};
