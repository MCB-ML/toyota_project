import { AnimatePresence, motion } from "framer-motion";
import { Building2, ChevronDown, ChevronRight, GitFork, Monitor } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useGetBranchByCompanyId } from "../../../../services/api/branch/getBranchByCompanyId";
import { useGetAllWorkspaces } from "../../../../services/api/workspace/getAllWorkspaces";

interface DataAgentCompanySelectorProps {
  hierarchyData: any;
  selectedCompany: string;
  selectedBranchId: string;
  cat: string;
  dispatch: React.Dispatch<any>;
}

const DataAgentCompanySelector = ({
  hierarchyData,
  selectedCompany,
  selectedBranchId,
  cat,
  dispatch,
}: DataAgentCompanySelectorProps) => {
  const {
    data: workspacesData,
    isLoading: isLoadingWorkspaces,
    isError: isErrorWorkspaces,
    refetch: refetchWorkspaces,
  } = useGetAllWorkspaces();

  const companies = useMemo<any>(() => {
    if (!hierarchyData || !workspacesData?.workspaces) return [];

    const baseHierarchy: any = hierarchyData;
    const allWorkspaces = workspacesData.workspaces;

    const validWorkspaceIds = new Set(
      allWorkspaces
        ?.filter((w) => w.workspaceType !== null && w.workspaceType.toLowerCase() === cat)
        .map((w) => w.workspaceId),
    );

    const filteredHierarchy = baseHierarchy
      .map((company: any) => {
        const filteredBranches = company.branches
          .map((branch: any) => {
            const filteredWorkspaces = branch.workspaces.filter((ws: any) =>
              validWorkspaceIds.has(ws.workspaceId),
            );
            return { ...branch, workspaces: filteredWorkspaces };
          })
          .filter((branch: any) => branch.workspaces.length > 0);

        return { ...company, branches: filteredBranches };
      })
      .filter((company: any) => company.branches.length > 0);

    return filteredHierarchy;
  }, [hierarchyData, workspacesData]);

  const { data: branchData, isLoading: isLoadingBranches } = useGetBranchByCompanyId(
    selectedCompany || null,
  );

  const branches = branchData?.result || [];
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>("");
  const [expandedCompanies, setExpandedCompanies] = useState<Record<string, boolean>>({});
  const [expandedBranches, setExpandedBranches] = useState<Record<string, boolean>>({});

  const toggleCompany = (companyId: string) => {
    setExpandedCompanies({
      [companyId]: !expandedCompanies[companyId],
    });

    dispatch({ type: "selectedCompany", payload: companyId });

    const company = companies.find((c: any) => c.companyId === companyId);
    if (company && branches.length > 0) {
      const firstBranch = company.branches[0];
      const firstBranchId = firstBranch.branchId ?? "";
      dispatch({ type: "selectedBranchId", payload: firstBranchId });
      setExpandedBranches({
        [firstBranchId]: true,
      });

      if (firstBranch.workspaces.length > 0) {
        dispatch({ type: "selectedWorkspace", payload: firstBranch.workspaces[0].workspaceId });

        setSelectedWorkspaceId(firstBranch.workspaces[0].workspaceId);
      } else {
        dispatch({ type: "selectedWorkspace", payload: "" });

        setSelectedWorkspaceId("");
      }
    } else {
      dispatch({ type: "selectedBranchId", payload: "" });
      dispatch({ type: "selectedWorkspace", payload: "" });
      setSelectedWorkspaceId("");
    }
  };

  const toggleBranch = (branchId: string, companyId: string) => {
    setExpandedBranches({
      [branchId]: !expandedBranches[branchId],
    });

    dispatch({
      type: "handleBranchSelect",
      branchId: branchId || "",
      companyId: companyId,
    });

    const company = companies.find((c: any) => c.companyId === companyId);
    const branch = company?.branches.find((b: any) => b.branchId === branchId);

    if (branch && branch.workspaces.length > 0) {
      dispatch({ type: "selectedWorkspace", payload: branch.workspaces[0].workspaceId });
      setSelectedWorkspaceId(branch.workspaces[0].workspaceId);
    } else {
      dispatch({ type: "selectedWorkspace", payload: "" });
      setSelectedWorkspaceId("");
    }
  };

  const handleWorkspaceSelect = (workspaceId: string, branchId: string, companyId: string) => {
    setSelectedWorkspaceId(workspaceId);
    dispatch({
      type: "handleBranchSelect",
      branchId: branchId || "",
      companyId: companyId,
    });
  };

  useEffect(() => {
    if (companies.length > 0 && !selectedCompany) {
      const firstCompany = companies[0].companyId;

      dispatch({ type: "selectedCompany", payload: firstCompany });
      setExpandedCompanies({ [firstCompany]: true });
    }
  }, [companies, selectedCompany]);

  useEffect(() => {
    if (branches.length > 0 && !selectedBranchId) {
      const company = companies.find((c: any) => c.companyId === selectedCompany);
      const firstBranch = company.branches[0];
      dispatch({ type: "selectedBranchId", payload: firstBranch.branchId });
      setExpandedBranches({ [firstBranch.branchId]: true });

      if (firstBranch.workspaces.length > 0) {
        dispatch({ type: "selectedWorkspace", payload: firstBranch.workspaces[0].workspaceId });
        setSelectedWorkspaceId(firstBranch.workspaces[0].workspaceId);
      }
    }
  }, [branchData, selectedBranchId]);

  return (
    <div className="hidden lg:flex flex-col w-64 bg-white border border-[#e5e7eb] shrink-0 rounded-lg shadow-lg">
      <div className="p-3 border-b border-[#f3f4f6] bg-[#f9fafb]/50 sticky top-0 z-10">
        <h3 className="font-semibold text-[#101828] text-sm flex items-center gap-2">
          Select Company & Branch
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {companies.map((company: any) => {
          const isExpanded = expandedCompanies[company.companyId];
          const isSelectedCompany = selectedCompany === company.companyId;

          return (
            <div key={company.companyId} className="select-none">
              {/* Company Header */}
              <div
                className={cn(
                  "flex items-center gap-2 p-2 hover:bg-[#f9fafb] rounded-md cursor-pointer transition-colors",
                  selectedCompany === company.companyId ? "text-slate-900" : "text-slate-600",
                )}
                onClick={() => {
                  toggleCompany(company.companyId);
                  dispatch({ type: "toggleCompany", payload: company.companyId });
                }}
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-[#9ca3af] shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-[#9ca3af] shrink-0" />
                )}
                <Building2 className="w-4 h-4 text-[#6a7282] shrink-0" />
                <span className="text-xs font-medium truncate">{company.companyName}</span>
              </div>

              {/* Branches List */}
              <AnimatePresence>
                {isExpanded && isSelectedCompany && (
                  <motion.div
                    key={company.companyId}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden ml-4 border-l border-[#e5e7eb] pl-2"
                  >
                    {company?.branches?.map((branch: any) => {
                      const isBranchExpanded = expandedBranches[selectedBranchId];
                      const isSelected = selectedBranchId === branch.branchId;
                      return (
                        <div key={branch.branchId}>
                          <div
                            onClick={() => {
                              toggleBranch(selectedBranchId, company.companyId);
                              dispatch({
                                type: "handleBranchSelect",
                                branchId: branch.branchId || "",
                                companyId: company.companyId,
                              });
                            }}
                            className={cn(
                              "flex items-center gap-2 p-2 mt-1 rounded-md cursor-pointer text-sm transition-colors",
                              isSelected && !selectedWorkspaceId
                                ? "bg-[#eff6ff] text-[#155dfc] font-medium"
                                : isSelected
                                  ? "font-medium"
                                  : "hover:bg-[#f9fafb] text-[#4b5563]",
                            )}
                          >
                            {isBranchExpanded ? (
                              <ChevronDown className="w-3 h-3 text-[#9ca3af] shrink-0" />
                            ) : (
                              <ChevronRight className="w-3 h-3 text-[#9ca3af] shrink-0" />
                            )}
                            <GitFork
                              className={cn(
                                "w-4 h-4 shrink-0",
                                isSelected ? "text-[#155dfc]" : "text-[#9ca3af]",
                              )}
                            />
                            <span className="truncate text-xs">{branch.branchName}</span>
                          </div>
                          <AnimatePresence>
                            {isBranchExpanded && (
                              <motion.div
                                key={branch.branchId}
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden ml-4 border-l border-[#e5e7eb] pl-2"
                              >
                                {branch.workspaces.map((workspace: any) => {
                                  const isSelectedWorkspace =
                                    selectedWorkspaceId === workspace.workspaceId;
                                  return (
                                    <div
                                      key={workspace.workspaceId}
                                      onClick={(e) => {
                                        dispatch({
                                          type: "selectedWorkspace",
                                          payload: workspace.workspaceId,
                                        });
                                        e.stopPropagation();
                                        handleWorkspaceSelect(
                                          workspace.workspaceId,
                                          selectedBranchId,
                                          company.companyId,
                                        );
                                      }}
                                      className={cn(
                                        "flex items-center gap-2 p-2 mt-1 rounded-md cursor-pointer text-sm transition-colors",
                                        isSelectedWorkspace
                                          ? "bg-[#eff6ff] text-[#155dfc] font-medium"
                                          : "hover:bg-[#f9fafb] text-[#4b5563]",
                                      )}
                                    >
                                      <Monitor
                                        className={cn(
                                          "w-3.5 h-3.5 shrink-0",
                                          isSelectedWorkspace ? "text-[#155dfc]" : "text-[#9ca3af]",
                                        )}
                                      />
                                      <span className="truncate text-xs">
                                        {workspace.workspaceName}
                                      </span>
                                    </div>
                                  );
                                })}
                                {branch.workspaces.length === 0 && (
                                  <div className="text-xs text-gray-400 py-2 pl-2 italic">
                                    No workspaces
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                    {branches.length === 0 && (
                      <div className="text-xs text-gray-400 py-2 pl-2 italic">No branches</div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DataAgentCompanySelector;
