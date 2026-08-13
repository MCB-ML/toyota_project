import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useGetCompanyView } from "@/services/api/orgChart/getCompanyView";
import type { CompanyTreeData } from "../../../../types/orgChart.types";

interface UsersWorkspaceSelectorProps {
  selectedWorkspaceIds: string[];
  onChange: (ids: string[]) => void;
  error?: boolean;
  errorMessage?: string;

  companyId?: string;
  branchId?: string;
  workspaceId?: string;
}

const UsersWorkspaceSelector = ({
  selectedWorkspaceIds,
  onChange,
  error,
  errorMessage,

  companyId = "",
  branchId = "",
  workspaceId = "",
}: UsersWorkspaceSelectorProps) => {
  const { data, isLoading } = useGetCompanyView();

  const companies = useMemo(() => {
    if (!data?.companies) return [];

    return data.companies
      .filter((company: CompanyTreeData) => (companyId ? company.id === companyId : true))
      .map((company: CompanyTreeData) => ({
        ...company,
        branches: company.branches
          ?.filter((branch) => (branchId ? branch.id === branchId : true))
          .map((branch) => ({
            ...branch,
            workspaces: branch.workspaces?.filter((workspace) =>
              workspaceId ? workspace.id === workspaceId : true,
            ),
          })),
      }));
  }, [data?.companies, companyId, branchId, workspaceId]);
  const [expandedCompanies, setExpandedCompanies] = useState<Record<string, boolean>>({});
  const [expandedBranches, setExpandedBranches] = useState<Record<string, boolean>>({});

  const toggleCompany = (id: string) => {
    setExpandedCompanies((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleBranch = (id: string) => {
    setExpandedBranches((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleWorkspace = (id: string | number) => {
    const stringId = String(id);
    const newSelected = selectedWorkspaceIds.includes(stringId)
      ? selectedWorkspaceIds.filter((wid) => wid !== stringId)
      : [...selectedWorkspaceIds, stringId];
    onChange(newSelected);
  };

  return (
    <div className="border border-[#e5e7eb] rounded-lg overflow-hidden bg-white">
      <div className="p-3 bg-[#f9fafb] border-b border-[#e5e7eb] text-sm font-medium text-[#374151]">
        Select Workspaces
      </div>
      <div className="max-h-[300px] overflow-y-auto p-2 space-y-1">
        {isLoading ? (
          <div className="p-4 text-center text-sm text-gray-500">Loading workspaces...</div>
        ) : (
          companies?.map((company) => (
            <div key={company.id} className="select-none">
              {/* Company Row */}
              <div
                className="flex items-center gap-2 p-2 hover:bg-[#f9fafb] rounded-md cursor-pointer"
                onClick={() => toggleCompany(company.id.toString())}
              >
                {expandedCompanies[company.id] ? (
                  <ChevronDown className="w-4 h-4 text-[#9ca3af]" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-[#9ca3af]" />
                )}
                <span className="text-sm font-medium text-[#1f2937]">{company.companyName}</span>
              </div>

              {/* Branches */}
              <AnimatePresence>
                {expandedCompanies[company.id] && company.branches && (
                  <motion.div
                    key="branches-list"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden ml-4 border-l border-[#e5e7eb] pl-2"
                  >
                    {company.branches.map((branch) => (
                      <div key={branch.id} className="mt-1">
                        <div
                          className="flex items-center gap-2 p-2 hover:bg-[#f9fafb] rounded-md cursor-pointer"
                          onClick={() => toggleBranch(branch.id.toString())}
                        >
                          {expandedBranches[branch.id] ? (
                            <ChevronDown className="w-3 h-3 text-[#9ca3af]" />
                          ) : (
                            <ChevronRight className="w-3 h-3 text-[#9ca3af]" />
                          )}
                          <span className="text-sm text-[#374151]">{branch.branchName}</span>
                        </div>

                        {/* Workspaces */}
                        <AnimatePresence>
                          {expandedBranches[branch.id] && branch.workspaces && (
                            <motion.div
                              key="workspaces-list"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden ml-4 border-l border-[#e5e7eb] pl-2 py-1 space-y-1"
                            >
                              {branch.workspaces.map((ws) => {
                                const isSelected = selectedWorkspaceIds.includes(String(ws.id));
                                return (
                                  <div
                                    key={ws.id}
                                    onClick={() => toggleWorkspace(ws.id)}
                                    className={cn(
                                      "flex items-center gap-2 p-2 rounded-md cursor-pointer text-sm transition-colors ",
                                      isSelected
                                        ? "bg-[#eff6ff] text-[#155dfc]"
                                        : "hover:bg-[#f9fafb] text-[#4b5563]",
                                      workspaceId ? "pointer-events-none" : "",
                                    )}
                                  >
                                    <div
                                      className={cn(
                                        "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                                        isSelected
                                          ? "bg-[#155dfc] border-[#155dfc]"
                                          : "border-[#d1d5db] bg-white",
                                      )}
                                    >
                                      {isSelected && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <span>{ws.workspaceName}</span>
                                  </div>
                                );
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))
        )}
      </div>
      {error && errorMessage && (
        <div className="px-3 py-1 text-xs text-[#E30018] bg-red-50 border-t border-red-100">
          {errorMessage}
        </div>
      )}
    </div>
  );
};

export default UsersWorkspaceSelector;
