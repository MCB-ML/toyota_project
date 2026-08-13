import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useGetAiAgentById } from "@/services/api/aiAgent/getAiAgentById";
import { useCreateAiAgent } from "@/services/api/aiAgent/saveAiAgentConfig";
import { useTestAiAgentConfig } from "@/services/api/aiAgent/testAiAgentConfig";
import { useUpdateAiAgentConfig } from "@/services/api/aiAgent/updateAiAgentConfig";
import { useGetAllWorkspaces } from "@/services/api/workspace/getAllWorkspaces";
import {
  AI_AGENT_ADD_NEW_TABS,
  type AiAgentCreateRequest,
  type AiAgentUpdateRequestPayload,
  type AiAgentWithWorkspace,
} from "@/types/aiAgent.types";

import AiAgentGeneralTab from "../atoms/AiAgentGeneralTab";
import AiAgentPromptTab from "../atoms/AiAgentPromptTab";
import AiAgentTestingTab from "../atoms/AiAgentTestingTab";

type AiAgentAddNewProps = {
  open: boolean;
  onClose: () => void;
  generatedId: string;
  workspaceId: string;
  companyId: string;
  refetchAgents?: () => void;
  editData?: AiAgentWithWorkspace | null;
};

type TabId = (typeof AI_AGENT_ADD_NEW_TABS)[number]["id"];

const AiAgentAddNew = ({
  open,
  onClose,
  generatedId,
  workspaceId,
  companyId,
  refetchAgents,
  editData,
}: AiAgentAddNewProps) => {
  const { t } = useTranslation();
  const { data: workspaceList } = useGetAllWorkspaces();
  const [activeTab, setActiveTab] = useState<TabId>("config");
  const [testFile, setTestFile] = useState<File | null>(null);
  const [testResult, setTestResult] = useState<any>(null);

  const { mutateAsync: createAgent, isPending: isCreating } = useCreateAiAgent();
  const { mutateAsync: updateAgent, isPending: isUpdating } = useUpdateAiAgentConfig();
  const isSubmitting = isCreating || isUpdating;

  // Fetching detail is using mutation (POST request)
  const { mutateAsync: getAgentDetails, isPending: isLoadingDetails } = useGetAiAgentById();

  const { mutateAsync: testConfig, isPending: isTesting } = useTestAiAgentConfig();

  const [formData, setFormData] = useState<Omit<AiAgentCreateRequest, "batch">>({
    agentId: "",
    prompt: "",
    config: {
      agentName: "",
      description: "",
      isActive: true,
      workspaceId: "",
      category: "OCR",
      externalUrl: "",
      seq: 1,
    },
  });

  // Sync props to state
  useEffect(() => {
    const fetchAgentDetails = async (id: string) => {
      try {
        const response = await getAgentDetails(id);
        if (response.success && response.data) {
          const data = response.data;
          setFormData((prev) => ({
            ...prev,
            prompt: data.prompt || "",
            config: {
              ...prev.config,
              ...data.config,
              category: data.config.category || prev.config.category,
              externalUrl: data.config.externalUrl || prev.config.externalUrl,
            },
          }));
        } else {
          toast.error(t("AiAgent.failedToLoadDetails"));
        }
      } catch (_error) {
        toast.error(t("AiAgent.failedToLoadDetails"));
      }
    };

    if (open) {
      setTestFile(null);
      setTestResult(null);
      if (editData) {
        setFormData((prev) => ({
          ...prev,
          agentId: editData.agentId,
          config: {
            agentName: editData.agentName,
            description: editData.description || "",
            isActive: editData.isActive,
            workspaceId: editData.workspaceId,
            category: editData.category || "OCR",
            externalUrl: editData.externalUrl || "",
            seq: editData.seq || 1,
          },
        }));
        // Fetch full details
        fetchAgentDetails(editData.agentId);
      } else {
        setFormData({
          agentId: generatedId,
          prompt: "",
          config: {
            agentName: "",
            description: "",
            isActive: true,
            workspaceId,
            category: "OCR",
            externalUrl: "",
            seq: 1,
          },
        });
      }
      setActiveTab("config");
    }
  }, [open, generatedId, workspaceId, editData]);

  const updateConfig = (key: keyof AiAgentCreateRequest["config"], value: any) => {
    setFormData((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        [key]: value,
      },
    }));
  };

  const isFormValid = () => {
    const isPromptRequired = formData.config.category === "OCR";
    const hasPrompt = isPromptRequired ? formData.prompt.trim().length > 0 : true;
    return hasPrompt && formData.config.agentName.trim().length > 0;
  };

  const handleSave = async () => {
    try {
      const payload: AiAgentCreateRequest = {
        ...formData,
        batch: {
          storageProvider: null,
          containerName: null,
          blobPath: null,
          filePattern: null,
          scheduleType: "manual",
          scheduleExpression: null,
        },
      };

      let response: any;
      if (editData) {
        response = await updateAgent(payload as AiAgentUpdateRequestPayload);
      } else {
        response = await createAgent(payload as AiAgentCreateRequest);
      }

      if (response.success) {
        toast.success(
          response.message || (editData ? t("AiAgent.agentUpdated") : t("AiAgent.agentSaved")),
        );

        if (refetchAgents) refetchAgents();
        onClose();
      } else {
        toast.error(
          response.message || (editData ? t("AiAgent.failedToUpdate") : t("AiAgent.failedToSave")),
        );
      }
    } catch (error: any) {
      console.error("Error saving agent:", error);
      toast.error(error.message || t("AiAgent.errorSaving"));
    }
  };

  const handleRunTest = async () => {
    if (!testFile) {
      toast.error(t("AiAgent.uploadImageFirst"));
      return;
    }

    setTestResult(null);

    try {
      const result = await testConfig({
        file: testFile,
        prompt_yaml: formData.prompt,
        company_info_id: companyId.toUpperCase(),
      });
      setTestResult(result);
      toast.success(t("AiAgent.testCompleted"));
    } catch (error: any) {
      console.error("Test failed:", error);

      const errorDetail = error.response?.data?.detail;
      if (errorDetail?.includes("Invalid YAML")) {
        toast.error(t("AiAgent.invalidYaml"));
      } else {
        toast.error(error.message || t("AiAgent.testFailed"));
      }
    }
  };

  const handleClose = () => {
    if (isTesting) return; // Prevent closing while testing
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent
        className="min-w-3xl max-w-4xl p-0 gap-0 overflow-hidden flex flex-col h-[85vh]"
        onPointerDownOutside={(e) => {
          if (isTesting) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (isTesting) e.preventDefault();
        }}
      >
        <DialogHeader className="px-6 py-4 border-b border-[#f3f4f6] shrink-0">
          <DialogTitle className="text-xl font-semibold text-[#101828]">
            {editData ? t("AiAgent.editAiAgent") : t("AiAgent.addNewAiAgent")}
          </DialogTitle>
        </DialogHeader>

        {/* Tabs Header */}
        <div className="px-6 border-b border-[#f3f4f6] bg-white">
          <div className="flex space-x-6 relative">
            {AI_AGENT_ADD_NEW_TABS.filter((tab) => {
              if (formData.config.category === "OCR") return true;
              return tab.id === "config";
            }).map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  disabled={isLoadingDetails}
                  className={cn(
                    "flex items-center gap-2 py-4 text-sm font-medium transition-colors relative cursor-pointer z-10",
                    isActive ? "text-[#1a73e8]" : "text-[#6a7282] hover:text-[#364153]",
                    isLoadingDetails && "opacity-50 cursor-not-allowed",
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  {t(`AiAgent.${tab.label}` as any)}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1a73e8]"
                      initial={false}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#f9fafb]/30">
          {isLoadingDetails ? (
            <div className="h-full flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-4 border-[#1a73e8] border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-[#6a7282]">{t("AiAgent.loadingDetails")}</span>
              </div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {activeTab === "config" && (
                  <AiAgentGeneralTab
                    data={formData.config}
                    onChange={updateConfig}
                    isEdit={!!editData}
                    workspaces={
                      workspaceList?.workspaces?.filter((w) => {
                        const currentBranchId = workspaceList.workspaces.find(
                          (ws) =>
                            ws.workspaceId === (editData ? editData.workspaceId : workspaceId),
                        )?.branchId;
                        return w.branchId === currentBranchId && w.workspaceType === "aiAgent";
                      }) || []
                    }
                  />
                )}
                {activeTab === "prompt" && (
                  <AiAgentPromptTab
                    value={formData.prompt}
                    onChange={(val) => setFormData((prev) => ({ ...prev, prompt: val }))}
                  />
                )}
                {activeTab === "testing" && (
                  <AiAgentTestingTab
                    prompt_yaml={formData.prompt}
                    company_info_id={companyId.toUpperCase()}
                    file={testFile}
                    onFileChange={setTestFile}
                    testResult={testResult}
                    isTesting={isTesting}
                    onRunTest={handleRunTest}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#f3f4f6] bg-white flex justify-end items-center shrink-0 gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isTesting}
            className="w-24 cursor-pointer"
          >
            {t("common.cancel")}
          </Button>

          <Button
            onClick={handleSave}
            disabled={!isFormValid() || isSubmitting || isLoadingDetails || isTesting}
            className={cn(
              "w-24 cursor-pointer transition-colors",
              isFormValid() && !isSubmitting && !isLoadingDetails
                ? "bg-[#1a73e8] hover:bg-[#1557b0]"
                : "bg-[#99a1af] cursor-not-allowed hover:bg-[#99a1af]",
            )}
          >
            {isSubmitting ? t("AiAgent.saving") : t("common.save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AiAgentAddNew;
