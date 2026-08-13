import { AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import FloatingNav from "@/components/reusable/FloatingNav";
import type { NavItem } from "@/types/navigation.types";
import OrgChartSearch from "../molecules/OrgChartSearch";
import BranchesView from "./BranchesView";
import CompanyView from "./CompanyView";
import EndUsersView from "./EndUsersView";
import WorkspacesView from "./WorkspacesView";

const navItems: NavItem[] = [
  { name: "Company", id: "company" },
  { name: "Branches", id: "branches" },
  { name: "Workspaces", id: "workspaces" },
  { name: "Users", id: "endUsers" },
];

const OrgChartMainComponent = () => {
  const [activeOrgSetup, setActiveOrgSetup] = useState<string>("company");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const renderOrgSetup = () => {
    switch (activeOrgSetup) {
      case "company":
        return <CompanyView key="company" searchQuery={searchQuery} />;
      case "branches":
        return <BranchesView key="branches" searchQuery={searchQuery} />;
      case "workspaces":
        return <WorkspacesView key="workspaces" searchQuery={searchQuery} />;
      case "endUsers":
        return <EndUsersView key="endUsers" searchQuery={searchQuery} />;
      default:
        return <CompanyView key="company" searchQuery={searchQuery} />;
    }
  };

  // Reset search query when tab changes
  useEffect(() => {
    setSearchQuery("");
  }, []);

  return (
    <div className="relative min-h-screen w-full bg-[#f2f5fa]">
      <div className="hidden md:block sticky top-0 z-50 w-full pointer-events-none pt-6 px-6 lg:px-10">
        {/* Desktop Nav and search */}
        <div className="relative w-full flex justify-center items-start">
          <div className="pointer-events-auto">
            <FloatingNav
              items={navItems}
              activeItem={activeOrgSetup}
              onItemClick={setActiveOrgSetup}
            />
          </div>

          <div className="absolute right-0 top-0 w-[300px] pointer-events-auto">
            <OrgChartSearch
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={`Search ${activeOrgSetup === "endUsers" ? "end users" : activeOrgSetup}...`}
            />
          </div>
        </div>
      </div>

      {/* Mobile Nav and search  */}
      <div className="md:hidden">
        <FloatingNav items={navItems} activeItem={activeOrgSetup} onItemClick={setActiveOrgSetup} />
      </div>

      <div className="md:hidden w-full pl-4 pr-18 pt-4.5 pb-2 relative z-40">
        <OrgChartSearch
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={`Search ${activeOrgSetup === "endUsers" ? "End Users" : activeOrgSetup}...`}
        />
      </div>

      {/* Content Area */}
      <div className="pt-4">
        <AnimatePresence mode="wait">{renderOrgSetup()}</AnimatePresence>
      </div>
    </div>
  );
};

export default OrgChartMainComponent;
