import { motion } from "framer-motion";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import FloatingInputField from "@/components/reusable/FloatingInputField";
import FloatingSelectField from "@/components/reusable/FloatingSelectField";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { AiAgentCreateRequest } from "@/types/aiAgent.types";
import type { WorkspaceData } from "@/types/workspace.types";

const CATEGORY_OPTIONS = [
  { value: "OCR", label: "OCR" },
  { value: "Vertex", label: "Vertex" },
  { value: "Others", label: "Others" },
];

type AiAgentGeneralTabProps = {
  data: AiAgentCreateRequest["config"];
  onChange: <K extends keyof AiAgentCreateRequest["config"]>(
    key: K,
    value: AiAgentCreateRequest["config"][K],
  ) => void;
  workspaces: WorkspaceData[];
  isEdit?: boolean;
};

const AiAgentGeneralTab = ({
  data,
  onChange,
  workspaces,
  isEdit = false,
}: AiAgentGeneralTabProps) => {
  const { t } = useTranslation();

  const workspaceOptions = useMemo(
    () =>
      workspaces.map((w) => ({
        value: w.workspaceId,
        label: w.workspaceName,
      })),
    [workspaces],
  );

  const _currentWorkspaceName = useMemo(() => {
    if (isEdit) return "";
    return (
      workspaces.find((w) => w.workspaceId === data.workspaceId)?.workspaceName || data.workspaceId
    );
  }, [workspaces, data.workspaceId, isEdit]);

  const handleTextChange =
    (key: keyof AiAgentCreateRequest["config"]) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onChange(key, e.target.value);
    };

  const showUrlField: boolean = data.category === "Others";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Category Selector Only On Add New */}
      {isEdit ? (
        <FloatingInputField
          id="category"
          label={t("AiAgent.category")}
          value={data.category}
          onChange={() => {}}
          readOnly
          className="bg-[#f9fafb]"
        />
      ) : (
        <FloatingSelectField
          id="category"
          label={t("AiAgent.category")}
          value={data.category}
          placeholder={t("AiAgent.selectCategory")}
          options={CATEGORY_OPTIONS}
          onChange={(val) => onChange("category", val)}
        />
      )}

      <FloatingInputField
        id="agentName"
        label={t("AiAgent.agentName")}
        value={data.agentName}
        onChange={handleTextChange("agentName")}
        required
      />

      <FloatingInputField
        id="description"
        label={t("AiAgent.description")}
        value={data.description}
        onChange={handleTextChange("description")}
        multiline
        rows={2}
      />

      {/* Workspace Selector Only On Edit */}
      {isEdit && (
        <FloatingSelectField
          id="workspaceId"
          label={t("AiAgent.workspace")}
          value={data.workspaceId}
          placeholder={t("AiAgent.selectWorkspace")}
          options={workspaceOptions}
          onChange={(val) => onChange("workspaceId", val)}
        />
      )}

      {showUrlField && (
        <FloatingInputField
          id="url"
          label={t("AiAgent.externalUrl")}
          value={data.externalUrl || ""}
          onChange={handleTextChange("externalUrl")}
        />
      )}
      <FloatingInputField
        id="seq"
        label="Sequence"
        value={data.seq}
        type="number"
        onChange={handleTextChange("seq")}
        placeholder="Enter Sequence"
        error={false}
      />
      {/* Active Status Card */}
      <div className="flex items-center justify-between p-4 bg-card rounded-lg border border-border">
        <div className="space-y-0.5">
          <Label className="text-base font-medium text-foreground">
            {t("AiAgent.activeStatus")}
          </Label>
          <div className="text-sm text-muted-foreground">{t("AiAgent.activeStatusDesc")}</div>
        </div>
        <Switch
          checked={data.isActive}
          onCheckedChange={(checked) => onChange("isActive", checked)}
        />
      </div>
    </motion.div>
  );
};

export default AiAgentGeneralTab;
