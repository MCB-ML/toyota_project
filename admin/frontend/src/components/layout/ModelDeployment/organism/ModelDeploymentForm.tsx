import type React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MODEL_KINDS, MODEL_PROVIDERS, REASONING_EFFORTS } from "../../../../types/model.types";
import type { ModelDeploymentReducerState } from "../../../../types/modelDeployment.types";
import FloatingInputField from "../../../reusable/FloatingInputField";
import FloatingSelectField from "../../../reusable/FloatingSelectField";
import LoadingPage from "../../../reusable/loadingPage";
import type { ModelDeploymentAction } from "../ModelDeployment.reducer";

export interface ModelDeploymentFormProps {
  open: boolean;
  onClose: () => void;
  isLoading: boolean;
  preventCloseOnOutsideClick?: boolean;
  layOutSizeConfirmation?: string;
  state: ModelDeploymentReducerState;
  dispatch: React.Dispatch<ModelDeploymentAction>;
  handleSubmitForm: () => void;
}

const ModelDeploymentForm = ({
  open,
  onClose,
  isLoading,
  state,
  dispatch,
  handleSubmitForm,
}: ModelDeploymentFormProps) => {
  const form = state.form;
  const isEdit = state.showForm.mode !== 1;

  const setField = (field: string, value: unknown) => dispatch({ type: "formField", field, value });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[56%]! max-w-[760px]! p-0! gap-0 flex flex-col">
        <DialogHeader className="px-6 py-4 border-b border-[#e5e7eb]">
          <DialogTitle className="text-lg font-semibold text-[#101828]">
            {isEdit ? "모델 수정" : "모델 추가"}
          </DialogTitle>
        </DialogHeader>

        <div className="relative max-h-[70vh] overflow-auto px-6 py-4">
          <LoadingPage isLoading={isLoading} />

          <div className="mb-4 rounded-lg bg-[#F1F6FD] px-4 py-3 text-xs text-[#5a6a7a]">
            접속 키(엔드포인트 · API Key)는 여기서 등록하지 않습니다. 딜러사마다 키가 달라
            <b className="text-[#101828]"> 회사 정보 편집</b> 화면에서 딜러사별로 관리합니다.
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FloatingInputField
              id="displayName"
              label="표시 이름"
              value={form.displayName ?? ""}
              onChange={(e) => setField("displayName", e.target.value)}
              placeholder="예: Claude Sonnet 4.5"
              error={false}
            />

            <FloatingSelectField
              id="provider"
              label="Provider"
              placeholder="Provider 선택"
              value={form.provider ?? "bedrock"}
              onChange={(v: string) => setField("provider", v)}
              options={MODEL_PROVIDERS.map((p) => ({ value: p, label: p }))}
            />

            <div className="md:col-span-2">
              <FloatingInputField
                id="modelId"
                label="모델 식별자"
                value={form.modelId ?? ""}
                onChange={(e) => setField("modelId", e.target.value)}
                placeholder="예: anthropic.claude-sonnet-4-5-20250929-v1:0"
                error={false}
              />
            </div>

            <FloatingSelectField
              id="modelKind"
              label="종류"
              placeholder="종류 선택"
              value={form.modelKind ?? "llm"}
              onChange={(v: string) => setField("modelKind", v)}
              options={MODEL_KINDS.map((k) => ({ value: k, label: k }))}
            />

            <FloatingInputField
              id="apiVersion"
              label="API Version"
              value={form.apiVersion ?? ""}
              onChange={(e) => setField("apiVersion", e.target.value)}
              placeholder="필요한 provider 만"
              error={false}
            />

            <FloatingInputField
              id="maxToken"
              label="Max Token"
              type="number"
              value={form.maxToken ?? ""}
              onChange={(e) => setField("maxToken", e.target.value)}
              error={false}
            />

            <FloatingInputField
              id="temperature"
              label="Temperature"
              type="number"
              value={form.temperature ?? ""}
              onChange={(e) => setField("temperature", e.target.value)}
              placeholder="0.0 ~ 2.0"
              error={false}
            />

            <FloatingInputField
              id="topP"
              label="Top P"
              type="number"
              value={form.topP ?? ""}
              onChange={(e) => setField("topP", e.target.value)}
              error={false}
            />

            <FloatingInputField
              id="topK"
              label="Top K"
              type="number"
              value={form.topK ?? ""}
              onChange={(e) => setField("topK", e.target.value)}
              error={false}
            />

            <FloatingSelectField
              id="reasoningEffort"
              label="Reasoning Effort"
              placeholder="사용 안 함"
              value={form.reasoningEffort ?? ""}
              onChange={(v: string) => setField("reasoningEffort", v)}
              options={REASONING_EFFORTS.map((r) => ({ value: r, label: r }))}
            />

            {form.modelKind === "embedding" && (
              <FloatingInputField
                id="embeddingModel"
                label="Embedding Model"
                value={form.embeddingModel ?? ""}
                onChange={(e) => setField("embeddingModel", e.target.value)}
                error={false}
              />
            )}
          </div>

          <label className="mt-4 flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isActive !== false}
              onChange={(e) => setField("isActive", e.target.checked)}
              className="h-4 w-4 accent-[#1a73e8]"
            />
            <span className="text-sm text-[#101828]">활성</span>
          </label>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-[#e5e7eb] gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            닫기
          </Button>
          <Button
            onClick={handleSubmitForm}
            disabled={isLoading}
            className="bg-[#1a73e8] hover:bg-[#1557b0] text-white"
          >
            {isEdit ? "수정" : "추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ModelDeploymentForm;
