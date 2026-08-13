import { AnimatePresence, motion } from "framer-motion";
import { Building2, ChevronDown, ChevronRight, GitFork } from "lucide-react";
import { useEffect, useState } from "react";
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
import { useGetBranchByCompanyId } from "@/services/api/branch/getBranchByCompanyId";
import { useGetAllCompanyList } from "@/services/api/company/getAllCompany";
import { useDeleteWorkspace } from "@/services/api/workspace/deleteWorkspace";
import { useGetWorkspaceByBranchId } from "@/services/api/workspace/getWorkspaceByBranchId";
import { useCreateWorkspace } from "@/services/api/workspace/postCreateWorkspace";
import { useUpdateWorkspace } from "@/services/api/workspace/putUpdateWorkspace";
import { useUiHeaderStore } from "@/store/uiHeaderStore";
import type {
  CreateWorkspaceRequest,
  UpdateWorkspaceRequest,
  WorkspaceData,
} from "@/types/workspace.types";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { useSidebar } from "../../../ui/sidebar";
import WorkspaceAddNew from "../molecules/WorkspaceAddNew";
import WorkspaceAddUser from "../molecules/WorkspaceAddUser";
import WorkspaceEdit from "../molecules/WorkspaceEdit";
import WorkspaceTable from "../molecules/WorkspaceTable";
import WorkspaceUserAccessListDialog from "../molecules/WorkspaceUserAccessListDialog";

const WorkspaceMainComponent = () => {
  const { toggleSidebar } = useSidebar();

  const [workspaceUserAccess, setWorkspaceUserAccess] = useState<{
    show: boolean;
    workspace: WorkspaceData;
  }>({
    show: false,
    workspace: {
      workspaceId: "",
      workspaceName: "",
      branchId: "",
      branchName: "",
      workspaceDepartment: "",
      workspaceType: "",
      createdAt: "",
      updatedAt: null,
      seq: 1,
    },
  });
  const [isAddUserOpen, setIsAddUserOpen] = useState<{ show: boolean; form: string }>({
    show: false,
    form: "",
  });
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<WorkspaceData | null>(null);

  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");

  const [expandedCompanies, setExpandedCompanies] = useState<Record<string, boolean>>({});

  const { setHeaderAction } = useUiHeaderStore();

  // Fetch Data
  const { data: companyData } = useGetAllCompanyList();
  const companies = companyData?.result || [];

  const { data: branchData, isLoading: isLoadingBranches } = useGetBranchByCompanyId(
    selectedCompanyId || null,
  );
  const branches = branchData?.result || [];

  const {
    data: workspaceData,
    isLoading,
    isError,
    refetch,
  } = useGetWorkspaceByBranchId(selectedBranchId || null);

  useEffect(() => {
    setHeaderAction({
      label: "Add Workspace",
      onClick: () => setIsAddOpen(true),
      disabled: isLoading || isLoadingBranches || !selectedBranchId,
    });
    return () => setHeaderAction(null);
  }, [setHeaderAction, isLoading, isLoadingBranches, selectedBranchId]);

  const { mutate: createWorkspace, isPending: isCreating } = useCreateWorkspace();
  const { mutate: updateWorkspace, isPending: isUpdating } = useUpdateWorkspace();
  const { mutate: deleteWorkspace, isPending: isDeleting } = useDeleteWorkspace();

  // Filter Workspaces by Branch
  const filteredWorkspaces = workspaceData?.workspaces || [];

  // Auto expand first company and select first branch on load
  useEffect(() => {
    if (companies.length > 0 && !selectedCompanyId) {
      const firstCompany = companies[0];
      setSelectedCompanyId(firstCompany.companyId);
      setExpandedCompanies({ [firstCompany.companyId]: true });
    }
  }, [companies, selectedCompanyId]);

  useEffect(() => {
    if (branches.length > 0 && !selectedBranchId) {
      setSelectedBranchId(branches[0].branchId || "");
    }
  }, [branches, selectedBranchId]);

  useEffect(() => {
    if (isError) {
      toast.error("Failed to fetch workspaces", {
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
    setExpandedCompanies({ [companyId]: true });
    setSelectedCompanyId(companyId);
    setSelectedBranchId("");
  };

  const handleBranchSelect = (branchId: string, companyId: string) => {
    setSelectedBranchId(branchId);
    setSelectedCompanyId(companyId);
  };

  const handleCreate = (data: any) => {
    const payload: CreateWorkspaceRequest = {
      workspaceName: data.workspaceName,
      branchId: data.branchId,
      workspaceDepartment: data.workspaceDepartment,
      workspaceType: data.workspaceType,
      seq: data.seq,
    };

    createWorkspace(payload, {
      onSuccess: (res) => {
        if (res) {
          toast.success("Workspace Created", {
            description: `Workspace ${res.workspaceName} created successfully.`,
          });
          setIsAddOpen(false);
        }
      },
      onError: (error) => {
        toast.error("Failed to create workspace", {
          description: getErrorMessage(error),
        });
      },
    });
  };

  const handleUpdate = (data: any) => {
    if (!selectedWorkspace) return;

    const payload: UpdateWorkspaceRequest = {
      workspaceName: data.workspaceName,
      branchId: data.branchId,
      workspaceDepartment: data.workspaceDepartment,
      seq: data.seq,
    };

    updateWorkspace(
      { workspaceId: selectedWorkspace.workspaceId, payload },
      {
        onSuccess: (res) => {
          if (res) {
            toast.success("Workspace Updated", {
              description: `Workspace ${res.workspaceName} updated successfully.`,
            });
            setIsEditOpen(false);
            setSelectedWorkspace(null);
          }
        },
        onError: (error) => {
          toast.error("Failed to update workspace", {
            description: getErrorMessage(error),
          });
        },
      },
    );
  };

  const handleDelete = (row: WorkspaceData) => {
    setSelectedWorkspace(row);
    setIsDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (!selectedWorkspace) return;

    deleteWorkspace(selectedWorkspace.workspaceId, {
      onSuccess: (res) => {
        if (res) {
          toast.success("Workspace Deleted", {
            description: res.message || "Workspace deleted successfully.",
          });
          setIsDeleteOpen(false);
          setSelectedWorkspace(null);
        }
      },
      onError: (error) => {
        toast.error("Failed to delete workspace", {
          description: getErrorMessage(error),
        });
      },
    });
  };

  const handleEdit = (row: WorkspaceData) => {
    setSelectedWorkspace(row);
    setIsEditOpen(true);
  };

  const selectedBranch = branches.find((b) => b.branchId === selectedBranchId);

  useEffect(() => {
    if (filteredWorkspaces.length > 0) {
      setWorkspaceUserAccess({
        show: true,
        workspace: {
          workspaceId: filteredWorkspaces[0].workspaceId,
          workspaceName: filteredWorkspaces[0].workspaceName,
          branchId: "",
          branchName: "",
          workspaceDepartment: "",
          workspaceType: "",
          createdAt: "",
          updatedAt: null,
          seq: 1,
        },
      });
    }
  }, [filteredWorkspaces]);
  useEffect(() => {
    toggleSidebar(false);
  }, []);

  toggleSidebar;
  return (
    <div className="min-h-full flex flex-col bg-[#f2f5fa] lg:pl-2 md:px-2 lg:px-1 py-1 md:py-2 lg:py-3 overflow-hidden">
      <div className="flex flex-col lg:flex-row gap-2 flex-1 h-full">
        {/* Mobile Selectors */}
        <div className="lg:hidden w-full">
          <Select
            value={selectedCompanyId}
            onValueChange={(val) => {
              toggleCompany(val);
              setSelectedBranchId("");
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
            onValueChange={setSelectedBranchId}
            disabled={!selectedCompanyId}
          >
            <SelectTrigger className="w-full bg-white">
              <SelectValue placeholder="Select Branch" />
            </SelectTrigger>
            <SelectContent>
              {branches.map((branch) => (
                <SelectItem key={branch.branchId} value={branch.branchId || ""}>
                  {branch.branchName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* (Desktop) */}
        <div className="hidden lg:flex flex-col w-64 bg-white border border-[#e5e7eb] shrink-0 rounded-lg shadow-lg">
          <div className="p-3 border-b border-[#f3f4f6] bg-[#f9fafb]/50 sticky top-0 z-10">
            <h3 className="font-semibold text-[#101828] text-sm flex items-center gap-2">
              Select Company & Branch
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
                      selectedCompanyId === company.companyId ? "text-slate-900" : "text-slate-600",
                    )}
                    onClick={() => toggleCompany(company.companyId)}
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
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden ml-4 border-l border-[#e5e7eb] pl-2"
                      >
                        {branches.map((branch) => {
                          const isSelected = selectedBranchId === branch.branchId;
                          return (
                            <div
                              key={branch.branchId}
                              onClick={() =>
                                handleBranchSelect(branch.branchId || "", company.companyId)
                              }
                              className={cn(
                                "flex items-center gap-2 p-2 mt-1 rounded-md cursor-pointer text-sm transition-colors",
                                isSelected
                                  ? "bg-[#eff6ff] text-[#155dfc] font-medium"
                                  : "hover:bg-[#f9fafb] text-[#4b5563]",
                              )}
                            >
                              <GitFork
                                className={cn(
                                  "w-4 h-4 shrink-0",
                                  isSelected ? "text-[#155dfc]" : "text-[#9ca3af]",
                                )}
                              />
                              <span className="truncate text-xs">{branch.branchName}</span>
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

        {/* Workspace Table */}
        <div className="flex-1 min-w-0 flex flex-col">
          {isLoadingBranches ? (
            <div className="flex-1 flex items-center justify-center bg-white rounded-xl border border-dashed border-[#d1d5dc] min-h-[500px] h-full">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-[#1a73e8] border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-[#6a7282] font-medium">Loading branches...</p>
              </div>
            </div>
          ) : selectedBranchId ? (
            <div className="flex-1 flex flex-col h-full">
              <div className="bg-white p-4 rounded-t-xl border-b border-[#f3f4f6] lg:hidden">
                <h2 className="font-semibold text-[#101828]">{selectedBranch?.branchName}</h2>
              </div>
              <WorkspaceTable
                data={filteredWorkspaces}
                isLoading={isLoading}
                onDelete={handleDelete}
                onEdit={handleEdit}
                onRowClick={(workspace: WorkspaceData) => {
                  setWorkspaceUserAccess({
                    show: true,
                    workspace: workspace,
                  });
                }}
                className="flex-1 min-h-0"
                autoSelect={true}
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-white rounded-xl border border-dashed border-[#d1d5dc] min-h-[500px] h-full">
              <div className="text-center p-6">
                <div className="w-12 h-12 bg-[#f3f4f6] rounded-full flex items-center justify-center mx-auto mb-3">
                  <GitFork className="w-6 h-6 text-[#99a1af]" />
                </div>
                <h3 className="text-lg font-medium text-[#101828]">No Branch Selected</h3>
                <p className="text-sm text-[#6a7282] mt-1">
                  Please select a branch to manage workspaces
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="min-w-0 flex flex-col lg:flex-row  max-w-352 ">
          <WorkspaceUserAccessListDialog
            workspaceUserAccess={workspaceUserAccess}
            onClose={() => {
              setWorkspaceUserAccess({
                show: false,
                workspace: {
                  workspaceId: "",
                  workspaceName: "",
                  branchId: "",
                  branchName: "",
                  workspaceDepartment: "",
                  workspaceType: "",
                  createdAt: "",
                  updatedAt: null,
                },
              });
            }}
            onAddUser={(e) => {
              setIsAddUserOpen({ show: true, form: e });
            }}
            onCloseAddUser={isAddUserOpen.show}
          />
        </div>
      </div>

      <WorkspaceAddUser
        show={isAddUserOpen.show}
        selectedCompanyId={selectedCompanyId}
        selectedBranchId={selectedBranchId}
        selectedWorkspace={workspaceUserAccess.workspace.workspaceId}
        form={isAddUserOpen.form}
        onClose={() => {
          setIsAddUserOpen({ show: false, form: "" });
        }}
      />
      <WorkspaceAddNew
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={handleCreate}
        isLoading={isCreating}
        selectedBranchId={selectedBranchId}
        branches={branches}
      />

      <WorkspaceEdit
        open={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleUpdate}
        workspaceData={selectedWorkspace}
        isLoading={isUpdating}
        branches={branches}
      />

      <DeleteConfirmDialog
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Workspace"
        description={`Are you sure you want to delete ${selectedWorkspace?.workspaceName}? This action cannot be undone.`}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default WorkspaceMainComponent;
