import { AnimatePresence, motion } from "framer-motion";
import { Building2, ChevronDown, ChevronRight, GitFork, LayoutGrid, Monitor } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { v7 as uuidv7 } from "uuid";
import DeleteConfirmDialog from "@/components/reusable/DeleteConfirmDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useDeleteAiAgent } from "@/services/api/aiAgent/deleteAiAgentConfig";
import { useGetAllAiAgents } from "@/services/api/aiAgent/getAllAiAgents";
import { useGetAllWorkspaces } from "@/services/api/workspace/getAllWorkspaces";
import { useUiHeaderStore } from "@/store/uiHeaderStore";
import type { AiAgent, AiAgentCompany, AiAgentWithWorkspace } from "@/types/aiAgent.types";
import AiAgentAddNew from "../molecules/AiAgentAddNew";
import AiAgentTable from "../molecules/AiAgentTable";

const AiAgentMainComponent = () => {
  const { t } = useTranslation();
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [editAgent, setEditAgent] = useState<AiAgentWithWorkspace | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<AiAgent | null>(null);

  const [newAgentId, setNewAgentId] = useState<string>("");
  const { setHeaderAction } = useUiHeaderStore();

  // Fetch Data for agents
  const {
    data: hierarchyData,
    isLoading: isLoadingAgents,
    isError: isErrorAgents,
    refetch: refetchAgents,
  } = useGetAllAiAgents();
  const {
    data: workspacesData,
    isLoading: isLoadingWorkspaces,
    isError: isErrorWorkspaces,
    refetch: refetchWorkspaces,
  } = useGetAllWorkspaces();

  const isLoading = isLoadingAgents || isLoadingWorkspaces;
  const isError = isErrorAgents || isErrorWorkspaces;

  const refetch = () => {
    refetchAgents();
    refetchWorkspaces();
  };

  const companies = useMemo<AiAgentCompany[]>(() => {
    if (!hierarchyData?.data || !workspacesData?.workspaces) return [];

    const baseHierarchy: AiAgentCompany[] = JSON.parse(JSON.stringify(hierarchyData.data));
    const allWorkspaces = workspacesData.workspaces;

    // 1. Get IDs of workspace that has type === 'aiAgent'
    const validWorkspaceIds = new Set(
      allWorkspaces.filter((w) => w.workspaceType === "aiAgent").map((w) => w.workspaceId),
    );

    const filteredHierarchy = baseHierarchy
      .map((company) => {
        const filteredBranches = company.branches
          .map((branch) => {
            const filteredWorkspaces = branch.workspaces.filter((ws) =>
              validWorkspaceIds.has(ws.workspaceId),
            );
            return { ...branch, workspaces: filteredWorkspaces };
          })
          .filter((branch) => branch.workspaces.length > 0);

        return { ...company, branches: filteredBranches };
      })
      .filter((company) => company.branches.length > 0);

    return filteredHierarchy;
  }, [hierarchyData, workspacesData]);

  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>("");

  const [expandedCompanies, setExpandedCompanies] = useState<Record<string, boolean>>({});
  const [expandedBranches, setExpandedBranches] = useState<Record<string, boolean>>({});

  // Header Actions
  useEffect(() => {
    if (selectedWorkspaceId) {
      setHeaderAction({
        label: "Add Ai Agent",
        onClick: () => {
          setNewAgentId(uuidv7());
          setEditAgent(null);
          setIsAddOpen(true);
        },
      });
    } else {
      setHeaderAction(null);
    }

    return () => setHeaderAction(null);
  }, [selectedWorkspaceId, setHeaderAction]);

  // Auto expand/collapse
  useEffect(() => {
    if (companies.length > 0 && !selectedCompanyId) {
      const firstCompany = companies[0];
      setSelectedCompanyId(firstCompany.companyId);
      setExpandedCompanies({ [firstCompany.companyId]: true });

      if (firstCompany.branches.length > 0) {
        const firstBranch = firstCompany.branches[0];
        setSelectedBranchId(firstBranch.branchId);
        setExpandedBranches({ [firstBranch.branchId]: true });

        if (firstBranch.workspaces.length > 0) {
          setSelectedWorkspaceId(firstBranch.workspaces[0].workspaceId);
        }
      }
    }
  }, [companies, selectedCompanyId]);

  useEffect(() => {
    if (isError) {
      toast.error(t("AiAgent.failedToFetchAgents"), {
        description: t("AiAgent.pleaseTryAgain"),
        action: {
          label: t("common.retry"),
          onClick: () => refetch(),
        },
        classNames: {
          actionButton: "!bg-destructive !text-destructive-foreground hover:!bg-destructive/90",
        },
      });
    }
  }, [isError, refetch]);

  const toggleCompany = (companyId: string) => {
    setExpandedCompanies({
      [companyId]: !expandedCompanies[companyId],
    });
    setSelectedCompanyId(companyId);

    // Auto select logic when switching company
    const company = companies.find((c) => c.companyId === companyId);
    if (company && company.branches.length > 0) {
      const firstBranch = company.branches[0];
      setSelectedBranchId(firstBranch.branchId);
      setExpandedBranches({
        [firstBranch.branchId]: true,
      });

      if (firstBranch.workspaces.length > 0) {
        setSelectedWorkspaceId(firstBranch.workspaces[0].workspaceId);
      } else {
        setSelectedWorkspaceId("");
      }
    } else {
      setSelectedBranchId("");
      setSelectedWorkspaceId("");
    }
  };

  const toggleBranch = (branchId: string, companyId: string) => {
    setExpandedBranches({
      [branchId]: !expandedBranches[branchId],
    });
    setSelectedBranchId(branchId);
    setSelectedCompanyId(companyId);

    // Auto select logic when switching branch
    const company = companies.find((c) => c.companyId === companyId);
    const branch = company?.branches.find((b) => b.branchId === branchId);

    if (branch && branch.workspaces.length > 0) {
      setSelectedWorkspaceId(branch.workspaces[0].workspaceId);
    } else {
      setSelectedWorkspaceId("");
    }
  };

  const handleWorkspaceSelect = (workspaceId: string, branchId: string, companyId: string) => {
    setSelectedWorkspaceId(workspaceId);
    setSelectedBranchId(branchId);
    setSelectedCompanyId(companyId);
  };

  const { mutateAsync: deleteAgent, isPending: isDeleting } = useDeleteAiAgent();

  const handleDelete = (agent: AiAgent) => {
    setAgentToDelete(agent);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!agentToDelete) return;

    try {
      const response = await deleteAgent({ agentId: agentToDelete.agentId });
      if (response.success) {
        toast.success(response.message || t("AiAgent.agentDeleted"));
        setDeleteDialogOpen(false);
        setAgentToDelete(null);
        refetch(); // Refetch to update the list
      } else {
        toast.error(response.message || t("AiAgent.failedToDelete"));
      }
    } catch (error: any) {
      console.error("Error deleting agent:", error);
      toast.error(error.message || t("AiAgent.errorDeleting"));
    }
  };

  const handleEdit = (agent: AiAgent) => {
    setEditAgent(agent as AiAgentWithWorkspace);
    setIsAddOpen(true);
  };

  // Map selected branch and table data
  const selectedBranch = useMemo(() => {
    const company = companies.find((c) => c.companyId === selectedCompanyId);
    return company?.branches.find((b) => b.branchId === selectedBranchId);
  }, [companies, selectedCompanyId, selectedBranchId]);

  const selectedWorkspaceName = selectedBranch?.workspaces.find(
    (w) => w.workspaceId === selectedWorkspaceId,
  )?.workspaceName;

  const tableData: AiAgentWithWorkspace[] = useMemo(() => {
    if (!selectedBranch) return [];

    let agents: AiAgentWithWorkspace[] = [];

    // If a workspace is selected, filter
    if (selectedWorkspaceId) {
      const workspace = selectedBranch.workspaces.find(
        (w) => w.workspaceId === selectedWorkspaceId,
      );
      if (workspace) {
        agents = workspace.aiAgents.map((agent) => ({
          ...agent,
          workspaceName: workspace.workspaceName,
          workspaceId: workspace.workspaceId,
        }));
      }
    } else {
      // Otherwise show all
      agents = selectedBranch.workspaces.flatMap((workspace) =>
        workspace.aiAgents.map((agent) => ({
          ...agent,
          workspaceName: workspace.workspaceName,
          workspaceId: workspace.workspaceId,
        })),
      );
    }

    return agents;
  }, [selectedBranch, selectedWorkspaceId]);

  return (
    <div className="h-full flex flex-col bg-[#f2f5fa] lg:pl-2 md:px-2 lg:px-1 py-1 md:py-2 lg:py-3">
      <div className="flex flex-col lg:flex-row gap-2 flex-1 h-full">
        {/* Mobile Selectors */}
        <div className="lg:hidden w-full space-y-2">
          <Select value={selectedCompanyId} onValueChange={(val) => toggleCompany(val)}>
            <SelectTrigger className="w-full bg-white">
              <SelectValue placeholder={t("AiAgent.selectCompany")} />
            </SelectTrigger>
            <SelectContent>
              {companies.map((company) => (
                <SelectItem key={company.companyId} value={company.companyId}>
                  {company.companyName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedBranchId}
            onValueChange={(val) => toggleBranch(val, selectedCompanyId)}
            disabled={!selectedCompanyId}
          >
            <SelectTrigger className="w-full bg-white">
              <SelectValue placeholder={t("AiAgent.selectBranch")} />
            </SelectTrigger>
            <SelectContent>
              {companies
                .find((c) => c.companyId === selectedCompanyId)
                ?.branches.map((branch) => (
                  <SelectItem key={branch.branchId} value={branch.branchId}>
                    {branch.branchName}
                  </SelectItem>
                )) || []}
            </SelectContent>
          </Select>
        </div>

        {/* (Desktop) Sidebar */}
        <div className="hidden lg:flex flex-col w-64 bg-white border border-[#e5e7eb] shrink-0 rounded-lg shadow-lg">
          <div className="p-3 border-b border-[#f3f4f6] bg-[#f9fafb]/50 sticky top-0 z-10">
            <h3 className="font-semibold text-[#101828] text-sm flex items-center gap-2">
              {t("AiAgent.selectWorkspaceTitle")}
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {!isLoading && companies.length === 0 && (
              <div className="flex flex-col items-center justify-center p-4 text-center h-full text-gray-400">
                <Building2 className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-sm">{t("AiAgent.noWorkspacesFound")}</p>
              </div>
            )}
            {companies.map((company) => {
              const isExpanded = expandedCompanies[company.companyId];
              const isSelectedCompany = selectedCompanyId === company.companyId;

              return (
                <div key={company.companyId} className="select-none">
                  {/* Company Header */}
                  <div
                    className={cn(
                      "flex items-center gap-2 p-2 hover:bg-[#f9fafb] rounded-md cursor-pointer transition-colors",
                      isSelectedCompany ? "text-[#0f172b]" : "text-[#45556c]",
                    )}
                    onClick={() => toggleCompany(company.companyId)}
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-[#9ca3af] shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-[#9ca3af] shrink-0" />
                    )}
                    <Building2 className="w-4 h-4 text-[#6a7282] shrink-0" />
                    <span className="text-sm font-medium truncate">{company.companyName}</span>
                  </div>

                  {/* Branches & Workspaces List */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        key="branches-list"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden ml-4 border-l border-[#e5e7eb] pl-2"
                      >
                        {company.branches.map((branch) => {
                          const isBranchExpanded = expandedBranches[branch.branchId];
                          const isSelectedBranch = selectedBranchId === branch.branchId;

                          return (
                            <div key={branch.branchId}>
                              <div
                                onClick={() => toggleBranch(branch.branchId, company.companyId)}
                                className={cn(
                                  "flex items-center gap-2 p-2 mt-1 rounded-md cursor-pointer text-sm transition-colors",
                                  isSelectedBranch
                                    ? "text-[#1d293d] font-medium"
                                    : "text-[#4b5563] hover:bg-[#f9fafb]",
                                )}
                              >
                                {isBranchExpanded ? (
                                  <ChevronDown className="w-3 h-3 text-[#9ca3af] shrink-0" />
                                ) : (
                                  <ChevronRight className="w-3 h-3 text-[#9ca3af] shrink-0" />
                                )}
                                <GitFork className="w-4 h-4 shrink-0 text-[#9ca3af]" />
                                <span className="truncate">{branch.branchName}</span>
                              </div>

                              <AnimatePresence>
                                {isBranchExpanded && (
                                  <motion.div
                                    key="workspaces-list"
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden ml-4 border-l border-[#e5e7eb] pl-2"
                                  >
                                    {branch.workspaces.map((workspace) => {
                                      const isSelectedWorkspace =
                                        selectedWorkspaceId === workspace.workspaceId;
                                      return (
                                        <div
                                          key={workspace.workspaceId}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleWorkspaceSelect(
                                              workspace.workspaceId,
                                              branch.branchId,
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
                                              isSelectedWorkspace
                                                ? "text-[#155dfc]"
                                                : "text-[#9ca3af]",
                                            )}
                                          />
                                          <span className="truncate">
                                            {workspace.workspaceName}
                                          </span>
                                        </div>
                                      );
                                    })}
                                    {branch.workspaces.length === 0 && (
                                      <div className="text-xs text-[#99a1af] py-2 pl-2 italic">
                                        {t("AiAgent.noWorkspaces")}
                                      </div>
                                    )}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                        {company.branches.length === 0 && (
                          <div className="text-xs text-[#99a1af] py-2 pl-2 italic">
                            {t("AiAgent.noBranches")}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Agent Table */}
        <div className="flex-1 min-w-0 flex flex-col">
          {selectedWorkspaceId || isLoading ? (
            <div className="flex-1 flex flex-col h-full">
              <div className="bg-white p-4 rounded-t-xl border-b border-[#f3f4f6] lg:hidden shrink-0">
                <h2 className="font-semibold text-[#101828]">
                  {selectedWorkspaceName || t("AiAgent.loadingDetails")}
                </h2>
              </div>
              <AiAgentTable
                data={tableData}
                isLoading={isLoading}
                onDelete={handleDelete}
                onEdit={handleEdit}
                className="flex-1 h-full min-h-0"
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-white rounded-xl border border-[#d1d5dc] min-h-[500px] h-full">
              <div className="text-center p-6">
                <div className="w-12 h-12 bg-[#f3f4f6] rounded-full flex items-center justify-center mx-auto mb-3">
                  <LayoutGrid className="w-6 h-6 text-[#99a1af]" />
                </div>
                <h3 className="text-lg font-medium text-[#101828]">
                  {t("AiAgent.noWorkspaceSelected")}
                </h3>
                <p className="text-sm text-[#6a7282] mt-1">{t("AiAgent.selectWorkspaceToView")}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <AiAgentAddNew
        open={isAddOpen}
        onClose={() => {
          setIsAddOpen(false);
          setEditAgent(null);
        }}
        generatedId={newAgentId}
        workspaceId={editAgent ? editAgent.workspaceId : selectedWorkspaceId}
        companyId={
          editAgent
            ? companies.find((c) =>
                c.branches.some((b) =>
                  b.workspaces.some((w) => w.workspaceId === editAgent.workspaceId),
                ),
              )?.companyId || ""
            : selectedCompanyId
        }
        refetchAgents={refetch}
        editData={editAgent}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => {
          if (!isDeleting) {
            setDeleteDialogOpen(false);
            setAgentToDelete(null);
          }
        }}
        onConfirm={confirmDelete}
        title={t("AiAgent.deleteAiAgent")}
        description={t("AiAgent.deleteConfirm", {
          name: agentToDelete?.agentName,
        })}
        isLoading={isDeleting}
        preventCloseOnOutsideClick={isDeleting}
      />
    </div>
  );
};

export default AiAgentMainComponent;
