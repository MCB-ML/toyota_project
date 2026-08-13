import { AnimatePresence, motion } from "framer-motion";
import { Building2, ChevronDown, ChevronRight, GitFork, LayoutGrid, Monitor } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import DeleteConfirmDialog from "@/components/reusable/DeleteConfirmDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useDeleteCopilotAgent } from "@/services/api/copilot/deleteCopilotAgent";
import { useGetAllCopilotAgents } from "@/services/api/copilot/getAllCopilotAgents";
import { useCreateCopilotAgent } from "@/services/api/copilot/postCreateCopilotAgent";
import { useUpdateCopilotAgent } from "@/services/api/copilot/putUpdateCopilotAgent";
import { useGetAllWorkspaces } from "@/services/api/workspace/getAllWorkspaces";
import { useUiHeaderStore } from "@/store/uiHeaderStore";
import type {
  CopilotAgent,
  CopilotAgentCompany,
  CopilotAgentWithWorkspace,
  CreateCopilotAgentRequest,
  UpdateCopilotAgentRequest,
} from "@/types/copilot.types";
import { getErrorMessage } from "@/utils/getErrorMessage";
import CopilotAddNew from "../molecules/CopilotAddNew";
import CopilotEdit from "../molecules/CopilotEdit";
import CopilotTable from "../molecules/CopilotTable";

const CopilotMainComponent = () => {
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
  const [selectedAgent, setSelectedAgent] = useState<CopilotAgent | null>(null);

  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>("");

  const [expandedCompanies, setExpandedCompanies] = useState<Record<string, boolean>>({});
  const [expandedBranches, setExpandedBranches] = useState<Record<string, boolean>>({});

  const {
    data: hierarchyData,
    isLoading: isLoadingAgents,
    isError: isErrorAgents,
    refetch: refetchAgents,
  } = useGetAllCopilotAgents();
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

  const companies = useMemo<CopilotAgentCompany[]>(() => {
    if (!hierarchyData?.data || !workspacesData?.workspaces) return [];

    const baseHierarchy: CopilotAgentCompany[] = JSON.parse(JSON.stringify(hierarchyData.data));
    const allWorkspaces = workspacesData.workspaces;

    // 1. Get IDs of workspace that has type === 'copilotAgent'
    const validWorkspaceIds = new Set(
      allWorkspaces.filter((w) => w.workspaceType === "copilotAgent").map((w) => w.workspaceId),
    );

    // 2. Filter the hierarchy
    const filteredHierarchy = baseHierarchy
      .map((company) => {
        const filteredBranches = company.branches
          .map((branch) => {
            const filteredWorkspaces = branch.workspaces.filter((ws) =>
              validWorkspaceIds.has(ws.workspaceId),
            );
            return { ...branch, workspaces: filteredWorkspaces };
          })
          .filter((branch) => branch.workspaces.length > 0); // Remove empty branches

        return { ...company, branches: filteredBranches };
      })
      .filter((company) => company.branches.length > 0); // Remove empty companies

    return filteredHierarchy;
  }, [hierarchyData, workspacesData]);

  const { setHeaderAction } = useUiHeaderStore();

  useEffect(() => {
    setHeaderAction({
      label: "Add Copilot Agent",
      onClick: () => setIsAddOpen(true),
      disabled: isLoading || !selectedWorkspaceId,
    });
    return () => setHeaderAction(null);
  }, [setHeaderAction, isLoading, selectedWorkspaceId]);

  const { mutate: createCopilot, isPending: isCreating } = useCreateCopilotAgent();
  const { mutate: updateCopilot } = useUpdateCopilotAgent();
  const { mutate: deleteCopilot, isPending: isDeleting } = useDeleteCopilotAgent();

  // Auto expand/select logic
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
      toast.error("Failed to fetch copilot agents", {
        description: "Please try again later or refresh the page.",
        action: {
          label: "Retry",
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

  // Map selected branch and table data
  const selectedBranch = useMemo(() => {
    const company = companies.find((c) => c.companyId === selectedCompanyId);
    return company?.branches.find((b) => b.branchId === selectedBranchId);
  }, [companies, selectedCompanyId, selectedBranchId]);

  const tableData: CopilotAgentWithWorkspace[] = useMemo(() => {
    if (!selectedBranch) return [];

    // If a workspace is selected, filter by it
    if (selectedWorkspaceId) {
      const workspace = selectedBranch.workspaces.find(
        (w) => w.workspaceId === selectedWorkspaceId,
      );
      if (!workspace) return [];
      return workspace.copilots.map((agent) => ({
        ...agent,
        workspaceName: workspace.workspaceName,
        workspaceId: workspace.workspaceId,
      }));
    }

    // Otherwise show all in branch (fallback if we wanted that, but based on requirements we mainly want workspace)
    return selectedBranch.workspaces.flatMap((workspace) =>
      workspace.copilots.map((agent) => ({
        ...agent,
        workspaceName: workspace.workspaceName,
        workspaceId: workspace.workspaceId,
      })),
    );
  }, [selectedBranch, selectedWorkspaceId]);

  const handleCreate = (data: any) => {
    // Implicitly use selectedWorkspaceId if not in data (data from form shouldn't have it anymore)
    const payload: CreateCopilotAgentRequest = {
      copilotAgentName: data.copilotAgentName,
      copilotAgentDescription: data.copilotAgentDescription,
      copilotAgentWebchatSecret: data.copilotAgentWebchatSecret,
      copilotAgentIsActive: data.copilotAgentIsActive,
      copilotAgentGreetings: data.copilotAgentGreetings,
      copilotAgentWorkspaceId: selectedWorkspaceId,
      seq: data.seq,
    };

    createCopilot(payload, {
      onSuccess: (res) => {
        if (res) {
          toast.success("Copilot Agent Created", {
            description: "New copilot agent added successfully.",
          });
          setIsAddOpen(false);
          refetch();
        }
      },
      onError: (error) => {
        toast.error("Failed to create copilot agent", {
          description: getErrorMessage(error),
        });
      },
    });
  };

  const handleUpdate = (data: any) => {
    if (!selectedAgent) return;

    const payload: UpdateCopilotAgentRequest = {
      copilotAgentName: data.copilotAgentName,
      copilotAgentDescription: data.copilotAgentDescription,
      copilotAgentWebchatSecret: data.copilotAgentWebchatSecret,
      copilotAgentIsActive: data.copilotAgentIsActive,
      copilotAgentGreetings: data.copilotAgentGreetings,
      copilotAgentWorkspaceId: data.copilotAgentWorkspaceId,
      seq: data.seq,
    };

    updateCopilot(
      { copilotAgentId: selectedAgent.copilotAgentId, payload },
      {
        onSuccess: (res) => {
          if (res) {
            toast.success("Copilot Agent Updated", {
              description: `Agent ${res.copilotAgentName} updated successfully.`,
            });
            setIsEditOpen(false);
            setSelectedAgent(null);
            refetch();
          }
        },
        onError: (error) => {
          toast.error("Failed to update copilot agent", {
            description: getErrorMessage(error),
          });
        },
      },
    );
  };

  const handleDelete = (row: CopilotAgent) => {
    setSelectedAgent(row);
    setIsDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (!selectedAgent) return;

    deleteCopilot(selectedAgent.copilotAgentId, {
      onSuccess: (res) => {
        if (res) {
          toast.success("Copilot Agent Deleted", {
            description: res.message || "Agent deleted successfully.",
          });
          setIsDeleteOpen(false);
          setSelectedAgent(null);
          refetch();
        }
      },
      onError: (error) => {
        toast.error("Failed to delete copilot agent", {
          description: getErrorMessage(error),
        });
      },
    });
  };

  const handleEdit = (row: CopilotAgent) => {
    setSelectedAgent(row);
    setIsEditOpen(true);
  };

  const selectedWorkspaceName = selectedBranch?.workspaces.find(
    (w) => w.workspaceId === selectedWorkspaceId,
  )?.workspaceName;

  return (
    <div className="h-full flex flex-col bg-[#f2f5fa] lg:pl-2 md:px-2 lg:px-1 py-1 md:py-2 lg:py-3">
      <div className="flex flex-col lg:flex-row gap-2 flex-1 h-full">
        {/* Mobile Selectors */}
        <div className="lg:hidden w-full space-y-2">
          <Select
            value={selectedCompanyId}
            onValueChange={(val) => {
              toggleCompany(val);
            }}
          >
            <SelectTrigger className="w-full bg-white">
              <SelectValue placeholder="Select Company" />
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
              <SelectValue placeholder="Select Branch" />
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
              Select Workspace
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
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
                                    ? "text-slate-800 font-medium"
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
                        {company.branches.length === 0 && (
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

        {/* Copilot Table */}
        <div className="flex-1 min-w-0 flex flex-col">
          {selectedWorkspaceId || isLoading ? (
            <div className="flex-1 flex flex-col h-full">
              <div className="bg-white p-4 rounded-t-xl border-b border-[#f3f4f6] lg:hidden shrink-0">
                <h2 className="font-semibold text-[#101828]">
                  {selectedWorkspaceName || "Loading..."}
                </h2>
              </div>
              <CopilotTable
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
                <h3 className="text-lg font-medium text-[#101828]">No Workspace Selected</h3>
                <p className="text-sm text-[#6a7282] mt-1">
                  Please select a specific workspace to view its Copilot Agents
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <CopilotAddNew
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={handleCreate}
        isLoading={isCreating}
        // No longer passing workspaces, as selection is implicit
      />

      <CopilotEdit
        open={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setSelectedAgent(null);
        }}
        onSubmit={handleUpdate}
        copilotData={selectedAgent}
        isLoading={false}
        workspaces={selectedBranch?.workspaces || []}
      />

      <DeleteConfirmDialog
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Copilot Agent"
        description={`Are you sure you want to delete ${selectedAgent?.copilotAgentName}? This action cannot be undone.`}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default CopilotMainComponent;
