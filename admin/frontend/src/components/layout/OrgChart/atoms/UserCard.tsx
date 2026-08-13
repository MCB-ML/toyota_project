import { motion } from "framer-motion";
import { GitBranch, LayoutGrid } from "lucide-react";
import { useMemo, useState } from "react";
import { RiBuildingLine } from "react-icons/ri";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { CompanyTreeData, EndUserItem } from "@/types/orgChart.types";

export const UserCard = ({
  user,
  lookupCompanies,
}: {
  user: EndUserItem;
  lookupCompanies: CompanyTreeData[];
}) => {
  const [activeFilter, setActiveFilter] = useState<{
    type: "company" | "branch" | "workspace";
    id: string;
  } | null>(null);

  const { companies, branches, workspaces } = useMemo(() => {
    const companiesMap = new Map();
    const branchesMap = new Map();
    const workspacesMap = new Map();

    user.assignments.forEach((assignment) => {
      const company = lookupCompanies.find((c) => c.id === assignment.companyId);

      if (company) {
        if (!companiesMap.has(company.id)) {
          companiesMap.set(company.id, company);
        }

        const branch = company.branches?.find((b) => b.id === assignment.branchId);
        if (branch) {
          if (!branchesMap.has(branch.id)) {
            branchesMap.set(branch.id, { ...branch, companyId: company.id });
          }

          const workspace = branch.workspaces?.find((w) => w.id === assignment.workspaceId);
          if (workspace && !workspacesMap.has(workspace.id)) {
            workspacesMap.set(workspace.id, {
              ...workspace,
              branchId: branch.id,
            });
          }
        }
      }
    });

    return {
      companies: Array.from(companiesMap.values()),
      branches: Array.from(branchesMap.values()),
      workspaces: Array.from(workspacesMap.values()),
    };
  }, [user, lookupCompanies]);

  // Filtering Logic
  const isCompanyActive = (cId: string) => {
    if (!activeFilter) return false;
    if (activeFilter.type === "company") return activeFilter.id === cId;
    if (activeFilter.type === "branch") {
      const activeBranch = branches.find((b) => b.id === activeFilter.id);
      return activeBranch?.companyId === cId;
    }
    if (activeFilter.type === "workspace") {
      const activeWs = workspaces.find((w) => w.id === activeFilter.id);
      const activeBranch = branches.find((b) => b.id === activeWs?.branchId);
      return activeBranch?.companyId === cId;
    }
    return false;
  };

  const isBranchActive = (bId: string) => {
    if (!activeFilter) return false;
    if (activeFilter.type === "company") {
      const branch = branches.find((b) => b.id === bId);
      return branch?.companyId === activeFilter.id;
    }
    if (activeFilter.type === "branch") return activeFilter.id === bId;
    if (activeFilter.type === "workspace") {
      const activeWs = workspaces.find((w) => w.id === activeFilter.id);
      return activeWs?.branchId === bId;
    }
    return false;
  };

  const isWorkspaceActive = (wId: string) => {
    if (!activeFilter) return false;
    if (activeFilter.type === "company") {
      // find workspace -> branch -> company match
      const ws = workspaces.find((w) => w.id === wId);
      const branch = branches.find((b) => b.id === ws?.branchId);
      return branch?.companyId === activeFilter.id;
    }
    if (activeFilter.type === "branch") {
      const ws = workspaces.find((w) => w.id === wId);
      return ws?.branchId === activeFilter.id;
    }
    if (activeFilter.type === "workspace") return activeFilter.id === wId;
    return false;
  };

  const handleFilterClick = (type: "company" | "branch" | "workspace", id: string) => {
    if (activeFilter?.type === type && activeFilter.id === id) {
      setActiveFilter(null); // Toggle off
    } else {
      setActiveFilter({ type, id });
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl shadow-lg border border-[#f3f4f6] overflow-hidden flex flex-col h-[500px]"
    >
      {/* User Info Header */}
      <div className="p-6 bg-linear-to-br from-[#fdf4ff] to-white shrink-0 border-b border-[#f3f4f6] flex items-center gap-4">
        <Avatar className="w-16 h-16 border-4 border-white shadow-sm">
          {user.userAvatar && (
            <AvatarImage
              src={
                user.userAvatar.startsWith("data:")
                  ? user.userAvatar
                  : `data:image/jpeg;base64,${user.userAvatar}`
              }
              alt={user.name}
            />
          )}

          <AvatarFallback className="text-lg bg-[#f3f4f6] text-[#111827]">
            {user.username.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold text-[#101828] leading-tight truncate" title={user.name}>
            {user.name}
          </h3>
          <p className="text-sm text-[#6a7282] truncate" title={user.email}>
            {user.email}
          </p>
          <span className="inline-block mt-2 text-xs font-semibold px-2 py-0.5 rounded bg-[#fae8ff] text-[#d946ef] uppercase tracking-wide">
            {user.role}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-[#e5e7eb]">
        {/* Companies Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <RiBuildingLine className="text-[#9ca3af] w-4 h-4" />
            <h4 className="text-sm font-semibold text-[#101828]">
              Companies <span className="text-[#9ca3af] font-normal">({companies.length})</span>
            </h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {companies.map((comp) => {
              const active = isCompanyActive(comp.id);
              return (
                <button
                  key={comp.id}
                  onClick={() => handleFilterClick("company", comp.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border text-left flex items-center gap-2 ${
                    active
                      ? "bg-[#101828] text-white border-[#101828] shadow-md"
                      : `bg-white text-[#374151] border-[#e5e7eb] hover:bg-[#f9fafb] ${activeFilter ? "opacity-50" : ""}`
                  }`}
                >
                  {comp.companyName}
                </button>
              );
            })}
          </div>
        </div>

        {/* Branches Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <GitBranch className="text-[#9ca3af] w-4 h-4" />
            <h4 className="text-sm font-semibold text-[#101828]">
              Branches <span className="text-[#9ca3af] font-normal">({branches.length})</span>
            </h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {branches.map((branch) => {
              const active = isBranchActive(branch.id);
              return (
                <button
                  key={branch.id}
                  onClick={() => handleFilterClick("branch", branch.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
                    active
                      ? "bg-[#155dfc] text-white border-[#155dfc] shadow-md"
                      : `bg-[#f9fafb] text-[#4b5563] border-[#e5e7eb] hover:bg-[#eff6ff] ${activeFilter ? "opacity-40" : ""}`
                  }`}
                >
                  {branch.branchName}
                </button>
              );
            })}
          </div>
        </div>

        {/* Workspaces Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <LayoutGrid className="text-[#9ca3af] w-4 h-4" />
            <h4 className="text-sm font-semibold text-[#101828]">
              Workspaces <span className="text-[#9ca3af] font-normal">({workspaces.length})</span>
            </h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {workspaces.map((ws) => {
              const active = isWorkspaceActive(ws.id);
              return (
                <button
                  key={ws.id}
                  onClick={() => handleFilterClick("workspace", ws.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
                    active
                      ? "bg-[#4f39f6] text-white border-[#4f39f6] shadow-md"
                      : `bg-white text-[#374151] border-[#e5e7eb] hover:border-[#a5b4fc] ${activeFilter ? "opacity-40" : ""}`
                  }`}
                >
                  {ws.workspaceName}
                </button>
              );
            })}
          </div>
        </div>

        {/* Clear Filter Prompt */}
        {activeFilter && (
          <div className="flex justify-center pt-2">
            <button
              onClick={() => setActiveFilter(null)}
              className="text-xs text-[#6b7280] hover:text-[#1a73e8] underline decoration-dotted underline-offset-2 transition-colors"
            >
              Clear selection
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};
