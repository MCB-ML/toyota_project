import Editor from "@monaco-editor/react";
import yaml from "js-yaml";
import { Info } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import FloatingInputField from "@/components/reusable/FloatingInputField";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  detectFileType,
  type PromptCategory,
  type PromptFileType,
  type SystemPrompt,
} from "@/types/systemPrompt.types";

export type PromptDraft = {
  id?: string;
  category: PromptCategory;
  name: string;
  fileName: string;
  fileType: PromptFileType;
  value: string;
};

type Props = {
  open: boolean;
  category: PromptCategory;
  /** null 이면 새로 추가 */
  prompt: SystemPrompt | null;
  isSaving?: boolean;
  onClose: () => void;
  onSave: (draft: PromptDraft) => void;
};

const emptyDraft = (category: PromptCategory): PromptDraft => ({
  category,
  name: "",
  fileName: "",
  fileType: "yaml",
  value: "",
});

/**
 * 이름에서 확장자를 떼어낸다.
 *
 * 확장자는 오른쪽 토글로 정하므로 이름에 넣을 필요가 없다.
 * 그래도 습관적으로 "sales_terms.yaml" 이라고 치는 경우가 있는데,
 * 그대로 두면 sales_terms.yaml.yaml 이 된다.
 */
const stripExtension = (name: string) => name.trim().replace(/\.(ya?ml|md)$/i, "");

const PromptEditorDialog = ({ open, category, prompt, isSaving, onClose, onSave }: Props) => {
  const [draft, setDraft] = useState<PromptDraft>(() => emptyDraft(category));
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;

    setDraft(
      prompt
        ? {
            id: prompt.id,
            category: prompt.category,
            name: prompt.name,
            fileName: prompt.fileName ?? "",
            fileType: prompt.fileType ?? detectFileType(prompt.fileName),
            value: prompt.value ?? "",
          }
        : emptyDraft(category),
    );
  }, [open, prompt, category]);

  const isMarkdown = draft.fileType === "md";

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const fileType = detectFileType(file.name);

    setDraft((prev) => ({
      ...prev,
      // 이름을 아직 안 정했으면 확장자를 뗀 파일명을 기본값으로 쓴다
      name: prev.name || file.name.replace(/\.(ya?ml|md)$/i, ""),
      fileName: file.name,
      fileType,
      value: text,
    }));
  };

  const handleSave = () => {
    const name = stripExtension(draft.name);

    if (!name) {
      toast.error("이름을 입력하세요");
      return;
    }

    if (/[\\/]/.test(name)) {
      toast.error("이름에 / 나 \\ 는 쓸 수 없습니다");
      return;
    }

    if (!draft.value.trim()) {
      toast.error("내용이 비어 있습니다");
      return;
    }

    // yaml 만 형식을 검사한다. md 는 자유 형식이라 검사할 것이 없다.
    if (!isMarkdown) {
      try {
        yaml.load(draft.value);
      } catch {
        toast.error("YAML 형식이 올바르지 않습니다", {
          description: "저장 전에 오류를 수정하세요.",
        });
        return;
      }
    }

    // 확장자를 뗀 이름 + 토글에서 고른 형식으로 저장한다
    onSave({ ...draft, name, fileName: `${name}.${draft.fileType}` });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[70%]! max-w-[1000px]! p-0! gap-0 flex flex-col">
        <DialogHeader className="px-6 py-4 border-b border-[#e5e7eb]">
          <DialogTitle className="text-lg font-semibold text-[#101828]">
            {prompt ? "프롬프트 편집" : "프롬프트 추가"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 px-6 py-4">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <FloatingInputField
                id="promptName"
                label="이름"
                value={draft.name}
                onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
                placeholder="예: sales_terms"
                error={false}
              />
            </div>

            {/*
              파일 없이 백지에서 만드는 경우 확장자를 유추할 수 없다.
              직접 고를 수 있어야 한다. 저장 시 이름 + 이 확장자로 파일명이 정해진다.
            */}
            <div className="flex h-[42px] shrink-0 items-center overflow-hidden rounded-md border">
              {(["yaml", "md"] as const).map((ft) => (
                <button
                  key={ft}
                  type="button"
                  onClick={() => setDraft((p) => ({ ...p, fileType: ft }))}
                  className={`h-full px-3.5 text-xs font-medium uppercase transition ${
                    draft.fileType === ft
                      ? "bg-[#1a73e8] text-white"
                      : "bg-white text-[#5a6a7a] hover:bg-[#F1F6FD]"
                  }`}
                >
                  {ft}
                </button>
              ))}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".yaml,.yml,.md"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="h-[42px] shrink-0 rounded-md border bg-white px-4 text-sm text-[#1a73e8] hover:bg-[#F1F6FD]"
            >
              파일 불러오기
            </button>
          </div>

          {/* 저장될 파일명을 미리 보여준다. 확장자는 토글에서 정해지므로 이름에 넣지 않아도 된다. */}
          <p className="-mt-1 text-xs text-[#8a94a0]">
            저장 파일명{" "}
            <span className="font-medium text-[#5a6a7a]">
              {stripExtension(draft.name)
                ? `${stripExtension(draft.name)}.${draft.fileType}`
                : `이름.${draft.fileType}`}
            </span>
            <span className="ml-2">— 확장자는 자동으로 붙습니다</span>
          </p>

          <div className="flex items-start gap-3 rounded-lg bg-[#F1F6FD] p-3">
            <Info size={18} className="mt-0.5 shrink-0 text-[#1a73e8]" />
            <div className="text-xs text-[#5a6a7a]">
              <p className="font-medium text-[#101828]">
                {isMarkdown ? "Markdown 편집" : "YAML 편집"}
              </p>
              <p className="mt-0.5">
                {isMarkdown
                  ? "자유 형식입니다. 저장 시 형식 검사를 하지 않습니다."
                  : "저장할 때 YAML 형식을 검사합니다."}
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <Editor
              height="440px"
              language={isMarkdown ? "markdown" : "yaml"}
              value={draft.value}
              onChange={(v) => setDraft((p) => ({ ...p, value: v ?? "" }))}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                wordWrap: "on",
                scrollBeyondLastLine: false,
              }}
            />
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-[#e5e7eb] gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            취소
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[#1a73e8] hover:bg-[#1557b0] text-white"
          >
            {isSaving ? "저장 중..." : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PromptEditorDialog;
