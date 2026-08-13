import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Tab = {
  id: string;
  label: string;
};

type TabSwitcherProps = {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  className?: string;
};

const TabSwitcher = ({ tabs, activeTab, onTabChange, className }: TabSwitcherProps) => {
  return (
    <div className={cn("flex space-x-1 bg-[#f3f4f6] p-1 rounded-xl", className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "relative px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#1a73e8]",
              isActive
                ? "text-[#101828]"
                : "text-[#6b7280] hover:text-[#101828] hover:bg-[#f3f4f6]/50 cursor-pointer",
            )}
            style={{
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {isActive && (
              <motion.span
                layoutId="activeDir-pill"
                className="absolute inset-0 bg-white shadow-md rounded-lg"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default TabSwitcher;
